"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { Pin, Repeat, Calendar, Trash2, ChevronDown, ChevronUp, Archive } from "lucide-react";
import { PersonalTaskWithDetails } from "@/lib/types/personal-tasks";
import { useUpdateTask, useUpdateSubtask } from "@/lib/hooks/use-personal-tasks";
import { isTaskOverdue } from "@/lib/utils/task-helpers";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: PersonalTaskWithDetails;
  onClick: () => void;
  onComplete: () => void;
  onArchive: () => void;
  onDelete: () => void;
  hideActionsUntilHover?: boolean;
}

export function TaskCard({ task, onClick, onComplete, onArchive, onDelete, hideActionsUntilHover = true }: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);

  const updateTaskMutation = useUpdateTask();
  const updateSubtaskMutation = useUpdateSubtask();

  const handleComplete = (checked: boolean) => {
    if (checked && !isCompleting) {
      setIsCompleting(true);
      // Brief visual animation before completing
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          opacity: 0,
          scale: 0.95,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            onComplete();
          }
        });
      } else {
        onComplete();
      }
    }
  };

  const handleToggleSubtask = (subtaskId: string, currentStatus: boolean) => {
    updateSubtaskMutation.mutate({
      subtaskId,
      fields: { is_completed: !currentStatus },
    });
  };

  const handleTogglePin = () => {
    updateTaskMutation.mutate({
      taskId: task.id,
      fields: { is_pinned: !task.is_pinned },
    });
  };

  const handleReschedule = (days: number | null) => {
    let date = null;
    if (days !== null) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      date = d.toISOString().split("T")[0];
    }
    updateTaskMutation.mutate({
      taskId: task.id,
      fields: { date },
    });
  };

  const handleArchive = () => {
    onArchive();
  };

  const isOverdue = isTaskOverdue(task);
  const subtasksTotal = task.subtasks.length;
  const subtasksCompleted = task.subtasks.filter(st => st.is_completed).length;

  const getPriorityCheckboxStyle = (priority: string | null) => {
    switch (priority) {
      case 'high': return "border-2 border-[#FF3B30] bg-[#FF3B30]/10 data-[state=checked]:bg-[#FF3B30] data-[state=checked]:border-[#FF3B30] data-[state=checked]:text-white";
      case 'medium': return "border-2 border-[#FF9500] bg-[#FF9500]/10 data-[state=checked]:bg-[#FF9500] data-[state=checked]:border-[#FF9500] data-[state=checked]:text-white";
      case 'low': return "border-2 border-[#00C853] bg-[#00C853]/10 data-[state=checked]:bg-[#00C853] data-[state=checked]:border-[#00C853] data-[state=checked]:text-white";
      default: return "border-2 border-black bg-white data-[state=checked]:bg-[#FFD600] data-[state=checked]:border-black data-[state=checked]:text-black";
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group relative flex flex-col p-4 bg-white border-2 border-black rounded-[1rem] shadow-[4px_4px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_black] transition-all cursor-pointer ${isCompleting ? 'pointer-events-none' : ''}`}
    >
      <div className="flex items-start justify-between w-full gap-4">
        {/* Left: Checkbox & Details */}
        <div className="flex items-start gap-4 flex-1 overflow-hidden pt-0.5">
          <div onClick={(e) => e.stopPropagation()} className="p-1 shrink-0">
            <Checkbox
              checked={isCompleting || task.status === "done"}
              onCheckedChange={(c) => handleComplete(!!c)}
              className={`w-6 h-6 rounded-sm transition-all ${getPriorityCheckboxStyle(task.priority)}`}
            />
          </div>

          <div className="flex flex-col gap-2.5 overflow-hidden flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-vietnam font-bold text-[18px] truncate ${isCompleting ? 'line-through text-[#999990]' : isOverdue ? 'text-[#FF3B30]' : 'text-[#0A0A0A]'}`}>
                {task.title}
              </span>

              {subtasksTotal > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSubtasksExpanded(!isSubtasksExpanded);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[0.5rem] transition-all border-2 ml-1 ${isSubtasksExpanded ? 'border-black bg-[#FFD600] shadow-[2px_2px_0_black] translate-x-[-1px] translate-y-[-1px]' : 'border-black bg-white shadow-[2px_2px_0_black] hover:bg-[#F5F5F0] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_black]'}`}
                >
                  <span className="font-space font-bold text-[11px] text-black">
                    {subtasksCompleted}/{subtasksTotal} SUBTASKS
                  </span>
                  {isSubtasksExpanded ? <ChevronUp className="w-3 h-3 text-black" /> : <ChevronDown className="w-3 h-3 text-black" />}
                </button>
              )}
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {task.category && (
                <Badge variant="outline" className="text-[#555550] border-[1.5px] border-black bg-[#F5F5F0] font-space text-[10px] px-2 py-0 uppercase">
                  {task.category.name}
                </Badge>
              )}

              {task.is_recurring && (
                <div className="flex items-center gap-1 text-[#0057FF] bg-[#E5F0FF] px-2 py-0.5 rounded-full border border-[#0057FF]/30">
                  <Repeat className="w-3 h-3" />
                  <span className="font-space text-[10px] font-bold">RECURRING</span>
                </div>
              )}

              {task.deadline && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${isOverdue ? 'border-[#FF3B30] bg-[#FF3B30]/10 text-[#FF3B30]' : 'border-black/20 bg-black/5 text-[#555550]'}`}>
                  <Calendar className="w-3 h-3" />
                  <span className="font-space text-[10px] font-bold uppercase">
                    {isOverdue ? 'OVERDUE ' : 'DUE '}
                    {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className={`flex items-center gap-1.5 shrink-0 ${hideActionsUntilHover ? "opacity-0 group-hover:opacity-100" : "opacity-100"} transition-opacity`} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); handleTogglePin(); }}
            className={`p-2 rounded-[0.5rem] transition-colors border-2 ${task.is_pinned ? 'bg-[#FFD600] border-black shadow-[2px_2px_0_black]' : 'border-transparent hover:border-black hover:bg-[#F5F5F0]'}`}
            title={task.is_pinned ? "Unpin task" : "Pin task"}
          >
            <Pin className={`w-4 h-4 ${task.is_pinned ? 'text-black fill-black' : 'text-[#555550]'}`} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-[0.5rem] transition-colors border-2 border-transparent hover:border-black hover:bg-[#F5F5F0]" title="Reschedule">
                <Calendar className="w-4 h-4 text-[#555550]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white border-2 border-black rounded-[0.75rem] shadow-[4px_4px_0_black] p-1 font-vietnam">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReschedule(1); }} className="cursor-pointer focus:bg-[#F5F5F0] rounded-md text-[#0A0A0A]">
                Tomorrow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReschedule(7); }} className="cursor-pointer focus:bg-[#F5F5F0] rounded-md text-[#0A0A0A]">
                Next Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReschedule(null); }} className="cursor-pointer focus:bg-[#F5F5F0] rounded-md text-[#0A0A0A]">
                Clear Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={(e) => { e.stopPropagation(); handleArchive(); }}
            className="p-2 rounded-[0.5rem] transition-colors border-2 border-transparent hover:border-black hover:bg-[#F5F5F0]"
            title="Archive task"
          >
            <Archive className="w-4 h-4 text-[#555550]" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-[0.5rem] transition-colors border-2 border-transparent hover:border-[#FF3B30] hover:bg-[#FF3B30]/10 text-[#FF3B30]"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {subtasksTotal > 0 && isSubtasksExpanded && (
        <div className="mt-4 pl-[44px] flex flex-col gap-2.5 w-full pr-4" onClick={(e) => e.stopPropagation()}>
          {task.subtasks.map(st => {
            return (
              <div key={st.id} className="flex items-start gap-3 group/subtask">
                <Checkbox
                  checked={st.is_completed}
                  onCheckedChange={() => handleToggleSubtask(st.id, st.is_completed)}
                  className="w-5 h-5 mt-0.5 border-2 border-black rounded-sm data-[state=checked]:bg-[#FFD600] data-[state=checked]:text-black transition-colors shrink-0"
                />
                <span className={`font-vietnam text-[15px] pt-0.5 leading-tight ${st.is_completed ? 'line-through text-[#999990]' : 'text-[#555550]'}`}>
                  {st.title}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
