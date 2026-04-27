"use client"

import { useOptimistic, useTransition, useState } from "react"
import { Flame, CheckCheck, Loader2, Check, Archive } from "lucide-react"
import { cn } from "@/lib/utils"
import { getRelativeTimeString } from "@/lib/utils/task-helpers"
import { CommunityTask, toggleTaskCompletion, updateTaskStatus } from "@/actions/tasks"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import TaskDrilldownDialog from "./TaskDrilldownDialog"



export default function TasksListClient({
  tasks,
  communityId,
  memberCount,
  isModerator = false,
}: {
  tasks: CommunityTask[]
  communityId: string
  memberCount: number
  isModerator?: boolean
}) {
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (state, { taskId, completed }: { taskId: string; completed: boolean }) =>
      state.map((task) => {
        if (task.id === taskId) {
          const wasCompleted = task.completed_by_me
          if (wasCompleted === completed) return task

          return {
            ...task,
            completed_by_me: completed,
            completion_count: task.completion_count + (completed ? 1 : -1),
          }
        }
        return task
      })
  )

  const [isPending, startTransition] = useTransition()
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)

  const handleToggle = (taskId: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted

    startTransition(async () => {
      addOptimisticTask({ taskId, completed: newCompleted })
      try {
        await toggleTaskCompletion(taskId, communityId)
      } catch (error) {
        console.error("Failed to toggle task completion:", error)
      }
    })
  }

  const handleApprove = (taskId: string) => {
    setApprovingId(taskId)
    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, "active", communityId)
      } catch (error) {
        console.error("Failed to approve task:", error)
      } finally {
        setApprovingId(null)
      }
    })
  }

  const handleClose = (taskId: string) => {
    setClosingId(taskId)
    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, "closed", communityId)
      } catch (error) {
        console.error("Failed to close task:", error)
      } finally {
        setClosingId(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {optimisticTasks.map((task) => {
        const percentage = memberCount > 0 ? Math.round((task.completion_count / memberCount) * 100) : 0
        const dueDateStr = getRelativeTimeString(task.due_date)

        return (
          <Card key={task.id} className="flex flex-row items-stretch p-0 overflow-hidden min-h-[120px]">
            <button
              onClick={() => handleToggle(task.id, task.completed_by_me)}
              className={cn(
                "w-20 sm:w-24 shrink-0 border-r-[2.5px] border-foreground flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:bg-background group",
                task.completed_by_me ? "bg-[#FFD600]" : "bg-background hover:bg-[#EBEBE6]"
              )}
            >
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 border-[3px] border-foreground rounded-[12px] flex items-center justify-center transition-all duration-200",
                task.completed_by_me 
                  ? "bg-foreground shadow-none" 
                  : "bg-card shadow-[4px_4px_0px_black] group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none"
              )}>
                <Check 
                  className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 stroke-[4px] transition-all duration-300", 
                    task.completed_by_me ? "text-[#FFD600] scale-100" : "text-foreground/10 scale-50 opacity-0 group-hover:opacity-100 group-hover:scale-100"
                  )} 
                />
              </div>
            </button>
            <div className="flex-1 flex flex-col justify-center gap-3.5 min-w-0 py-6 px-5 sm:px-6 bg-card">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <h3 className="font-heading text-[22px] sm:text-[24px] font-extrabold text-foreground leading-[1.2] break-words">
                  {task.title}
                </h3>
                <div className="flex items-center gap-2 shrink-0">
                  {dueDateStr && (
                    <span className="shrink-0 text-xs font-medium px-3 py-1 bg-background border-[1.5px] border-foreground rounded-full shadow-[2px_2px_0px_black] whitespace-nowrap">
                      {dueDateStr}
                    </span>
                  )}
                  {/* Approve button — pending tasks only, moderators only */}
                  {isModerator && task.status === "pending" && (
                    <button
                      onClick={() => handleApprove(task.id)}
                      disabled={approvingId === task.id}
                      title="Approve — move to Active"
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-[#00C853] text-white border-[1.5px] border-foreground rounded-full shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {approvingId === task.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3 h-3" />
                      )}
                      Approve
                    </button>
                  )}
                  {isModerator && task.status === "active" && (
                    <button
                      onClick={() => handleClose(task.id)}
                      disabled={closingId === task.id}
                      title="Archive Task"
                      className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-card border-[1.5px] border-foreground rounded-[8px] shadow-[2px_2px_0px_black] hover:bg-[#FF4D4D] hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {closingId === task.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {isModerator && (
                    <TaskDrilldownDialog taskId={task.id} communityId={communityId} />
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1">
                <Progress value={percentage} />
                <span className="flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground">
                  <Flame className="w-4 h-4 text-[#FF6B00] shrink-0" strokeWidth={2} />
                  {percentage}% of members completed this ({task.completion_count}/{memberCount})
                </span>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
