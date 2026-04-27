"use client";

import { useState, useRef, useEffect } from "react";
import { useCreateTask } from "@/lib/hooks/use-personal-tasks";
import { PersonalTaskCategory } from "@/lib/types/personal-tasks";
import {
  Loader2, CalendarDays, CalendarClock, Flag, Tag, X, ListChecks, Plus,
} from "lucide-react";

interface QuickAddBarProps {
  categories?: PersonalTaskCategory[];
}

const PRIORITY_OPTIONS = [
  { value: "high",   label: "High",   color: "bg-[#FF3B30] text-white" },
  { value: "medium", label: "Medium", color: "bg-[#FF9500] text-black" },
  { value: "low",    label: "Low",    color: "bg-[#00C853] text-white" },
];

export function QuickAddBar({ categories = [] }: QuickAddBarProps) {
  const [title, setTitle] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const [date, setDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const createTaskMutation = useCreateTask();
  const isSaving = createTaskMutation.isPending;

  // Click-outside collapse — only if no title entered
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!title.trim()) {
          setIsExpanded(false);
          setDate(""); setDeadline(""); setPriority(""); setCategoryId("");
          setSubtasks([]); setSubtaskInput("");
        }
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [title]);

  const reset = () => {
    setTitle(""); setDate(""); setDeadline(""); setPriority(""); setCategoryId("");
    setSubtasks([]); setSubtaskInput(""); setIsExpanded(false);
  };

  const addSubtask = () => {
    const val = subtaskInput.trim();
    if (!val) return;
    setSubtasks(prev => [...prev, val]);
    setSubtaskInput("");
    subtaskInputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!title.trim() || isSaving) return;
    const finalSubtasks = subtaskInput.trim() ? [...subtasks, subtaskInput.trim()] : subtasks;
    createTaskMutation.mutate(
      {
        title: title.trim(),
        opts: {
          date: date || null,
          deadline: deadline || null,
          priority: (priority as any) || null,
          category_id: categoryId || null,
        },
        subtaskTitles: finalSubtasks.length > 0 ? finalSubtasks : undefined,
      },
      {
        onSuccess: () => {
          reset();
          inputRef.current?.focus();
        },
        onError: (err) => {
          console.error("Failed to create task", err);
          inputRef.current?.focus();
        },
      }
    );
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") { reset(); inputRef.current?.blur(); }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addSubtask(); }
    if (e.key === "Escape") setSubtaskInput("");
  };

  const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === priority);
  const selectedCategory = categories.find(c => c.id === categoryId);

  // Summary chips shown in the collapsed title row only when NOT expanded
  const collapsedChips = !isExpanded && (date || deadline || priority || categoryId || subtasks.length > 0);

  return (
    <div
      ref={containerRef}
      className={`w-full bg-white border-2 border-black rounded-[1.25rem] transition-shadow duration-200 overflow-hidden ${
        isExpanded ? "shadow-[4px_4px_0_black]" : "shadow-[2px_2px_0_black]"
      }`}
    >
      {/* ── Title row ── */}
      <div className="flex items-center gap-3 px-4 py-3 min-w-0">
        <input
          ref={inputRef}
          value={title}
          onChange={e => { setTitle(e.target.value); if (!isExpanded) setIsExpanded(true); }}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={handleTitleKeyDown}
          disabled={isSaving}
          placeholder="Add a task..."
          className="flex-1 min-w-0 bg-transparent border-none outline-none font-vietnam text-[15px] text-[#0A0A0A] placeholder-[#BBBBBB]"
        />

        {/* Collapsed summary chips */}
        {collapsedChips && (
          <div className="flex items-center gap-1.5 shrink-0 overflow-hidden">
            {date && (
              <span suppressHydrationWarning className="flex items-center gap-1 text-[11px] font-space font-bold bg-[#E8F4FF] text-[#0057FF] border border-[#0057FF]/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                <CalendarDays className="w-3 h-3 shrink-0" />
                {new Date(date + "T00:00:00").toLocaleDateString('en-US', { month: "short", day: "numeric" })}
              </span>
            )}
            {deadline && (
              <span suppressHydrationWarning className="flex items-center gap-1 text-[11px] font-space font-bold bg-[#FFF0F0] text-[#FF3B30] border border-[#FF3B30]/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                <CalendarClock className="w-3 h-3 shrink-0" />
                {new Date(deadline + "T00:00:00").toLocaleDateString('en-US', { month: "short", day: "numeric" })}
              </span>
            )}
            {selectedPriority && (
              <span className={`flex items-center gap-1 text-[11px] font-space font-bold border border-black/20 rounded-full px-2 py-0.5 whitespace-nowrap ${selectedPriority.color}`}>
                <Flag className="w-3 h-3 shrink-0" />
                {selectedPriority.label}
              </span>
            )}
            {selectedCategory && (
              <span className="flex items-center gap-1 text-[11px] font-space font-bold bg-[#F5F5F0] text-[#555550] border border-black/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                <Tag className="w-3 h-3 shrink-0" />
                {selectedCategory.name}
              </span>
            )}
            {subtasks.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-space font-bold bg-[#F0F0FF] text-[#5500CC] border border-[#5500CC]/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                <ListChecks className="w-3 h-3 shrink-0" />
                {subtasks.length}
              </span>
            )}
          </div>
        )}

        {/* Hint */}
        {!isSaving && !isExpanded && !title.trim() && (
          <span className="font-space text-xs text-[#BBBBBB] shrink-0">↵ to add</span>
        )}
        {isSaving && <Loader2 className="w-4 h-4 animate-spin text-[#555550] shrink-0" />}
      </div>

      {/* ── Expanded panel ── */}
      {isExpanded && (
        <div className="border-t border-black/10">

          {/* Metadata row — all on one line */}
          <div className="px-4 py-2 flex flex-wrap gap-x-3 gap-y-1.5 items-center">
            <span className="font-space text-[9px] font-bold text-[#CCCCCC] uppercase tracking-wider mr-1">Optional</span>

            {/* Date */}
            <label className="flex items-center gap-1 cursor-pointer group">
              <span className="flex items-center gap-0.5 text-[11px] font-space font-bold text-[#888] group-hover:text-black transition-colors">
                <CalendarDays className="w-3 h-3" /> Date
              </span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="text-[11px] font-space bg-[#F5F5F0] border border-black/20 rounded-md px-1.5 py-0.5 outline-none focus:border-black cursor-pointer" />
              {date && <button onClick={() => setDate("")} className="text-[#CCC] hover:text-[#FF3B30]"><X className="w-2.5 h-2.5" /></button>}
            </label>

            <span className="text-black/15 text-xs">·</span>

            {/* Deadline */}
            <label className="flex items-center gap-1 cursor-pointer group">
              <span className="flex items-center gap-0.5 text-[11px] font-space font-bold text-[#888] group-hover:text-[#FF3B30] transition-colors">
                <CalendarClock className="w-3 h-3" /> Due
              </span>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="text-[11px] font-space bg-[#F5F5F0] border border-black/20 rounded-md px-1.5 py-0.5 outline-none focus:border-black cursor-pointer" />
              {deadline && <button onClick={() => setDeadline("")} className="text-[#CCC] hover:text-[#FF3B30]"><X className="w-2.5 h-2.5" /></button>}
            </label>

            <span className="text-black/15 text-xs">·</span>

            {/* Priority */}
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-0.5 text-[11px] font-space font-bold text-[#888]">
                <Flag className="w-3 h-3" />
              </span>
              <div className="flex gap-0.5">
                {PRIORITY_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => setPriority(priority === opt.value ? "" : opt.value)}
                    className={`text-[10px] font-space font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      priority === opt.value
                        ? `${opt.color} border-black shadow-[1px_1px_0_black]`
                        : "bg-[#F5F5F0] text-[#888] border-black/15 hover:border-black hover:text-black"
                    }`}>{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <>
                <span className="text-black/15 text-xs">·</span>
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#888]" />
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="text-[11px] font-space bg-[#F5F5F0] border border-black/20 rounded-md px-1.5 py-0.5 outline-none focus:border-black cursor-pointer max-w-[130px]">
                    <option value="">Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Subtasks section */}
          <div className="px-4 pb-3 border-t border-black/5">
            {/* Subtasks header + Add Task button on same row */}
            <div className="flex items-center justify-between pt-2.5 mb-2">
              <div className="flex items-center gap-2">
                <ListChecks className="w-3.5 h-3.5 text-[#888]" />
                <span className="font-space text-[10px] font-bold text-[#888] uppercase tracking-wider">Subtasks</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || isSaving}
                className="flex items-center gap-1.5 bg-[#FFD600] border-2 border-black text-black font-space font-bold text-xs px-3 py-1 rounded-[0.5rem] shadow-[2px_2px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Add Task ↵</>}
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="flex flex-col gap-1 mb-2">
                {subtasks.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <div className="w-3.5 h-3.5 rounded-sm border-2 border-black/30 shrink-0" />
                    <span className="font-vietnam text-[13px] text-[#0A0A0A] flex-1 min-w-0 truncate">{st}</span>
                    <button onClick={() => setSubtasks(prev => prev.filter((_, i) => i !== idx))}
                      className="opacity-0 group-hover:opacity-100 text-[#999] hover:text-[#FF3B30] transition-all shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-[#CCCCCC] shrink-0" />
              <input ref={subtaskInputRef} value={subtaskInput}
                onChange={e => setSubtaskInput(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                placeholder="Add a subtask..."
                className="flex-1 min-w-0 bg-transparent border-none outline-none font-vietnam text-[13px] text-[#0A0A0A] placeholder-[#CCCCCC]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
