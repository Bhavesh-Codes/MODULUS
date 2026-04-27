"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { Archive, LayoutList, KanbanSquare, Calendar as CalendarIcon, AlignLeft } from "lucide-react";
import { PersonalTaskWithDetails, PersonalTaskCategory } from "@/lib/types/personal-tasks";
import {
  usePersonalTasks,
  useArchivedTasks,
  useTaskCategories,
  useCompleteTask,
  useArchiveTask,
  useDeleteTask,
} from "@/lib/hooks/use-personal-tasks";
import { QuickAddBar } from "@/components/personal-tasks/QuickAddBar";
import { TaskDetailPanel } from "@/components/personal-tasks/TaskDetailPanel";
import { ListView } from "@/components/personal-tasks/views/ListView";
import { KanbanView } from "@/components/personal-tasks/views/KanbanView";
import { CalendarView } from "@/components/personal-tasks/views/CalendarView";
import { GanttView } from "@/components/personal-tasks/views/GanttView";

type ViewMode = 'List' | 'Kanban' | 'Calendar' | 'Gantt';

export function TasksPageClient({ initialTasks, initialCategories }: { initialTasks: PersonalTaskWithDetails[], initialCategories: PersonalTaskCategory[] }) {
  const [archiveMode, setArchiveMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('List');
  const [selectedTask, setSelectedTask] = useState<PersonalTaskWithDetails | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  // --- TanStack Query hooks ---
  const { data: tasks = [] } = usePersonalTasks(initialTasks);
  const { data: categories = [] } = useTaskCategories(initialCategories);
  const { data: archivedTasks = [] } = useArchivedTasks(archiveMode);

  const completeMutation = useCompleteTask();
  const archiveMutation = useArchiveTask();
  const deleteMutation = useDeleteTask();

  // Keep selected task in sync with cache
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) {
        setSelectedTask(updated);
      }
    }
  }, [tasks]);

  // Animate content when view changes
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", clearProps: "all" }
      );
    }
  }, [viewMode, archiveMode]);

  const handleComplete = useCallback((task: PersonalTaskWithDetails) => {
    completeMutation.mutate(task.id);
  }, [completeMutation]);

  const handleArchive = useCallback((task: PersonalTaskWithDetails) => {
    archiveMutation.mutate(task.id);
  }, [archiveMutation]);

  const handleDelete = useCallback(async (task: PersonalTaskWithDetails) => {
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) return false;
    deleteMutation.mutate(task.id);
    return true;
  }, [deleteMutation]);

  const renderContent = () => {
    if (archiveMode) {
      return (
        <div className="flex flex-col gap-4 pb-20 max-w-4xl mx-auto w-full">
          {archivedTasks.length === 0 ? (
            <div className="py-20 text-center font-space text-[#999990]">No completed tasks yet.</div>
          ) : (
            archivedTasks.map(t => (
              <div key={t.id} className="flex items-center p-4 bg-white border-[3px] border-black rounded-[1rem] shadow-[4px_4px_0_black] opacity-60 hover:opacity-100 transition-opacity">
                 <div className={`w-3.5 h-3.5 rounded-full shrink-0 border-[2px] border-black mr-4 ${t.priority === 'high' ? 'bg-[#FF3B30]' : t.priority === 'medium' ? 'bg-[#FF9500]' : t.priority === 'low' ? 'bg-[#00C853]' : 'bg-[#E8E8E0]'}`} />
                 <span className="font-vietnam font-medium text-black line-through flex-1 truncate mr-4">{t.title}</span>
                 {t.category && (
                   <span className="px-3 py-1 bg-[#F5F5F0] border-2 border-black rounded-full font-space font-bold text-[10px] mr-4 shrink-0 shadow-[2px_2px_0_black]">
                     {t.category.name}
                   </span>
                 )}
                 <span suppressHydrationWarning className="font-space font-bold text-xs text-[#555550] shrink-0">
                   Completed {new Date(t.completed_at || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                 </span>
              </div>
            ))
          )}
        </div>
      );
    }

    switch (viewMode) {
      case 'List': return <ListView tasks={tasks} categories={categories} onTaskClick={setSelectedTask} onTaskComplete={handleComplete} onTaskArchive={handleArchive} onTaskDelete={handleDelete} />;
      case 'Kanban': return <KanbanView tasks={tasks} categories={categories} onTaskClick={setSelectedTask} onTaskComplete={handleComplete} onTaskArchive={handleArchive} onTaskDelete={handleDelete} />;
      case 'Calendar': return <CalendarView tasks={tasks} onTaskClick={setSelectedTask} onTaskComplete={handleComplete} onTaskArchive={handleArchive} onTaskDelete={handleDelete} />;
      case 'Gantt': return <GanttView tasks={tasks} onTaskClick={setSelectedTask} onTaskDelete={handleDelete} />;
    }
  };

  const archivedCount = archivedTasks.length;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full relative">
      
      {/* Fixed Top Section */}
      <div className="flex-none p-6 pb-0 flex flex-col gap-6 z-20 shrink-0">
        
        {/* Header Row */}
        <div className="flex justify-between items-center gap-4 w-full">
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <h1 className="font-jakarta font-bold text-xl text-black uppercase tracking-tight shrink-0 bg-[#FFD600] px-3 py-1 rounded-[0.5rem] border-2 border-black shadow-[2px_2px_0_black]">My Tasks</h1>
            <div className="flex-1">
              <QuickAddBar categories={categories} />
            </div>
          </div>
          
          {/* View Toggles */}
          <div className={`flex bg-white border-[3px] border-black rounded-[1rem] p-1 shadow-[4px_4px_0_black] transition-opacity ${archiveMode ? 'opacity-50 pointer-events-none' : ''} shrink-0`}>
             {['List', 'Kanban', 'Calendar', 'Gantt'].map(v => (
               <button 
                 key={v}
                 onClick={() => setViewMode(v as ViewMode)}
                 className={`flex items-center gap-2 px-4 py-2 font-space font-bold text-sm rounded-[0.5rem] transition-all cursor-pointer outline-none ${viewMode === v ? 'bg-[#FFD600] border-[2px] border-black shadow-[2px_2px_0_black] translate-y-[-1px]' : 'border-[2px] border-transparent hover:bg-[#F5F5F0]'}`}
               >
                 {v === 'List' && <LayoutList className="w-4 h-4 text-black"/>}
                 {v === 'Kanban' && <KanbanSquare className="w-4 h-4 text-black"/>}
                 {v === 'Calendar' && <CalendarIcon className="w-4 h-4 text-black"/>}
                 {v === 'Gantt' && <AlignLeft className="w-4 h-4 text-black"/>}
                 <span className="text-black">{v}</span>
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto p-6" ref={contentRef}>
         {renderContent()}

         {/* Bottom Archive Toggle */}
         <div className="mt-8 flex justify-center pb-8">
           <button 
             onClick={() => setArchiveMode(!archiveMode)}
             className="flex items-center gap-2 font-space text-xs font-bold text-[#555550] hover:text-black hover:underline transition-all cursor-pointer"
           >
             <Archive className="w-4 h-4"/>
             {archiveMode ? 'Back to Active Tasks' : `View ${archivedCount} Archived Task${archivedCount !== 1 ? 's' : ''}`}
           </button>
         </div>
      </div>

      {/* Detail Panel */}
      <TaskDetailPanel 
         task={selectedTask} 
         categories={categories} 
         onClose={() => setSelectedTask(null)} 
         onComplete={() => { if (selectedTask) handleComplete(selectedTask); }}
         onArchive={() => { if (selectedTask) handleArchive(selectedTask); }}
         onDelete={async () => { 
           if (selectedTask) {
             const deleted = await handleDelete(selectedTask);
             return deleted;
           }
           return false;
         }}
      />
    </div>
  );
}
