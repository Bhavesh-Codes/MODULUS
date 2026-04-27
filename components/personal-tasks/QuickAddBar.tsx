"use client";

import { useState, useRef, useEffect } from "react";
import { createTask } from "@/actions/personal-tasks";
import { Loader2 } from "lucide-react";

interface QuickAddBarProps {
  onTaskCreated: () => void;
}

export function QuickAddBar({ onTaskCreated }: QuickAddBarProps) {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && title.trim() && !isSaving) {
      setIsSaving(true);
      try {
        await createTask(title.trim());
        setTitle("");
        onTaskCreated();
      } catch (err) {
        console.error("Failed to create task", err);
      } finally {
        setIsSaving(false);
        // Refocus after saving
        inputRef.current?.focus();
      }
    }
  };

  return (
    <div className="w-full bg-white border-2 border-black rounded-[1.5rem] shadow-[4px_4px_0_black] p-4 flex items-center gap-3 transition-all focus-within:shadow-[6px_6px_0_black] focus-within:-translate-y-[2px] focus-within:-translate-x-[2px] mb-6">
      <input 
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        placeholder="Add a task and press Enter..."
        className={`flex-1 bg-transparent border-none outline-none font-vietnam text-[18px] text-[#0A0A0A] placeholder-[#999990] ${isSaving ? 'opacity-50' : 'opacity-100'}`}
      />
      {isSaving ? (
        <Loader2 className="w-5 h-5 animate-spin text-[#555550] shrink-0" />
      ) : (
        <span className="font-space text-sm text-[#999990] shrink-0">
          ↵ to add
        </span>
      )}
    </div>
  );
}
