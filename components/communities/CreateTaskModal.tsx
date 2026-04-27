"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createTask } from "@/actions/tasks"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PlusIcon, Loader2Icon, Rocket, FileText } from "lucide-react"

// Shared label + field wrapper for consistent spacing
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-foreground tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function CreateTaskModal({ communityId }: { communityId: string }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState<"pending" | "active">("active")
  const [dueDate, setDueDate] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Task title is required.")
      return
    }

    startTransition(async () => {
      try {
        await createTask(
          communityId,
          title,
          status,
          dueDate ? new Date(dueDate) : undefined,
        )
        toast.success("Task created successfully!")
        // Reset form and close
        setTitle("")
        setStatus("active")
        setDueDate("")
        setOpen(false)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong."
        toast.error(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#FFD600] text-foreground border-[3px] border-foreground rounded-[14px] shadow-[6px_6px_0px_black] hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none hover:bg-[#FFD600] transition-all duration-150 font-bold h-12 px-6">
          <PlusIcon className="w-5 h-5 mr-2 stroke-[2.5px]" />
          Create Task
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-2">
          {/* Title */}
          <FieldGroup label="Task Title *">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Chapter 3 exercises"
              required
              maxLength={200}
              className="w-full h-11 px-4 bg-card border-2 border-foreground rounded-[12px] text-foreground text-sm placeholder:text-muted-foreground/70 outline-none focus:shadow-[4px_4px_0px_black] transition-all duration-150 disabled:opacity-50"
            />
          </FieldGroup>

          {/* Status */}
          <FieldGroup label="Initial Status">
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "pending" | "active")}
            >
              <SelectTrigger className="w-full h-11 px-4 bg-card border-2 border-foreground rounded-[12px] text-sm shadow-none focus:shadow-[4px_4px_0px_black] transition-all duration-150 data-[size=default]:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 border-foreground rounded-[12px] shadow-[4px_4px_0px_black] bg-card">
                <SelectItem value="active" className="cursor-pointer font-medium focus:bg-[#FFD600] focus:text-foreground">
                  <span className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 shrink-0" />
                    Publish Immediately (Active)
                  </span>
                </SelectItem>
                <SelectItem value="pending" className="cursor-pointer font-medium focus:bg-[#FFD600] focus:text-foreground">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 shrink-0" />
                    Save as Draft (Pending)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Draft tasks are only visible to owners and curators until approved.
            </p>
          </FieldGroup>

          {/* Due Date */}
          <FieldGroup label="Due Date (Optional)">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full h-11 px-4 bg-card border-2 border-foreground rounded-[12px] text-sm text-foreground outline-none focus:shadow-[4px_4px_0px_black] transition-all duration-150 disabled:opacity-50 [color-scheme:light]"
            />
          </FieldGroup>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="flex-1 h-11 bg-card border-2 border-foreground rounded-[14px] shadow-[4px_4px_0px_black] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-150 font-bold text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#FFD600] text-foreground border-[3px] border-foreground rounded-[14px] shadow-[4px_4px_0px_black] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-150 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
