"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ListFilter } from "lucide-react";
import gsap from "gsap";
import { PersonalTaskWithDetails, PersonalTaskCategory, PersonalTaskStatus } from "@/lib/types/personal-tasks";
import { TaskCard } from "@/components/personal-tasks/TaskCard";
import { Badge } from "@/components/ui/badge";
import { useUpdateTask } from "@/lib/hooks/use-personal-tasks";

interface KanbanViewProps {
  tasks: PersonalTaskWithDetails[];
  categories: PersonalTaskCategory[];
  onTaskClick: (task: PersonalTaskWithDetails) => void;
  onTaskComplete: (task: PersonalTaskWithDetails) => void;
  onTaskArchive: (task: PersonalTaskWithDetails) => void;
  onTaskDelete: (task: PersonalTaskWithDetails) => void;
}

export function KanbanView({
  tasks,
  categories,
  onTaskClick,
  onTaskComplete,
  onTaskArchive,
  onTaskDelete,
}: KanbanViewProps) {
  const [isBrowser, setIsBrowser] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const updateTaskMutation = useUpdateTask();

type Timeframe = 'today' | 'week' | 'month' | 'custom';

  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Hydration workaround for react-beautiful-dnd
  useEffect(() => {
    setIsBrowser(true);

    if (boardRef.current) {
      gsap.fromTo(boardRef.current.children,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.2)" }
      );
    }
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter(task => {
      // Hide archived from Kanban
      if (task.status === "archived") return false;
      // Hide recurring tasks
      if (task.is_recurring) return false;

      let targetStart = '';
      let targetEnd = '';

      if (timeframe === 'today') {
        targetStart = new Date().toISOString().split("T")[0];
        targetEnd = targetStart;
      } else if (timeframe === 'custom') {
        targetStart = customDate;
        targetEnd = customDate;
      } else if (timeframe === 'week') {
        const curr = new Date();
        const first = curr.getDate() - curr.getDay(); 
        targetStart = new Date(curr.setDate(first)).toISOString().split("T")[0];
        targetEnd = new Date(curr.setDate(first + 6)).toISOString().split("T")[0];
      } else if (timeframe === 'month') {
        const curr = new Date();
        targetStart = new Date(curr.getFullYear(), curr.getMonth(), 1).toISOString().split("T")[0];
        targetEnd = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).toISOString().split("T")[0];
      }

      // Check if task falls in the timeframe
      // 1. Task scheduled exactly on a day in timeframe
      const isDateInRange = task.date && task.date >= targetStart && task.date <= targetEnd;
      
      // 2. Task spans the timeframe
      const spansTimeframe = task.date && task.deadline && task.date <= targetEnd && task.deadline >= targetStart;
      
      // 3. Task is currently in progress (always relevant for today)
      const isCurrentlyDoing = task.status === "in_progress" && timeframe === 'today';
      
      // 4. Task was done within the timeframe
      const wasDoneInRange = task.status === "done" && task.completed_at && 
        task.completed_at.split("T")[0] >= targetStart && task.completed_at.split("T")[0] <= targetEnd;
      
      // 5. For 'today', include tasks that are overdue but not done
      const todayStr = new Date().toISOString().split("T")[0];
      const isOverdue = timeframe === 'today' && task.deadline && task.deadline < todayStr && task.status !== "done";

      return isDateInRange || spansTimeframe || isCurrentlyDoing || wasDoneInRange || isOverdue;
    });
  }, [tasks, timeframe, customDate]);

  const getSortedColumnTasks = (status: PersonalTaskStatus) => {
    const colTasks = filtered.filter(t => t.status === status);
    colTasks.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return 0; // maintain order
    });
    return colTasks;
  };

  const todoTasks = getSortedColumnTasks("todo");
  const inProgressTasks = getSortedColumnTasks("in_progress");
  const doneTasks = getSortedColumnTasks("done");

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return; // intra-column drag ignored

    const newStatus = destination.droppableId as PersonalTaskStatus;

    try {
      await updateTaskMutation.mutateAsync({ taskId: draggableId, fields: { status: newStatus } });
    } catch (e) {
      console.error("Failed to move task", e);
    }
  };

  const getDragStyle = (style: any, isDragging: boolean) => {
    if (!isDragging) return style;
    if (!style?.transform) return style;
    return {
      ...style,
      transform: `${style.transform} rotate(3deg)`,
      zIndex: 9999,
    };
  };

  if (!isBrowser) return null;

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-center bg-background px-4 py-2.5 rounded-[1rem] border-2 border-foreground shadow-[2px_2px_0_black] shrink-0">
        <div className="flex items-center gap-2 border-r-2 border-foreground/10 pr-4">
          <ListFilter className="w-4 h-4 text-muted-foreground" />
          <span className="font-space text-[10px] font-bold text-muted-foreground">KANBAN FILTERS</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTimeframe('today')}
            className={`px-4 py-1.5 border-2 border-foreground rounded-full font-space text-sm font-bold transition-all cursor-pointer ${timeframe === 'today'
              ? 'bg-[#FFD600] text-foreground shadow-none translate-y-[2px] translate-x-[2px]'
              : 'bg-card text-foreground shadow-[2px_2px_0_black] hover:-translate-y-[1px]'
              }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-4 py-1.5 border-2 border-foreground rounded-full font-space text-sm font-bold transition-all cursor-pointer ${timeframe === 'week'
              ? 'bg-[#FFD600] text-foreground shadow-none translate-y-[2px] translate-x-[2px]'
              : 'bg-card text-foreground shadow-[2px_2px_0_black] hover:-translate-y-[1px]'
              }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-1.5 border-2 border-foreground rounded-full font-space text-sm font-bold transition-all cursor-pointer ${timeframe === 'month'
              ? 'bg-[#FFD600] text-foreground shadow-none translate-y-[2px] translate-x-[2px]'
              : 'bg-card text-foreground shadow-[2px_2px_0_black] hover:-translate-y-[1px]'
              }`}
          >
            This Month
          </button>

          <div className="flex items-center gap-2 ml-2">
            <span className="font-space text-[10px] font-bold text-muted-foreground">CUSTOM DATE</span>
            <input
              type="date"
              value={timeframe === 'custom' ? customDate : ''}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setTimeframe('custom');
              }}
              onClick={() => setTimeframe('custom')}
              className={`px-2 py-1.5 bg-card border-2 border-foreground rounded-[0.75rem] font-vietnam text-sm outline-none cursor-pointer ${timeframe === 'custom' ? 'bg-[#FFD600] shadow-none translate-y-[2px] translate-x-[2px]' : 'shadow-[2px_2px_0_black] focus:shadow-[2px_2px_0_black]'}`}
            />
          </div>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div ref={boardRef} className="flex gap-6 items-stretch h-[calc(100vh-280px)] min-h-[500px]">

          {/* Todo Column */}
          <Droppable droppableId="todo">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex-1 bg-[#F0F8FF] border-[3px] border-foreground rounded-[2rem] flex flex-col overflow-hidden transition-colors shadow-[6px_6px_0_black] ${snapshot.isDraggingOver ? 'bg-[#E1F0FF]' : ''}`}
              >
                <div className="p-4 border-b-[3px] border-foreground bg-card flex justify-between items-center z-10 shrink-0">
                  <h3 className="font-jakarta font-bold text-[18px] flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#007AFF] border-2 border-foreground inline-block"></span>
                    Todo
                  </h3>
                  <Badge className="bg-muted text-foreground hover:bg-muted font-space border-[1.5px] border-foreground shadow-[2px_2px_0_black] pointer-events-none">
                    {todoTasks.length}
                  </Badge>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {todoTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getDragStyle(provided.draggableProps.style, snapshot.isDragging)}
                          className={snapshot.isDragging ? "[&>div]:!shadow-[8px_8px_0_rgba(0,0,0,1)] [&>div]:bg-[#FFFDE7]" : "[&>div]:bg-[#FFFDE7]"}
                        >
                          <TaskCard
                            task={task}
                            onClick={() => onTaskClick(task)}
                            onComplete={() => onTaskComplete(task)}
                            onArchive={() => onTaskArchive(task)}
                            onDelete={() => onTaskDelete(task)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {todoTasks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/70 font-space text-sm py-10 opacity-60">
                      No tasks here.
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>

          {/* In Progress Column */}
          <Droppable droppableId="in_progress">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex-1 bg-[#FFF4E6] border-[3px] border-foreground rounded-[2rem] flex flex-col overflow-hidden transition-colors shadow-[6px_6px_0_black] ${snapshot.isDraggingOver ? 'bg-[#FFE8CC]' : ''}`}
              >
                <div className="p-4 border-b-[3px] border-foreground bg-card flex justify-between items-center z-10 shrink-0">
                  <h3 className="font-jakarta font-bold text-[18px] flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF9500] border-2 border-foreground inline-block"></span>
                    In Progress
                  </h3>
                  <Badge className="bg-muted text-foreground hover:bg-muted font-space border-[1.5px] border-foreground shadow-[2px_2px_0_black] pointer-events-none">
                    {inProgressTasks.length}
                  </Badge>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {inProgressTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getDragStyle(provided.draggableProps.style, snapshot.isDragging)}
                          className={snapshot.isDragging ? "[&>div]:!shadow-[8px_8px_0_rgba(0,0,0,1)] [&>div]:bg-[#FFFDE7]" : "[&>div]:bg-[#FFFDE7]"}
                        >
                          <TaskCard
                            task={task}
                            onClick={() => onTaskClick(task)}
                            onComplete={() => onTaskComplete(task)}
                            onArchive={() => onTaskArchive(task)}
                            onDelete={() => onTaskDelete(task)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {inProgressTasks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/70 font-space text-sm py-10 opacity-60">
                      No tasks here.
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>

          {/* Done Column */}
          <Droppable droppableId="done">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex-1 bg-[#E6F9EC] border-[3px] border-foreground rounded-[2rem] flex flex-col overflow-hidden transition-colors shadow-[6px_6px_0_black] opacity-90 ${snapshot.isDraggingOver ? 'bg-[#CCF2D9]' : ''}`}
              >
                <div className="p-4 border-b-[3px] border-foreground bg-card flex justify-between items-center z-10 shrink-0">
                  <h3 className="font-jakarta font-bold text-[18px] text-foreground flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#00C853] border-2 border-foreground inline-block"></span>
                    Done
                  </h3>
                  <Badge className="bg-muted text-foreground hover:bg-muted font-space border-[1.5px] border-foreground shadow-[2px_2px_0_black] pointer-events-none">
                    {doneTasks.length}
                  </Badge>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {doneTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getDragStyle(provided.draggableProps.style, snapshot.isDragging)}
                          className={`opacity-70 ${snapshot.isDragging ? "[&>div]:!shadow-[8px_8px_0_rgba(0,0,0,1)] [&>div]:bg-[#FFFDE7]" : "[&>div]:bg-[#FFFDE7]"}`}
                        >
                          <TaskCard
                            task={task}
                            onClick={() => onTaskClick(task)}
                            onComplete={() => onTaskComplete(task)}
                            onArchive={() => onTaskArchive(task)}
                            onDelete={() => onTaskDelete(task)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {doneTasks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/70 font-space text-sm py-10 opacity-60">
                      No tasks here.
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>

        </div>
      </DragDropContext>
    </div>
  );
}
