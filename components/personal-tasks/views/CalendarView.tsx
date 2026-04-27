"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import gsap from "gsap";
import { ChevronLeft, ChevronRight, Pin, Clock, X } from "lucide-react";
import { PersonalTaskWithDetails } from "@/lib/types/personal-tasks";
import { updateTask } from "@/actions/personal-tasks";
import { Button } from "@/components/ui/button";

interface CalendarViewProps {
  tasks: PersonalTaskWithDetails[];
  onTaskClick: (task: PersonalTaskWithDetails) => void;
  onTaskComplete: (task: PersonalTaskWithDetails) => void;
  onTaskArchive: (task: PersonalTaskWithDetails) => void;
  onUpdate: () => void;
}

export function CalendarView({
  tasks,
  onTaskClick,
  onUpdate
}: CalendarViewProps) {
  const [isBrowser, setIsBrowser] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [popoverDay, setPopoverDay] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // GSAP animation for grid when mode or date changes
  useEffect(() => {
    if (gridRef.current) {
      gsap.fromTo(gridRef.current.children,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.3, stagger: 0.015, ease: "power2.out", clearProps: "all" }
      );
    }
  }, [currentDate, viewMode]);

  const formatDateObj = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatDateObj(new Date());

  const generateMonthGrid = (year: number, month: number) => {
    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const grid = [];
    let dayCounter = 1;
    let nextMonthDayCounter = 1;
    let prevMonthDays = getDaysInMonth(year, month - 1);

    for (let i = 0; i < 42; i++) {
      if (i < firstDay) {
        const d = prevMonthDays - firstDay + i + 1;
        grid.push({ date: new Date(year, month - 1, d), isCurrentMonth: false });
      } else if (dayCounter <= daysInMonth) {
        grid.push({ date: new Date(year, month, dayCounter), isCurrentMonth: true });
        dayCounter++;
      } else {
        grid.push({ date: new Date(year, month + 1, nextMonthDayCounter), isCurrentMonth: false });
        nextMonthDayCounter++;
      }
    }
    return grid;
  };

  const getWeekGrid = (date: Date) => {
    const grid = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      grid.push({ date: d, isCurrentMonth: d.getMonth() === date.getMonth() });
    }
    return grid;
  };

  const gridDays = useMemo(() => {
    return viewMode === 'month'
      ? generateMonthGrid(currentDate.getFullYear(), currentDate.getMonth())
      : getWeekGrid(currentDate);
  }, [currentDate, viewMode]);

  const goPrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const goNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  const isOverdue = (task: PersonalTaskWithDetails) => {
    return task.deadline && task.deadline < todayStr && task.status !== "done";
  };

  const tasksByDate = useMemo(() => {
    const map = new Map<string, PersonalTaskWithDetails[]>();
    tasks.forEach(task => {
      if (task.status === "archived") return;

      let targetDateStr = null;
      if (isOverdue(task)) {
        targetDateStr = todayStr;
      } else if (task.date) {
        targetDateStr = task.date;
      } else if (task.deadline) {
        targetDateStr = task.deadline;
      }

      if (targetDateStr) {
        if (!map.has(targetDateStr)) map.set(targetDateStr, []);
        map.get(targetDateStr)!.push(task);
      }
    });

    // Sort tasks in each cell: pinned first, then high priority
    map.forEach(dayTasks => {
      dayTasks.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        const pVals = { high: 3, medium: 2, low: 1 };
        const valA = pVals[a.priority as keyof typeof pVals] || 0;
        const valB = pVals[b.priority as keyof typeof pVals] || 0;
        return valB - valA;
      });
    });

    return map;
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const newDateStr = destination.droppableId;

    try {
      await updateTask(draggableId, { date: newDateStr });
      onUpdate();
    } catch (e) {
      console.error("Failed to move task in calendar", e);
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-[#FF3B30] text-white';
      case 'medium': return 'bg-[#FFD600] text-black';
      case 'low': return 'bg-[#00C853] text-white';
      default: return 'bg-[#E8E8E0] text-black';
    }
  };

  const getDragStyle = (style: any, isDragging: boolean) => {
    if (!isDragging) return style;
    if (!style?.transform) return style;
    return {
      ...style,
      transform: `${style.transform} rotate(4deg)`,
      boxShadow: '4px 4px 0 rgba(0,0,0,1)',
      zIndex: 9999,
    };
  };

  if (!isBrowser) return null;

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">

      {/* Navigation Row */}
      <div className="flex justify-between items-center bg-[#F5F5F0] border-[3px] border-black rounded-[2rem] p-4 shadow-[6px_6px_0_black] shrink-0">
        <div className="flex items-center gap-4">
          <Button
            onClick={goPrev}
            variant="outline"
            className="border-2 border-black rounded-[0.875rem] shadow-[2px_2px_0_black] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_black] transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            onClick={goNext}
            variant="outline"
            className="border-2 border-black rounded-[0.875rem] shadow-[2px_2px_0_black] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_black] transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <h2 className="font-jakarta font-bold text-2xl w-48 text-center ml-2">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={goToday}
            className="bg-white text-black hover:bg-white border-2 border-black rounded-[0.875rem] shadow-[2px_2px_0_black] font-space font-bold hover:-translate-y-[1px] hover:shadow-[3px_3px_0_black] transition-all"
          >
            Today
          </Button>
          <div className="bg-white border-2 border-black rounded-[0.875rem] p-1 flex shadow-[2px_2px_0_black]">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-1.5 font-bold font-vietnam text-sm rounded-[0.5rem] transition-colors cursor-pointer ${viewMode === 'month' ? 'bg-[#FFD600] border-[1.5px] border-black shadow-[2px_2px_0_black]' : 'text-[#555550] hover:bg-[#F5F5F0]'}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 font-bold font-vietnam text-sm rounded-[0.5rem] transition-colors cursor-pointer ${viewMode === 'week' ? 'bg-[#FFD600] border-[1.5px] border-black shadow-[2px_2px_0_black]' : 'text-[#555550] hover:bg-[#F5F5F0]'}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Area */}
      <div className="flex flex-col flex-1 min-h-0 bg-white border-[3px] border-black rounded-[1.5rem] shadow-[6px_6px_0_black] overflow-hidden">

        {/* Day Labels */}
        <div className="grid grid-cols-7 bg-[#E8E8E0] border-b-[3px] border-black shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center font-space font-bold text-[#0A0A0A] border-r-[3px] border-black last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            ref={gridRef}
            className={`grid grid-cols-7 bg-black gap-[3px] flex-1 ${viewMode === 'month' ? 'auto-rows-fr' : 'h-[calc(100vh-280px)] min-h-[400px]'}`}
          >
            {gridDays.map(dayObj => {
              const dateStr = formatDateObj(dayObj.date);
              const isTodayCell = dateStr === todayStr;
              const showTasks = viewMode === 'week' || dayObj.isCurrentMonth;

              const tasksForDay = tasksByDate.get(dateStr) || [];
              const visibleTasks = tasksForDay.slice(0, 3);
              const hiddenCount = tasksForDay.length - 3;

              return (
                <Droppable key={dateStr} droppableId={dateStr}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-white p-2 flex flex-col gap-1 transition-all
                        ${!dayObj.isCurrentMonth && viewMode === 'month' ? 'bg-[#F5F5F0]/80' : ''} 
                        ${snapshot.isDraggingOver ? 'bg-[#FFFDE7] ring-inset ring-4 ring-[#FFD600] z-10 relative' : ''} 
                      `}
                    >
                      <div className="flex justify-between items-center mb-1 shrink-0">
                        <span className={`font-space font-bold text-sm w-7 h-7 flex items-center justify-center ${isTodayCell ? 'bg-[#FFD600] border-2 border-black rounded-full' : !dayObj.isCurrentMonth && viewMode === 'month' ? 'text-[#999990]' : 'text-black'}`}>
                          {dayObj.date.getDate()}
                        </span>
                      </div>

                      {/* Tasks */}
                      {showTasks ? (
                        <div className="flex-1 overflow-hidden flex flex-col gap-1.5">
                          {visibleTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                                  style={getDragStyle(provided.draggableProps.style, snapshot.isDragging)}
                                  className={`text-[11px] px-1.5 py-1 rounded-[0.5rem] border-[1.5px] border-black font-vietnam font-bold truncate cursor-pointer shadow-[2px_2px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-1 ${getPriorityColor(task.priority)} ${isOverdue(task) && isTodayCell ? 'border-l-[4px] border-l-[#FF3B30]' : ''}`}
                                >
                                  {task.is_pinned && <Pin className="w-3 h-3 shrink-0" />}
                                  {!task.date && task.deadline && <Clock className="w-3 h-3 shrink-0" />}
                                  <span className="truncate">{task.title}</span>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      ) : (
                        <div className="flex-1">{provided.placeholder}</div>
                      )}

                      {hiddenCount > 0 && showTasks && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPopoverDay(dateStr); }}
                          className="text-xs font-space font-bold text-[#555550] mt-auto pt-1 hover:text-black text-left shrink-0 hover:underline"
                        >
                          +{hiddenCount} more
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Popover for +N more tasks */}
      {popoverDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/50 backdrop-blur-sm" onClick={() => setPopoverDay(null)}>
          <div
            className="bg-white border-[3px] border-black rounded-[1.5rem] shadow-[8px_8px_0_black] w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b-[3px] border-black flex justify-between items-center bg-[#F5F5F0]">
              <h3 className="font-jakarta font-bold text-lg text-black">
                {new Date(popoverDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button onClick={() => setPopoverDay(null)} className="p-1 hover:bg-[#E8E8E0] rounded-full transition-colors"><X className="w-5 h-5 text-black" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex flex-col gap-3">
              {tasksByDate.get(popoverDay)?.map(task => (
                <div
                  key={task.id}
                  onClick={() => { onTaskClick(task); setPopoverDay(null); }}
                  className={`text-sm px-3 py-2 rounded-[0.75rem] border-[2px] border-black font-vietnam font-bold cursor-pointer shadow-[3px_3px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 ${getPriorityColor(task.priority)}`}
                >
                  {task.is_pinned && <Pin className="w-4 h-4 shrink-0" />}
                  {!task.date && task.deadline && <Clock className="w-4 h-4 shrink-0" />}
                  <span className="truncate flex-1">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
