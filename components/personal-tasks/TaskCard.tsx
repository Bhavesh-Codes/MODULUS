"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { Pin, Repeat, MoreHorizontal, Calendar } from "lucide-react";
import { PersonalTaskWithDetails } from "@/lib/types/personal-tasks";
import { updateTask } from "@/actions/personal-tasks";
import { isTaskOverdue } from "@/lib/utils/task-helpers";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: PersonalTaskWithDetails;
  onClick: () => void;
  onComplete: () => void;
  onArchive: () => void;
  onUpdate: () => void;
}

export function TaskCard({ task, onClick, onComplete, onArchive, onUpdate }: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCompleting, setIsCompleting] = useState(false);

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

  const handleTogglePin = async () => {
    await updateTask(task.id, { is_pinned: !task.is_pinned });
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

  const handleArchive = () => {
    onArchive();
  };

  const today = new Date().toISOString().split("T")[0];
  const isOverdue = isTaskOverdue(task);

  const subtasksTotal = task.subtasks.length;
  const subtasksCompleted = task.subtasks.filter(st => st.is_completed).length;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group relative flex items-center justify-between p-4 bg-white border-2 border-black rounded-[1rem] shadow-[3px_3px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_black] transition-all cursor-pointer ${isCompleting ? 'pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isCompleting || task.status === "done"}
            onCheckedChange={(c) => handleComplete(!!c)}
            className="w-5 h-5 border-2 border-black rounded-sm data-[state=checked]:bg-[#FFD600] data-[state=checked]:text-black transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-2">
            {task.is_pinned && <Pin className="w-4 h-4 text-[#FFD600] fill-[#FFD600] shrink-0" />}
            {task.is_recurring && <Repeat className="w-4 h-4 text-[#0057FF] shrink-0" />}

            <span className={`font-vietnam font-medium text-[16px] truncate ${isCompleting ? 'line-through text-[#999990]' : isOverdue ? 'text-[#FF3B30]' : 'text-[#0A0A0A]'}`}>
              {task.title}
            </span>

            {isOverdue && (
              <Badge className="bg-[#FF3B30] text-white hover:bg-[#FF3B30] border-[1.5px] border-black px-1.5 py-0 h-auto text-[10px] uppercase font-space shrink-0 shadow-[2px_2px_0_black]">
                Overdue
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Priority */}
            {task.priority && (
              <div className="flex items-center gap-1.5 shrink-0" title={`Priority: ${task.priority}`}>
                <div className={`w-2.5 h-2.5 rounded-full border-[1.5px] border-black ${task.priority === "high" ? "bg-[#FF3B30]" :
                    task.priority === "medium" ? "bg-[#FFD600]" :
                      "bg-[#00C853]"
                  }`} />
              </div>
            )}

            {/* Subtasks */}
            {subtasksTotal > 0 && (
              <span className="font-space text-[12px] text-[#555550] shrink-0">
                {subtasksCompleted} / {subtasksTotal}
              </span>
            )}

            {/* Category */}
            {task.category && (
              <Badge variant="outline" className="text-[#555550] border-[1.5px] border-black bg-[#F5F5F0] font-space text-[11px] px-2 py-0 shrink-0">
                {task.category.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 pl-4">
        {/* Deadline */}
        {task.deadline && (
          <span className={`font-space text-[12px] flex items-center gap-1 ${isOverdue ? 'text-[#FF3B30] font-bold' : 'text-[#555550]'}`}>
            <Calendar className="w-3.5 h-3.5" />
            {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}

        {/* Hover Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-[#E8E8E0] rounded-[0.5rem] transition-colors border-2 border-transparent hover:border-black outline-none focus:border-black">
                <MoreHorizontal className="w-5 h-5 text-black" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white border-2 border-black rounded-[0.75rem] shadow-[4px_4px_0_black] p-1 font-vietnam"
            >
              <DropdownMenuItem
                onClick={handleTogglePin}
                className="cursor-pointer focus:bg-[#F5F5F0] rounded-md font-medium text-[#0A0A0A]"
              >
                {task.is_pinned ? "Unpin task" : "Pin task"}
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer focus:bg-[#F5F5F0] rounded-md font-medium text-[#0A0A0A]">
                  Reschedule...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40 bg-white border-2 border-black rounded-[0.75rem] shadow-[4px_4px_0_black] p-1 font-vietnam">
                  <DropdownMenuItem
                    onClick={() => handleReschedule(1)}
                    className="cursor-pointer focus:bg-[#F5F5F0] rounded-md text-[#0A0A0A]"
                  >
                    Tomorrow
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleReschedule(7)}
                    className="cursor-pointer focus:bg-[#F5F5F0] rounded-md text-[#0A0A0A]"
                  >
                    Next Week
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleReschedule(null)}
                    className="cursor-pointer focus:bg-[#F5F5F0] rounded-md text-[#0A0A0A]"
                  >
                    Clear Date
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator className="bg-black/10 my-1 h-[2px]" />

              <DropdownMenuItem
                onClick={handleArchive}
                className="cursor-pointer focus:bg-[#FF3B30] text-[#FF3B30] focus:text-white rounded-md font-bold transition-colors"
              >
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
