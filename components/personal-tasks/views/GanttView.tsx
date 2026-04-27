"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import { ListFilter, Pin, Repeat } from "lucide-react";
import { PersonalTaskWithDetails } from "@/lib/types/personal-tasks";
import { useUpdateTask } from "@/lib/hooks/use-personal-tasks";

interface GanttViewProps {
  tasks: PersonalTaskWithDetails[];
  onTaskClick: (task: PersonalTaskWithDetails) => void;
  onTaskDelete: (task: PersonalTaskWithDetails) => void;
}

export function GanttView({
  tasks,
  onTaskClick,
  onTaskDelete,
}: GanttViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const updateTaskMutation = useUpdateTask();

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [groupByCategory, setGroupByCategory] = useState<boolean>(false);
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('day');

  const [dragState, setDragState] = useState<{
    taskId: string;
    type: 'bar' | 'edge';
    startX: number;
    currentX: number;
    initialDate?: string;
    initialDeadline?: string;
  } | null>(null);

  const formatDateObj = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatDateObj(new Date());

  const dateToDays = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / (1000 * 3600 * 24));
  };

  const pixelsPerDay = zoom === 'day' ? 40 : zoom === 'week' ? 80 / 7 : 120 / 30;

  const { minStartDays, totalDays, minDateObj } = useMemo(() => {
    let minD = new Date();
    let maxD = new Date();
    tasks.forEach(t => {
      if (t.date) { const d = new Date(t.date); if (d < minD) minD = d; if (d > maxD) maxD = d; }
      if (t.deadline) { const d = new Date(t.deadline); if (d < minD) minD = d; if (d > maxD) maxD = d; }
    });

    minD = new Date(minD.getFullYear(), minD.getMonth() - 1, 1);
    maxD = new Date(maxD.getFullYear(), maxD.getMonth() + 2, 0);

    const sDays = dateToDays(formatDateObj(minD));
    const eDays = dateToDays(formatDateObj(maxD));
    return { minStartDays: sDays, totalDays: eDays - sDays, minDateObj: minD };
  }, [tasks]);

  const daysArr = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(minDateObj);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [totalDays, minDateObj]);

  // Handle Dragging
  useEffect(() => {
    if (!dragState) return;

    const onMouseMove = (e: MouseEvent) => {
      setDragState(prev => prev ? { ...prev, currentX: e.clientX } : null);
    };

    const onMouseUp = async () => {
      if (dragState) {
        const diffPixels = dragState.currentX - dragState.startX;
        const diffDays = Math.round(diffPixels / pixelsPerDay);

        if (diffDays !== 0) {
          const updates: any = {};
          if (dragState.type === 'bar') {
            if (dragState.initialDate) {
              const nd = new Date(dragState.initialDate);
              nd.setDate(nd.getDate() + diffDays);
              updates.date = formatDateObj(nd);
            }
            if (dragState.initialDeadline) {
              const nd = new Date(dragState.initialDeadline);
              nd.setDate(nd.getDate() + diffDays);
              updates.deadline = formatDateObj(nd);
            }
          } else if (dragState.type === 'edge') {
            if (dragState.initialDeadline) {
              const nd = new Date(dragState.initialDeadline);
              nd.setDate(nd.getDate() + diffDays);
              updates.deadline = formatDateObj(nd);
            }
          }
          try {
            await updateTaskMutation.mutateAsync({ taskId: dragState.taskId, fields: updates });
          } catch (e) {
            console.error("Failed to update task dates", e);
          }
        }
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragState, pixelsPerDay]);

  // Initial scroll and animations
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayDays = dateToDays(todayStr);
      const todayX = (todayDays - minStartDays) * pixelsPerDay;
      const viewportWidth = scrollContainerRef.current.clientWidth;
      const scrollLeft = Math.max(0, todayX - (viewportWidth - 280) / 2);
      scrollContainerRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }

    if (containerRef.current) {
      gsap.fromTo(containerRef.current.querySelectorAll('.task-row'),
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.02, ease: "power2.out", clearProps: "all" }
      );
    }
  }, []); // Only on mount

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, filterPriority, filterStatus]);

  const rows = useMemo(() => {
    if (!groupByCategory) {
      return filtered.map(t => ({ isGroupRow: false, task: t }));
    } else {
      const map = new Map<string, PersonalTaskWithDetails[]>();
      const uncat: PersonalTaskWithDetails[] = [];
      filtered.forEach(t => {
        if (t.category) {
          if (!map.has(t.category.name)) map.set(t.category.name, []);
          map.get(t.category.name)!.push(t);
        } else {
          uncat.push(t);
        }
      });

      const groups: any[] = [];
      Array.from(map.keys()).sort().forEach(cat => {
        groups.push({ isGroupRow: true, label: cat, task: null });
        map.get(cat)!.forEach(t => {
          groups.push({ isGroupRow: false, task: t });
        });
      });
      if (uncat.length > 0) {
        groups.push({ isGroupRow: true, label: "Uncategorized", task: null });
        uncat.forEach(t => {
          groups.push({ isGroupRow: false, task: t });
        });
      }
      return groups;
    }
  }, [filtered, groupByCategory]);

  const getTaskDates = (task: PersonalTaskWithDetails) => {
    const isDragging = dragState?.taskId === task.id;
    const offsetDays = isDragging ? Math.round((dragState.currentX - dragState.startX) / pixelsPerDay) : 0;

    let d = task.date;
    let dl = task.deadline;

    if (isDragging) {
      if (dragState.type === 'bar') {
        if (d) { const nd = new Date(d); nd.setDate(nd.getDate() + offsetDays); d = formatDateObj(nd); }
        if (dl) { const nd = new Date(dl); nd.setDate(nd.getDate() + offsetDays); dl = formatDateObj(nd); }
      } else if (dragState.type === 'edge') {
        if (dl) { const nd = new Date(dl); nd.setDate(nd.getDate() + offsetDays); dl = formatDateObj(nd); }
      }
    }
    return { date: d, deadline: dl };
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-[#FF3B30]';
      case 'medium': return 'bg-[#FF9500]';
      case 'low': return 'bg-[#00C853]';
      default: return 'bg-white'; // White color for no priority
    }
  };

  const renderBar = (task: PersonalTaskWithDetails) => {
    const { date, deadline } = getTaskDates(task);

    if (!date && !deadline) {
      return (
        <div className="absolute inset-x-0 h-full flex items-center justify-center opacity-30 pointer-events-none">
          <div className="w-full border-t-2 border-dashed border-black absolute top-1/2 -translate-y-1/2" />
          <span className="font-space text-xs bg-[#F5F5F0] px-2 z-10 border-2 border-black rounded-full shadow-[2px_2px_0_black]">No dates set</span>
        </div>
      );
    }

    const d1 = date ? dateToDays(date) : null;
    const d2 = deadline ? dateToDays(deadline) : null;

    let startDays = 0;
    let spanDays = 1;
    let type = 'bar';

    if (d1 !== null && d2 !== null) {
      startDays = Math.min(d1, d2);
      spanDays = Math.abs(d2 - d1) + 1;
    } else if (d1 !== null) {
      startDays = d1;
      type = 'start';
    } else if (d2 !== null) {
      startDays = d2;
      type = 'milestone';
    }

    const startX = (startDays - minStartDays) * pixelsPerDay;
    const width = spanDays * pixelsPerDay;

    let colorClass = "bg-white text-black"; // Default to white
    if (task.priority === 'high') colorClass = "bg-[#FF3B30] text-white";
    else if (task.priority === 'medium') colorClass = "bg-[#FF9500] text-black";
    else if (task.priority === 'low') colorClass = "bg-[#00C853] text-white";

    const isOverdue = task.deadline && task.deadline < todayStr && task.status !== 'done';
    const isDragging = dragState?.taskId === task.id;

    const tooltipTitle = `Title: ${task.title}\nPriority: ${task.priority || 'None'}\nDate: ${task.date || 'None'}\nDeadline: ${task.deadline || 'None'}\nStatus: ${task.status}\nCategory: ${task.category?.name || 'None'}`;

    return (
      <div
        className="absolute top-[8px] h-[32px] group z-10 transition-[left,width] duration-75"
        style={{ left: startX, width: Math.max(width, 24) }}
        title={tooltipTitle}
      >
        {type === 'bar' && (
          <div
            className={`w-full h-full border-[2px] border-black rounded-[0.5rem] shadow-[2px_2px_0_black] flex items-center px-2 cursor-grab active:cursor-grabbing transition-transform ${colorClass} ${isOverdue ? 'animate-[pulse_1s_ease-in-out_infinite] border-red-500 shadow-[2px_2px_0_red]' : ''} ${isDragging ? '!shadow-[4px_4px_0_black] -translate-y-[2px] scale-[1.02] z-50' : 'hover:-translate-y-[1px]'}`}
            onMouseDown={(e) => { e.preventDefault(); setDragState({ taskId: task.id, type: 'bar', startX: e.clientX, currentX: e.clientX, initialDate: task.date || undefined, initialDeadline: task.deadline || undefined }); }}
            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
          >
            {task.is_pinned && <Pin className="w-3 h-3 shrink-0 mr-1" />}
            {isDragging && <span className="font-space text-[10px] font-bold bg-white text-black px-1 border border-black rounded shadow-sm">{date}</span>}
            {task.is_recurring && <Repeat className="w-3 h-3 shrink-0 ml-auto" />}
          </div>
        )}

        {type === 'start' && (
          <div
            className={`w-[20px] h-[20px] rounded-full border-[2px] border-black shadow-[2px_2px_0_black] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform ${colorClass}`}
            onMouseDown={(e) => { e.preventDefault(); setDragState({ taskId: task.id, type: 'bar', startX: e.clientX, currentX: e.clientX, initialDate: task.date || undefined, initialDeadline: task.deadline || undefined }); }}
            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
          >
            {isDragging && <span className="font-space text-[10px] font-bold bg-white text-black px-1 border border-black rounded shadow-sm absolute -top-6 -left-2 whitespace-nowrap">{date}</span>}
          </div>
        )}

        {type === 'milestone' && (
          <div
            className={`w-[20px] h-[20px] rotate-45 border-[2px] border-black shadow-[2px_2px_0_black] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform ${isOverdue ? 'bg-[#FF3B30] animate-[pulse_1s_ease-in-out_infinite]' : colorClass}`}
            onMouseDown={(e) => { e.preventDefault(); setDragState({ taskId: task.id, type: 'bar', startX: e.clientX, currentX: e.clientX, initialDate: task.date || undefined, initialDeadline: task.deadline || undefined }); }}
            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
          >
            {isDragging && <span className="font-space text-[10px] font-bold bg-white text-black px-1 border border-black rounded shadow-sm absolute -top-8 -left-2 rotate-[-45deg] whitespace-nowrap">{deadline}</span>}
          </div>
        )}

        {type === 'bar' && (
          <div
            className="absolute right-0 top-0 w-3 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/20 z-20 hover:bg-black/40 transition-colors rounded-r-[0.3rem]"
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setDragState({ taskId: task.id, type: 'edge', startX: e.clientX, currentX: e.clientX, initialDate: task.date || undefined, initialDeadline: task.deadline || undefined }); }}
          />
        )}
      </div>
    );
  };

  const renderTimelineHeader = () => {
    if (zoom === 'day') {
      const months: { label: string, days: number }[] = [];
      let currentMonth = "";
      let count = 0;
      daysArr.forEach(d => {
        const m = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (m !== currentMonth) {
          if (currentMonth) months.push({ label: currentMonth, days: count });
          currentMonth = m;
          count = 1;
        } else {
          count++;
        }
      });
      if (currentMonth) months.push({ label: currentMonth, days: count });

      return (
        <div className="flex flex-col w-full h-full">
          <div className="flex border-b-2 border-black h-8">
            {months.map(m => (
              <div key={m.label} style={{ width: m.days * 40 }} className="border-r-2 border-black px-2 flex items-center font-jakarta font-bold text-sm text-black overflow-hidden whitespace-nowrap">
                {m.label}
              </div>
            ))}
          </div>
          <div className="flex h-12">
            {daysArr.map(d => {
              const isToday = formatDateObj(d) === todayStr;
              return (
                <div key={d.toISOString()} style={{ width: 40 }} className={`flex-shrink-0 border-r-2 border-black/10 flex flex-col items-center justify-center font-space text-xs ${isToday ? 'bg-[#FFD600]/20 font-bold' : ''}`}>
                  <span className="text-[10px] text-black/60">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()]}</span>
                  <span className={isToday ? 'bg-[#FFD600] w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] border-black shadow-[2px_2px_0_black]' : ''}>{d.getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else if (zoom === 'week') {
      const weeks: { date: Date, days: number }[] = [];
      let currentWeekStart: Date | null = null;
      let count = 0;
      daysArr.forEach(d => {
        if (d.getDay() === 0 || !currentWeekStart) {
          if (currentWeekStart) weeks.push({ date: currentWeekStart, days: count });
          currentWeekStart = d;
          count = 1;
        } else {
          count++;
        }
      });
      if (currentWeekStart) weeks.push({ date: currentWeekStart, days: count });

      return (
        <div className="flex h-full items-end pb-2">
          {weeks.map((w, i) => (
            <div key={i} style={{ width: w.days * (80 / 7) }} className="flex-shrink-0 border-r-2 border-black px-2 font-space text-xs font-bold overflow-hidden whitespace-nowrap text-black">
              W of {w.date.getDate()} {w.date.toLocaleString('default', { month: 'short' })}
            </div>
          ))}
        </div>
      );
    } else if (zoom === 'month') {
      const months: { label: string, days: number }[] = [];
      let currentMonth = "";
      let count = 0;
      daysArr.forEach(d => {
        const m = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (m !== currentMonth) {
          if (currentMonth) months.push({ label: currentMonth, days: count });
          currentMonth = m;
          count = 1;
        } else {
          count++;
        }
      });
      if (currentMonth) months.push({ label: currentMonth, days: count });

      return (
        <div className="flex h-full items-end pb-2">
          {months.map(m => (
            <div key={m.label} style={{ width: m.days * (120 / 30) }} className="flex-shrink-0 border-r-2 border-black px-2 font-jakarta text-sm font-bold overflow-hidden whitespace-nowrap text-black">
              {m.label}
            </div>
          ))}
        </div>
      );
    }
  };

  const renderBackground = () => (
    <div className="absolute inset-0 flex pointer-events-none">
      {daysArr.map(d => {
        const isToday = formatDateObj(d) === todayStr;
        return (
          <div key={d.toISOString()} style={{ width: pixelsPerDay }} className={`border-r-[1px] border-black/5 flex-shrink-0 ${isToday ? 'bg-[#FFD600]/10 border-r-[#FFD600]/40' : ''}`} />
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-full min-h-0" ref={containerRef}>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center bg-[#F5F5F0] px-4 py-2.5 rounded-[1rem] border-2 border-black shadow-[2px_2px_0_black] shrink-0">
        <div className="flex items-center gap-2 border-r-2 border-black/10 pr-4">
          <ListFilter className="w-4 h-4 text-[#555550]" />
          <span className="font-space text-[10px] font-bold text-[#555550]">GANTT FILTERS</span>
        </div>

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
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-2 py-1.5 bg-white border-2 border-black rounded-[0.75rem] font-vietnam text-sm focus:shadow-[2px_2px_0_black] outline-none cursor-pointer"
        >
          <option value="all">Status: All</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
        </select>

        <button
          onClick={() => setGroupByCategory(!groupByCategory)}
          className={`ml-2 px-4 py-1.5 border-2 border-black rounded-full font-space text-sm font-bold transition-all cursor-pointer ${groupByCategory
              ? 'bg-black text-white shadow-none translate-y-[2px] translate-x-[2px]'
              : 'bg-white text-black shadow-[2px_2px_0_black] hover:-translate-y-[1px]'
            }`}
        >
          Group by Category
        </button>

        <div className="ml-auto flex bg-white border-2 border-black rounded-[0.875rem] p-1 shadow-[2px_2px_0_black]">
          <button onClick={() => setZoom('day')} className={`px-4 py-1 font-bold font-vietnam text-xs rounded-[0.5rem] transition-colors ${zoom === 'day' ? 'bg-[#FFD600] border border-black shadow-[1px_1px_0_black]' : 'hover:bg-[#F5F5F0] border border-transparent'}`}>Day</button>
          <button onClick={() => setZoom('week')} className={`px-4 py-1 font-bold font-vietnam text-xs rounded-[0.5rem] transition-colors ${zoom === 'week' ? 'bg-[#FFD600] border border-black shadow-[1px_1px_0_black]' : 'hover:bg-[#F5F5F0] border border-transparent'}`}>Week</button>
          <button onClick={() => setZoom('month')} className={`px-4 py-1 font-bold font-vietnam text-xs rounded-[0.5rem] transition-colors ${zoom === 'month' ? 'bg-[#FFD600] border border-black shadow-[1px_1px_0_black]' : 'hover:bg-[#F5F5F0] border border-transparent'}`}>Month</button>
        </div>
      </div>

      {/* Gantt Chart Area */}
      <div className="flex-1 bg-white border-[3px] border-black rounded-[1.5rem] shadow-[6px_6px_0_black] overflow-hidden relative">
        <div className="w-full h-full overflow-auto flex custom-scrollbar" ref={scrollContainerRef}>

          <div className="flex flex-col relative min-w-max pb-10">
            {/* Header Row */}
            <div className="flex h-[80px] border-b-[3px] border-black bg-[#E8E8E0] sticky top-0 z-40 shadow-sm">
              <div className="sticky left-0 w-[380px] px-6 flex items-center font-jakarta font-bold text-xl bg-[#E8E8E0] border-r-[3px] border-black z-50 shrink-0">
                Task Details
              </div>
              <div className="flex-1 relative z-30">
                {renderTimelineHeader()}
              </div>
            </div>

            {/* Background Grid */}
            <div className="absolute top-[80px] bottom-0 left-[380px] right-0 z-0 pointer-events-none">
              {renderBackground()}
            </div>

            {/* Task Rows */}
            <div className="relative z-20 flex flex-col pt-1">
              {rows.map((row, idx) => {
                if (row.isGroupRow) {
                  return (
                    <div key={`g-${idx}`} className="flex h-[40px] border-b-2 border-black w-full mt-2">
                      <div className="sticky left-0 w-[380px] px-6 flex items-center font-jakarta font-bold text-sm bg-[#F5F5F0] border-r-[3px] border-black z-30 shrink-0 shadow-[4px_0_0_black]">
                        {row.label}
                      </div>
                      <div className="flex-1 bg-[#F5F5F0]/50 backdrop-blur-sm relative z-10 border-b-2 border-black"></div>
                    </div>
                  );
                } else {
                  const task = row.task;
                  return (
                    <div key={task.id} className="task-row flex h-[48px] border-b border-black/10 w-full group hover:bg-black/5 transition-colors">
                      {/* Left Panel - Task Title */}
                      <div className="sticky left-0 w-[380px] bg-white group-hover:bg-[#F5F5F0] border-r-[3px] border-black px-4 flex items-center justify-between gap-3 z-30 shrink-0 cursor-pointer transition-colors" onClick={() => onTaskClick(task)}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-vietnam font-bold text-[15px] text-[#0A0A0A] truncate">{task.title}</span>
                          {task.is_pinned && <Pin className="w-3.5 h-3.5 shrink-0 text-black fill-black" />}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          {task.category && (
                            <span className="font-space text-[10px] font-bold uppercase tracking-wider text-[#555550]">
                              {task.category.name}
                            </span>
                          )}
                          {task.priority && (
                            <div className={`w-2.5 h-2.5 rounded-sm border border-black ${getPriorityColor(task.priority)}`} title={`Priority: ${task.priority}`} />
                          )}
                        </div>
                      </div>

                      {/* Right Panel - Bar */}
                      <div className="relative flex-1">
                        {renderBar(task)}
                      </div>
                    </div>
                  );
                }
              })}
            </div>

            {/* Empty State Overlay */}
            {tasks.length > 0 && !tasks.some(t => t.date || t.deadline) && (
              <div className="absolute inset-0 top-[80px] flex items-center justify-center pointer-events-none z-50">
                <div className="bg-white/90 backdrop-blur-sm border-[3px] border-black rounded-[1rem] p-6 shadow-[6px_6px_0_black] flex flex-col items-center">
                  <span className="font-jakarta font-bold text-xl text-black">No Dates Scheduled</span>
                  <span className="font-space text-sm text-[#555550] mt-2">Add dates or deadlines to your tasks to see them here.</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
