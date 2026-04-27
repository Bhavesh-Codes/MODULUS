"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { X, Pin, Plus, Trash2, Clock, Check, RepeatIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  useUpdateTask,
  useCreateCategory,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
} from "@/lib/hooks/use-personal-tasks";
import {
  PersonalTaskWithDetails, PersonalTaskCategory,
  PersonalTaskStatus, PersonalTaskPriority, PersonalTaskRecurrenceType
} from "@/lib/types/personal-tasks";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  task: PersonalTaskWithDetails | null;
  categories: PersonalTaskCategory[];
  onClose: () => void;
  onComplete: () => void;
  onArchive: () => void;
  onDelete: () => Promise<boolean>;
}

export function TaskDetailPanel({ task, categories, onClose, onComplete, onArchive, onDelete }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // --- Mutation hooks ---
  const updateTaskMutation = useUpdateTask();
  const createCategoryMutation = useCreateCategory();
  const createSubtaskMutation = useCreateSubtask();
  const updateSubtaskMutation = useUpdateSubtask();
  const deleteSubtaskMutation = useDeleteSubtask();

  // --- Local draft state ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PersonalTaskStatus>("todo");
  const [priority, setPriority] = useState<PersonalTaskPriority | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<PersonalTaskRecurrenceType>("daily");
  const [recurrenceDays, setRecurrenceDays] = useState(1);
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([]); // for 'weekdays' type

  // --- Subtask local state ---
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; is_completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtaskSaving, setSubtaskSaving] = useState(false);

  // --- Category UI ---
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Sync when task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setCategoryId(task.category_id);
    setDate(task.date || "");
    setDeadline(task.deadline || "");
    setIsRecurring(task.is_recurring);
    setRecurrenceType(task.recurrence_type || "daily");
    setRecurrenceDays(task.recurrence_days || 1);
    setRecurrenceWeekdays(task.recurrence_weekdays || []);
    setSubtasks(task.subtasks.map(s => ({ id: s.id, title: s.title, is_completed: s.is_completed })));
    setIsDirty(false);
    setIsCategoryOpen(false);

    if (panelRef.current && backdropRef.current) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.fromTo(panelRef.current, { x: "100%" }, { x: "0%", duration: 0.4, ease: "power3.out" });
    }
  }, [task?.id]);

  if (!task) return null;

  const mark = () => setIsDirty(true);

  const handleClose = () => {
    if (panelRef.current && backdropRef.current) {
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
      gsap.to(panelRef.current, { x: "100%", duration: 0.4, ease: "power3.in", onComplete: onClose });
    } else onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        fields: {
          title: title.trim(),
          description: description || null,
          status,
          priority,
          category_id: categoryId,
          date: date || null,
          deadline: deadline || null,
          is_recurring: isRecurring,
          recurrence_type: isRecurring ? recurrenceType : null,
          recurrence_days: isRecurring && recurrenceType === "custom" ? recurrenceDays : null,
          recurrence_weekdays: isRecurring && recurrenceType === "weekdays" ? recurrenceWeekdays : null,
        },
      });
      handleClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    const deleted = await onDelete();
    if (deleted) handleClose();
  };

  // Subtask handlers — fully optimistic
  const handleAddSubtask = async () => {
    const val = newSubtaskTitle.trim();
    if (!val || subtaskSaving) return;
    setSubtaskSaving(true);
    const tempId = `temp-${Date.now()}`;
    setSubtasks(prev => [...prev, { id: tempId, title: val, is_completed: false }]);
    setNewSubtaskTitle("");
    try {
      const res = await createSubtaskMutation.mutateAsync({ taskId: task.id, title: val });
      setSubtasks(prev => prev.map(s => s.id === tempId ? { ...s, id: res.id } : s));
    } catch {
      setSubtasks(prev => prev.filter(s => s.id !== tempId));
    } finally {
      setSubtaskSaving(false);
    }
  };

  const handleToggleSubtask = async (id: string, current: boolean) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, is_completed: !current } : s));
    updateSubtaskMutation.mutate({ subtaskId: id, fields: { is_completed: !current } });
  };

  const handleDeleteSubtask = async (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
    deleteSubtaskMutation.mutate(id);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategoryMutation.mutateAsync(newCategoryName.trim());
    setNewCategoryName("");
    setIsAddingCategory(false);
    setIsCategoryOpen(false);
  };

  const handleReschedule = (days: number | null) => {
    if (days === null) { setDate(""); }
    else {
      const d = new Date();
      d.setDate(d.getDate() + days);
      setDate(d.toISOString().split("T")[0]);
    }
    mark();
  };

  const handleTogglePin = async () => {
    await updateTaskMutation.mutateAsync({
      taskId: task.id,
      fields: { is_pinned: !task.is_pinned },
    });
  };

  const subtasksCompleted = subtasks.filter(s => s.is_completed).length;
  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <>
      <div ref={backdropRef} className="fixed inset-0 bg-[#0A0A0A]/50 z-50" onClick={handleClose} />
      <div ref={panelRef} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l-[3px] border-black z-50 flex flex-col rounded-l-[1.5rem] shadow-[-8px_8px_0_rgba(0,0,0,1)]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black/10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePin}
              className={`p-2 rounded-[0.75rem] border-2 border-black transition-all shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${task.is_pinned ? "bg-[#FFD600]" : "bg-white"}`}
            >
              <Pin className="w-4 h-4" />
            </button>
            {isDirty && (
              <span className="text-[11px] font-space text-[#888] animate-pulse">Unsaved changes</span>
            )}
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-[#F5F5F0] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {/* Title */}
          <input
            className="w-full text-[26px] font-extrabold font-jakarta outline-none bg-transparent placeholder-[#CCCCCC] leading-tight"
            value={title}
            onChange={e => { setTitle(e.target.value); mark(); }}
            placeholder="Task title..."
          />

          {/* Status */}
          <div className="flex flex-col gap-2">
            <span className="font-space font-bold text-[11px] text-[#888] uppercase tracking-wider">Status</span>
            <div className="flex gap-2">
              {(["todo", "in_progress", "done"] as PersonalTaskStatus[]).map(s => (
                <button key={s} onClick={() => { setStatus(s); mark(); }}
                  className={`px-3 py-1.5 font-space font-bold text-xs border-2 border-black rounded-full transition-all
                    ${status === s ? "bg-black text-white shadow-none" : "bg-white text-black shadow-[2px_2px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black]"}`}
                >
                  {s === "todo" ? "Todo" : s === "in_progress" ? "In Progress" : "Done"}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <span className="font-space font-bold text-[11px] text-[#888] uppercase tracking-wider">Priority</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { val: "high", label: "High", cls: "bg-[#FF3B30] text-white" },
                { val: "medium", label: "Medium", cls: "bg-[#FF9500] text-black" },
                { val: "low", label: "Low", cls: "bg-[#00C853] text-white" },
              ].map(p => (
                <button key={p.val} onClick={() => { setPriority(p.val as PersonalTaskPriority); mark(); }}
                  className={`px-3 py-1.5 font-space font-bold text-xs border-2 border-black rounded-full transition-all
                    ${priority === p.val ? `${p.cls} shadow-none` : "bg-white text-black shadow-[2px_2px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black]"}`}
                >{p.label}</button>
              ))}
              <button onClick={() => { setPriority(null); mark(); }}
                className={`px-3 py-1.5 font-space font-bold text-xs border-2 border-black rounded-full transition-all
                  ${!priority ? "bg-[#F5F5F0] text-black shadow-none" : "bg-white text-black shadow-[2px_2px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black]"}`}
              >None</button>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2 relative">
            <span className="font-space font-bold text-[11px] text-[#888] uppercase tracking-wider">Category</span>
            <button onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="w-full text-left px-4 py-2.5 bg-white border-2 border-black rounded-[0.75rem] font-vietnam text-sm shadow-[2px_2px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black] transition-all flex justify-between items-center"
            >
              <span className={selectedCategory ? "text-black" : "text-[#AAA]"}>{selectedCategory?.name || "No category"}</span>
              <span className="text-xs text-[#888]">▼</span>
            </button>
            {isCategoryOpen && (
              <div className="absolute top-[100%] mt-1 w-full bg-white border-2 border-black rounded-[0.75rem] shadow-[4px_4px_0_black] z-20 overflow-hidden max-h-[200px] overflow-y-auto">
                <button onClick={() => { setCategoryId(null); setIsCategoryOpen(false); mark(); }}
                  className="w-full px-4 py-2.5 text-left font-vietnam text-sm hover:bg-[#F5F5F0] border-b border-black/10 text-[#888]">
                  No category
                </button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => { setCategoryId(c.id); setIsCategoryOpen(false); mark(); }}
                    className={`w-full px-4 py-2.5 text-left font-vietnam text-sm hover:bg-[#F5F5F0] border-b border-black/10 ${categoryId === c.id ? "font-bold bg-[#FFFDE7]" : ""}`}>
                    {c.name}
                  </button>
                ))}
                {isAddingCategory ? (
                  <div className="p-3 bg-[#F5F5F0] flex gap-2">
                    <input autoFocus className="flex-1 px-3 py-1.5 border-2 border-black rounded-md text-sm font-vietnam outline-none"
                      placeholder="Category name..." value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreateCategory()} />
                    <button onClick={handleCreateCategory} className="px-3 py-1.5 bg-[#FFD600] border-2 border-black rounded-md text-sm font-bold shadow-[2px_2px_0_black]">Save</button>
                  </div>
                ) : (
                  <button onClick={() => setIsAddingCategory(true)}
                    className="w-full px-4 py-2.5 text-left font-vietnam text-sm text-[#555550] hover:bg-[#F5F5F0] flex items-center gap-2 italic">
                    <Plus className="w-3.5 h-3.5" /> New category...
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <span className="font-space font-bold text-[11px] text-[#888] uppercase tracking-wider">Start Date</span>
              <input type="date" value={date} onChange={e => { setDate(e.target.value); mark(); }}
                className="w-full px-3 py-2 bg-white border-2 border-black rounded-[0.75rem] font-vietnam text-sm outline-none focus:shadow-[2px_2px_0_black] transition-all" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <span className="font-space font-bold text-[11px] text-[#888] uppercase tracking-wider">Deadline</span>
              <input type="date" value={deadline} onChange={e => { setDeadline(e.target.value); mark(); }}
                className="w-full px-3 py-2 bg-white border-2 border-black rounded-[0.75rem] font-vietnam text-sm outline-none focus:shadow-[2px_2px_0_black] transition-all" />
            </div>
          </div>
          <div className="flex gap-2 -mt-3">
            {[{ label: "Tomorrow", days: 1 }, { label: "Next Week", days: 7 }, { label: "Clear", days: null }].map(opt => (
              <button key={opt.label} onClick={() => handleReschedule(opt.days)}
                className="flex-1 px-2 py-1.5 text-[11px] font-bold font-space bg-white border-2 border-black rounded-[0.75rem] shadow-[2px_2px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black] transition-all">
                {opt.label}
              </button>
            ))}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <span className="font-space font-bold text-[11px] text-[#888] uppercase tracking-wider">Notes</span>
            <Textarea value={description} onChange={e => { setDescription(e.target.value); mark(); }}
              placeholder="Add notes..." rows={3}
              className="resize-y p-3 font-vietnam text-sm border-2 border-black rounded-[0.75rem] focus:shadow-[2px_2px_0_black] transition-shadow bg-white outline-none" />
          </div>

          {/* Subtasks */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-space font-bold text-[11px] text-[#888] uppercase tracking-wider">Subtasks</span>
              {subtasks.length > 0 && (
                <span className="font-space text-[11px] text-[#888]">{subtasksCompleted}/{subtasks.length} done</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 group px-3 py-2 rounded-[0.75rem] hover:bg-[#F5F5F0] transition-colors">
                  <button
                    onClick={() => handleToggleSubtask(st.id, st.is_completed)}
                    className={`w-5 h-5 rounded-full border-2 border-black shrink-0 flex items-center justify-center transition-all
                      ${st.is_completed ? "bg-[#FFD600]" : "bg-white hover:bg-[#F5F5F0]"}`}
                  >
                    {st.is_completed && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                  </button>
                  <span className={`flex-1 font-vietnam text-sm ${st.is_completed ? "line-through text-[#AAA]" : "text-[#0A0A0A]"}`}>
                    {st.title}
                  </span>
                  <button onClick={() => handleDeleteSubtask(st.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#CCC] hover:text-[#FF3B30] p-1 rounded-md">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask */}
            <div className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-black/20 rounded-[0.75rem] focus-within:border-black focus-within:bg-[#FAFAFA] transition-all">
              <Plus className="w-4 h-4 text-[#CCC] shrink-0" />
              <input
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddSubtask()}
                placeholder="Add a subtask..."
                className="flex-1 bg-transparent font-vietnam text-sm outline-none placeholder-[#CCC]"
              />
              {newSubtaskTitle.trim() && (
                <button onClick={handleAddSubtask} disabled={subtaskSaving}
                  className="shrink-0 bg-[#FFD600] border-2 border-black rounded-md px-2 py-0.5 text-[11px] font-space font-bold shadow-[1px_1px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                  ↵
                </button>
              )}
            </div>
          </div>

          {/* Recurrence */}
          <div className="flex flex-col gap-3 border-2 border-black/10 rounded-[1rem] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RepeatIcon className="w-4 h-4 text-[#888]" />
                <span className="font-space font-bold text-[11px] text-[#888] uppercase tracking-wider">Recurrence</span>
              </div>
              <button
                onClick={() => { setIsRecurring(!isRecurring); mark(); }}
                className={`relative w-10 h-5 rounded-full border-2 border-black transition-all ${isRecurring ? "bg-[#00C853]" : "bg-[#E8E8E0]"}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white border border-black/30 shadow-sm transition-all ${isRecurring ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>

            {isRecurring && (
              <div className="flex flex-col gap-3">
                {/* Type pills */}
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { val: "daily", label: "Daily" },
                    { val: "weekly", label: "Weekly" },
                    { val: "weekdays", label: "Specific Days" },
                    { val: "custom", label: "Every N Days" },
                  ] as { val: PersonalTaskRecurrenceType; label: string }[]).map(opt => (
                    <button key={opt.val}
                      onClick={() => { setRecurrenceType(opt.val); mark(); }}
                      className={`px-3 py-1 font-space font-bold text-[11px] rounded-full border-2 border-black transition-all
                        ${recurrenceType === opt.val ? "bg-black text-white shadow-none" : "bg-white text-[#555550] shadow-[1px_1px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"}`}
                    >{opt.label}</button>
                  ))}
                </div>

                {/* Specific days of week */}
                {recurrenceType === "weekdays" && (
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map((d, i) => {
                      const active = recurrenceWeekdays.includes(i);
                      return (
                        <button key={d} onClick={() => {
                          setRecurrenceWeekdays(prev =>
                            prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                          );
                          mark();
                        }}
                          className={`w-10 h-10 font-space font-bold text-xs rounded-full border-2 border-black transition-all
                            ${active ? "bg-[#FFD600] shadow-none" : "bg-white shadow-[2px_2px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black]"}`}
                        >{d}</button>
                      );
                    })}
                  </div>
                )}

                {/* Every N days */}
                {recurrenceType === "custom" && (
                  <div className="flex items-center gap-3">
                    <span className="font-vietnam text-sm text-[#555550]">Every</span>
                    <input type="number" min={1} max={365} value={recurrenceDays}
                      onChange={e => { setRecurrenceDays(parseInt(e.target.value) || 1); mark(); }}
                      className="w-16 px-3 py-1.5 border-2 border-black rounded-md font-vietnam text-sm text-center outline-none focus:shadow-[2px_2px_0_black]" />
                    <span className="font-vietnam text-sm text-[#555550]">days</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-black/10 shrink-0 flex items-center gap-3">
          <button onClick={handleDeleteTask}
            className="p-2.5 bg-white text-[#FF3B30] border-2 border-[#FF3B30]/40 rounded-[0.75rem] hover:bg-[#FF3B30] hover:text-white hover:border-[#FF3B30] transition-all shadow-[2px_2px_0_#FF3B3044]">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => { onArchive(); handleClose(); }}
            className="px-4 py-2.5 bg-white text-black border-2 border-black rounded-[0.75rem] font-space font-bold text-xs shadow-[2px_2px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black] transition-all">
            Archive
          </button>
          <button onClick={handleSave} disabled={!isDirty || isSaving}
            className="flex-1 flex items-center justify-center gap-2 bg-[#FFD600] text-black border-2 border-black rounded-[0.75rem] font-space font-bold text-sm py-2.5 shadow-[2px_2px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black] transition-all disabled:opacity-40 disabled:pointer-events-none">
            {isSaving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>
    </>
  );
}
