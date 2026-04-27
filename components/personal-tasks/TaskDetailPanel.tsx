"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { X, Pin, Calendar, Plus, Trash2, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  updateTask,
  deleteTask,
  createCategory,
  createSubtask,
  updateSubtask,
  deleteSubtask
} from "@/actions/personal-tasks";
import {
  PersonalTaskWithDetails,
  PersonalTaskCategory,
  PersonalTaskStatus,
  PersonalTaskPriority,
  PersonalTaskRecurrenceType
} from "@/lib/types/personal-tasks";

interface TaskDetailPanelProps {
  task: PersonalTaskWithDetails | null;
  categories: PersonalTaskCategory[];
  onClose: () => void;
  onUpdate: () => void;
  onComplete: () => void;
  onArchive: () => void;
}

export function TaskDetailPanel({
  task,
  categories,
  onClose,
  onUpdate,
  onComplete,
  onArchive
}: TaskDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      
      // Animate in
      if (panelRef.current && backdropRef.current) {
        gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
        gsap.fromTo(panelRef.current, { x: "100%" }, { x: "0%", duration: 0.4, ease: "power3.out" });
      }
    }
  }, [task]);

  if (!task) return null;

  const handleClose = () => {
    if (panelRef.current && backdropRef.current) {
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
      gsap.to(panelRef.current, { x: "100%", duration: 0.4, ease: "power3.in", onComplete: onClose });
    } else {
      onClose();
    }
  };

  // --- Handlers ---
  const handleTitleBlur = async () => {
    if (title !== task.title && title.trim()) {
      await updateTask(task.id, { title: title.trim() });
      onUpdate();
    }
  };

  const handleDescriptionBlur = async () => {
    if (description !== task.description) {
      await updateTask(task.id, { description });
      onUpdate();
    }
  };

  const handleStatusChange = async (status: PersonalTaskStatus) => {
    if (status === "done") {
      onComplete();
    } else {
      await updateTask(task.id, { status });
      onUpdate();
    }
  };

  const handlePriorityChange = async (priority: PersonalTaskPriority | null) => {
    await updateTask(task.id, { priority });
    onUpdate();
  };

  const handleSelectCategory = async (categoryId: string | null) => {
    await updateTask(task.id, { category_id: categoryId });
    onUpdate();
    setIsCategoryOpen(false);
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      await createCategory(newCategoryName);
      onUpdate();
      setNewCategoryName("");
      setIsAddingCategory(false);
      setIsCategoryOpen(false);
    }
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await updateTask(task.id, { date: e.target.value || null });
    onUpdate();
  };

  const handleDeadlineChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await updateTask(task.id, { deadline: e.target.value || null });
    onUpdate();
  };

  const handleReschedule = async (days: number | null) => {
    let date = null;
    if (days !== null) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      date = d.toISOString().split("T")[0];
    }
    await updateTask(task.id, { date });
    onUpdate();
  };

  const handleAddSubtask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSubtaskTitle.trim()) {
      await createSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
      onUpdate();
    }
  };

  const handleTogglePin = async () => {
    await updateTask(task.id, { is_pinned: !task.is_pinned });
    onUpdate();
  };

  const handleDeleteTask = async () => {
    await deleteTask(task.id);
    handleClose();
    onUpdate();
  };

  const subtasksCompleted = task.subtasks.filter(st => st.is_completed).length;
  const subtasksTotal = task.subtasks.length;

  return (
    <>
      <div 
        ref={backdropRef} 
        className="fixed inset-0 bg-[#0A0A0A]/50 z-50" 
        onClick={handleClose} 
      />
      <div 
        ref={panelRef} 
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l-[3px] border-black z-50 overflow-y-auto rounded-l-[1.5rem] shadow-[-8px_8px_0_rgba(0,0,0,1)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black sticky top-0 bg-white z-10">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleTogglePin}
              className={`rounded-[0.875rem] border-2 border-black shadow-[3px_3px_0_black] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all ${task.is_pinned ? 'bg-[#FFD600]' : 'bg-white'}`}
            >
              <Pin className="w-5 h-5" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="hover:bg-[#F5F5F0] rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-8 flex-1">
          
          {/* Title */}
          <div>
            <input 
              className="w-full text-[28px] font-extrabold font-jakarta outline-none bg-transparent placeholder-[#999990]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Task title..."
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <span className="font-space font-medium text-[14px] text-[#0A0A0A]">STATUS</span>
            <div className="flex flex-wrap gap-3">
              {(["todo", "in_progress", "done"] as PersonalTaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-4 py-2 font-bold font-jakarta text-sm border-2 border-black rounded-[0.875rem] transition-all
                    ${task.status === s 
                      ? "bg-[#FFD600] shadow-none translate-x-[2px] translate-y-[2px]" 
                      : "bg-white shadow-[3px_3px_0_black] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                    }
                  `}
                >
                  {s === "todo" ? "Todo" : s === "in_progress" ? "In Progress" : "Done"}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <span className="font-space font-medium text-[14px] text-[#0A0A0A]">PRIORITY</span>
            <div className="flex flex-wrap gap-3">
              {[
                { val: "high", label: "High", bg: "bg-[#FF3B30]", text: "text-white" },
                { val: "medium", label: "Medium", bg: "bg-[#FFD600]", text: "text-black" },
                { val: "low", label: "Low", bg: "bg-[#00C853]", text: "text-white" }
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => handlePriorityChange(p.val as PersonalTaskPriority)}
                  className={`px-4 py-1.5 font-space font-medium text-xs border-[1.5px] border-black rounded-full transition-all
                    ${task.priority === p.val 
                      ? `${p.bg} ${p.text} shadow-none translate-x-[2px] translate-y-[2px]` 
                      : `bg-white text-black shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none`
                    }
                  `}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => handlePriorityChange(null)}
                className={`px-4 py-1.5 font-space font-medium text-xs border-[1.5px] border-black rounded-full transition-all
                  ${!task.priority 
                    ? "bg-[#F5F5F0] text-black shadow-none translate-x-[2px] translate-y-[2px]" 
                    : "bg-white text-black shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  }
                `}
              >
                None
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2 relative">
            <span className="font-space font-medium text-[14px] text-[#0A0A0A]">CATEGORY</span>
            <button 
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="w-full text-left px-4 py-3 bg-white border-2 border-black rounded-[0.75rem] font-vietnam focus:shadow-[4px_4px_0_black] transition-all flex justify-between items-center"
            >
              {task.category ? task.category.name : "No category"}
              <span className="text-xs">▼</span>
            </button>
            
            {isCategoryOpen && (
              <div className="absolute top-[100%] mt-2 w-full bg-white border-2 border-black rounded-[0.75rem] shadow-[4px_4px_0_black] z-20 flex flex-col overflow-hidden max-h-[250px] overflow-y-auto">
                <button 
                  onClick={() => handleSelectCategory(null)}
                  className="px-4 py-3 text-left font-vietnam hover:bg-[#F5F5F0] border-b-2 border-black/10"
                >
                  No category
                </button>
                {categories.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => handleSelectCategory(c.id)}
                    className="px-4 py-3 text-left font-vietnam hover:bg-[#F5F5F0] border-b-2 border-black/10"
                  >
                    {c.name}
                  </button>
                ))}
                
                {isAddingCategory ? (
                  <div className="p-3 bg-[#F5F5F0] flex gap-2">
                    <input 
                      autoFocus
                      className="flex-1 px-3 py-2 border-2 border-black rounded-md text-sm font-vietnam outline-none"
                      placeholder="Category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    />
                    <button 
                      onClick={handleCreateCategory}
                      className="px-3 py-2 bg-[#FFD600] border-2 border-black rounded-md text-sm font-bold shadow-[2px_2px_0_black]"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingCategory(true)}
                    className="px-4 py-3 text-left font-vietnam text-[#555550] hover:bg-[#F5F5F0] flex items-center gap-2 italic"
                  >
                    <Plus className="w-4 h-4" /> New category...
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <span className="font-space font-medium text-[14px] text-[#0A0A0A]">START DATE</span>
              <input 
                type="date" 
                value={task.date || ""}
                onChange={handleDateChange}
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-[0.75rem] font-vietnam focus:shadow-[4px_4px_0_black] outline-none transition-all"
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <span className="font-space font-medium text-[14px] text-[#0A0A0A]">DEADLINE</span>
              <input 
                type="date" 
                value={task.deadline || ""}
                onChange={handleDeadlineChange}
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-[0.75rem] font-vietnam focus:shadow-[4px_4px_0_black] outline-none transition-all"
              />
            </div>
          </div>
          
          {/* Quick Reschedule */}
          <div className="flex gap-2">
            <button 
              onClick={() => handleReschedule(1)}
              className="flex-1 px-3 py-2 text-xs font-bold font-jakarta bg-white border-2 border-black rounded-[0.875rem] shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Tomorrow
            </button>
            <button 
              onClick={() => handleReschedule(7)}
              className="flex-1 px-3 py-2 text-xs font-bold font-jakarta bg-white border-2 border-black rounded-[0.875rem] shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Next Week
            </button>
            <button 
              onClick={() => handleReschedule(null)}
              className="flex-1 px-3 py-2 text-xs font-bold font-jakarta bg-white border-2 border-black rounded-[0.875rem] shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Clear Date
            </button>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <span className="font-space font-medium text-[14px] text-[#0A0A0A]">NOTES</span>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add your notes here..."
              className="min-h-[120px] resize-y p-4 font-vietnam border-2 border-black rounded-[0.75rem] focus:shadow-[4px_4px_0_black] transition-shadow bg-white"
            />
          </div>

          {/* Subtasks */}
          <div className="flex flex-col gap-4 border-2 border-black p-5 rounded-[1.5rem] bg-[#F5F5F0] shadow-[4px_4px_0_black]">
            <div className="flex justify-between items-center">
              <span className="font-jakarta font-bold text-[18px]">Subtasks</span>
              <Badge className="bg-white text-black border-[1.5px] border-black font-space hover:bg-white pointer-events-none">
                {subtasksCompleted} / {subtasksTotal} done
              </Badge>
            </div>
            
            <div className="flex flex-col gap-3">
              {task.subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 group">
                  <Checkbox 
                    checked={st.is_completed}
                    onCheckedChange={(c) => updateSubtask(st.id, { is_completed: !!c }).then(onUpdate)}
                    className="w-5 h-5 border-2 border-black data-[state=checked]:bg-[#FFD600] data-[state=checked]:text-black"
                  />
                  <input 
                    defaultValue={st.title}
                    onBlur={(e) => {
                      if(e.target.value !== st.title && e.target.value.trim()) {
                        updateSubtask(st.id, { title: e.target.value.trim() }).then(onUpdate);
                      }
                    }}
                    className={`flex-1 bg-transparent font-vietnam outline-none border-b-2 border-transparent focus:border-black transition-all ${st.is_completed ? 'line-through text-[#999990]' : 'text-black'}`}
                  />
                  <button 
                    onClick={() => {
                      deleteSubtask(st.id).then(onUpdate);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#FF3B30] hover:bg-[#FF3B30]/10 p-1 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-2 border-t-2 border-black/10 pt-4">
              <Plus className="w-5 h-5 text-[#999990]" />
              <input 
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={handleAddSubtask}
                placeholder="Add subtask (press Enter)..."
                className="flex-1 bg-transparent font-vietnam outline-none border-b-2 border-transparent focus:border-black text-sm"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="flex flex-col gap-4 border-2 border-black p-5 rounded-[1.5rem] bg-white shadow-[4px_4px_0_black]">
            <div className="flex justify-between items-center">
              <span className="font-jakarta font-bold text-[18px] flex items-center gap-2">
                <Clock className="w-5 h-5" /> Recurrence
              </span>
              <Checkbox 
                checked={task.is_recurring}
                onCheckedChange={(c) => {
                  updateTask(task.id, { is_recurring: !!c }).then(onUpdate);
                }}
                className="w-6 h-6 border-2 border-black data-[state=checked]:bg-[#00C853] data-[state=checked]:text-white rounded-[0.5rem]"
              />
            </div>

            {task.is_recurring && (
              <div className="flex flex-col gap-3 mt-2">
                <span className="font-space font-medium text-xs text-[#555550]">RECURRENCE TYPE</span>
                <select 
                  value={task.recurrence_type || "daily"}
                  onChange={(e) => updateTask(task.id, { recurrence_type: e.target.value as PersonalTaskRecurrenceType }).then(onUpdate)}
                  className="w-full px-4 py-3 bg-white border-2 border-black rounded-[0.75rem] font-vietnam outline-none focus:shadow-[4px_4px_0_black] appearance-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>

                {task.recurrence_type === "custom" && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-vietnam text-sm">Every</span>
                    <input 
                      type="number" 
                      min={1}
                      value={task.recurrence_days || 1}
                      onChange={(e) => updateTask(task.id, { recurrence_days: parseInt(e.target.value) || 1 }).then(onUpdate)}
                      className="w-20 px-3 py-2 bg-white border-2 border-black rounded-md font-vietnam outline-none text-center"
                    />
                    <span className="font-vietnam text-sm">days</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-black bg-[#F5F5F0] sticky bottom-0 z-10 flex justify-between gap-4">
          <Button 
            onClick={handleDeleteTask}
            className="flex-1 bg-[#FF3B30] text-white border-2 border-black rounded-[0.875rem] shadow-[4px_4px_0_black] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all font-jakarta font-bold"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Task
          </Button>
          <Button 
            onClick={() => {
              onArchive();
              handleClose();
            }}
            className="flex-1 bg-white text-black border-2 border-black rounded-[0.875rem] shadow-[4px_4px_0_black] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all font-jakarta font-bold"
          >
            Archive
          </Button>
        </div>
      </div>
    </>
  );
}
