"use client"

import { useState, useEffect } from "react"
import { getTaskDrilldown, DrilldownEntry } from "@/actions/tasks"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function TaskDrilldownDialog({
  taskId,
  communityId,
}: {
  taskId: string
  communityId: string
}) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<DrilldownEntry[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && !data && !loading) {
      setLoading(true)
      getTaskDrilldown(taskId, communityId)
        .then((res) => setData(res))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, taskId, communityId, data, loading])

  const completed = data?.filter((d) => d.completed) || []
  const pending = data?.filter((d) => !d.completed) || []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs font-bold px-3 py-1 bg-card border-[1.5px] border-foreground rounded-md shadow-[2px_2px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150 shrink-0">
          View Details
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Task Details</DialogTitle>
        </DialogHeader>
        
        {loading || !data ? (
          <div className="py-12 flex justify-center">
            <div className="animate-pulse flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-[#FFD600] border border-foreground rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-[#FFD600] border border-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-3 h-3 bg-[#FFD600] border border-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 mt-4">
            <div>
              <h3 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00C853] border border-foreground"></span>
                Completed ({completed.length})
              </h3>
              <div className="flex flex-col gap-3">
                {completed.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No one has completed this yet.</p>
                ) : (
                  completed.map(user => (
                    <div key={user.user_id} className="flex items-center gap-3 bg-background p-2 rounded-[12px] border-2 border-foreground">
                      <div className="h-8 w-8 border-[1.5px] border-foreground rounded-full overflow-hidden bg-[#FFD600] flex items-center justify-center shrink-0">
                        {user.profile_pic ? (
                          <img src={user.profile_pic} alt={user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-bold text-foreground text-xs">
                            {user.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 truncate text-sm font-medium">{user.name}</div>
                      {user.role === 'owner' || user.role === 'curator' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-foreground rounded-full bg-card shadow-[1px_1px_0px_black]">
                          {user.role}
                        </span>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF3B30] border border-foreground"></span>
                Pending ({pending.length})
              </h3>
              <div className="flex flex-col gap-3">
                {pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Everyone completed it!</p>
                ) : (
                  pending.map(user => (
                    <div key={user.user_id} className="flex items-center gap-3 bg-card p-2 rounded-[12px] border-2 border-foreground opacity-75">
                      <div className="h-8 w-8 border-[1.5px] border-foreground rounded-full overflow-hidden bg-card flex items-center justify-center shrink-0">
                        {user.profile_pic ? (
                          <img src={user.profile_pic} alt={user.name} className="h-full w-full object-cover grayscale" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-bold text-foreground text-xs">
                            {user.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 truncate text-sm font-medium">{user.name}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
