"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ListFilter } from "lucide-react";
import gsap from "gsap";
import { PersonalTaskWithDetails, PersonalTaskCategory, PersonalTaskStatus } from "@/lib/types/personal-tasks";
import { TaskCard } from "@/components/personal-tasks/TaskCard";
import { Badge } from "@/components/ui/badge";
import { updateTask } from "@/actions/personal-tasks";

interface KanbanViewProps {
  tasks: PersonalTaskWithDetails[];
  categories: PersonalTaskCategory[];
  onTaskClick: (task: PersonalTaskWithDetails) => void;
  onTaskComplete: (task: PersonalTaskWithDetails) => void;
  onTaskArchive: (task: PersonalTaskWithDetails) => void;
  onUpdate: () => void;
}

export function KanbanView({
  tasks,
  categories,
  onTaskClick,
  onTaskComplete,
  onTaskArchive,
  onUpdate
}: KanbanViewProps) {
  const [isBrowser, setIsBrowser] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterToday, setFilterToday] = useState<boolean>(true);

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

  const todayStr = new Date().toISOString().split("T")[0];

  const isOverdue = (task: PersonalTaskWithDetails) => {
    return task.deadline && task.deadline < todayStr && task.status !== "done";
  };

  const isToday = (task: PersonalTaskWithDetails) => {
    return task.date === todayStr;
  };

  const filtered = useMemo(() => {
    return tasks.filter(task => {
      // Hide archived from Kanban
      if (task.status === "archived") return false;

      if (filterToday) {
        if (!isToday(task) && !isOverdue(task)) return false;
      }
      if (filterPriority !== 'all') {
        if (filterPriority === 'none') {
          if (task.priority !== null) return false;
        } else {
          if (task.priority !== filterPriority) return false;
        }
      }
      if (filterCategory !== 'all') {
        if (filterCategory === 'none') {
          if (task.category_id !== null) return false;
        } else {
          if (task.category_id !== filterCategory) return false;
        }
      }
      return true;
    });
  }, [tasks, filterPriority, filterCategory, filterToday]);

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
      await updateTask(draggableId, { status: newStatus });
      onUpdate();
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
      <div className="flex flex-wrap gap-4 items-center bg-[#F5F5F0] p-4 rounded-[1.5rem] border-[2px] border-black shadow-[4px_4px_0_black] shrink-0">
        <div className="flex items-center gap-2 border-r-2 border-black/10 pr-4">
          <ListFilter className="w-5 h-5 text-[#555550] mr-2" />
          <span className="font-space text-[10px] font-bold text-[#555550]">KANBAN FILTERS</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-2 py-1.5 bg-white border-2 border-black rounded-[0.75rem] font-vietnam text-sm focus:shadow-[2px_2px_0_black] outline-none cursor-pointer"
          >
            <option value="all">Priority: All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="none">None</option>
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-2 py-1.5 bg-white border-2 border-black rounded-[0.75rem] font-vietnam text-sm focus:shadow-[2px_2px_0_black] outline-none cursor-pointer max-w-[150px]"
          >
            <option value="all">Category: All</option>
            <option value="none">Uncategorized</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => setFilterToday(!filterToday)}
            className={`ml-2 px-4 py-1.5 border-2 border-black rounded-full font-space text-sm font-bold transition-all cursor-pointer ${filterToday
                ? 'bg-black text-white shadow-none translate-y-[2px] translate-x-[2px]'
                : 'bg-white text-black shadow-[2px_2px_0_black] hover:-translate-y-[1px]'
              }`}
          >
            Today
          </button>
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
                className={`flex-1 bg-[#F5F5F0] border-[3px] border-black rounded-[2rem] flex flex-col overflow-hidden transition-colors shadow-[6px_6px_0_black] ${snapshot.isDraggingOver ? 'bg-[#E8E8E0]' : ''}`}
              >
                <div className="p-4 border-b-[3px] border-black bg-white flex justify-between items-center z-10 shrink-0">
                  <h3 className="font-jakarta font-bold text-[18px]">Todo</h3>
                  <Badge className="bg-[#E8E8E0] text-black hover:bg-[#E8E8E0] font-space border-[1.5px] border-black shadow-[2px_2px_0_black] pointer-events-none">
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
                            onUpdate={onUpdate}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {todoTasks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#999990] font-space text-sm py-10 opacity-60">
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
                className={`flex-1 bg-[#F5F5F0] border-[3px] border-black rounded-[2rem] flex flex-col overflow-hidden transition-colors shadow-[6px_6px_0_black] ${snapshot.isDraggingOver ? 'bg-[#E8E8E0]' : ''}`}
              >
                <div className="p-4 border-b-[3px] border-black bg-white flex justify-between items-center z-10 shrink-0">
                  <h3 className="font-jakarta font-bold text-[18px] flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FFD600] border-2 border-black inline-block"></span>
                    In Progress
                  </h3>
                  <Badge className="bg-[#E8E8E0] text-black hover:bg-[#E8E8E0] font-space border-[1.5px] border-black shadow-[2px_2px_0_black] pointer-events-none">
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
                            onUpdate={onUpdate}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {inProgressTasks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#999990] font-space text-sm py-10 opacity-60">
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
                className={`flex-1 bg-[#E8E8E0]/40 border-[3px] border-black rounded-[2rem] flex flex-col overflow-hidden transition-colors shadow-[6px_6px_0_black] opacity-90 ${snapshot.isDraggingOver ? 'bg-[#E8E8E0]' : ''}`}
              >
                <div className="p-4 border-b-[3px] border-black bg-[#E8E8E0] flex justify-between items-center z-10 shrink-0">
                  <h3 className="font-jakarta font-bold text-[18px] text-[#555550]">Done</h3>
                  <Badge className="bg-transparent text-[#555550] hover:bg-transparent font-space border-[1.5px] border-[#555550] shadow-[2px_2px_0_#555550] pointer-events-none">
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
                            onUpdate={onUpdate}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {doneTasks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#999990] font-space text-sm py-10 opacity-60">
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
