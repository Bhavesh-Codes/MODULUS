"use client"

import { useState, useEffect } from "react"
import { Trophy, ChevronDown, ChevronUp } from "lucide-react"
import { LeaderboardEntry } from "@/actions/tasks"
import { cn } from "@/lib/utils"

export default function TaskLeaderboardClient({
  leaderboard,
}: {
  leaderboard: LeaderboardEntry[]
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("modulus-leaderboard-expanded")
    if (stored !== null) {
      setIsExpanded(stored === "true")
    }
  }, [])

  const toggleExpanded = () => {
    const next = !isExpanded
    setIsExpanded(next)
    localStorage.setItem("modulus-leaderboard-expanded", String(next))
  }

  // Prevent layout shift during SSR hydration by defaulting to true, 
  // then syncing immediately if client differs.
  const expanded = mounted ? isExpanded : true

  return (
    <div 
      data-collapsed={!expanded}
      className={cn(
        "bg-card border-2 border-foreground rounded-[24px] shadow-[4px_4px_0px_black] overflow-hidden sticky top-6 transition-all duration-300 w-full",
        expanded ? "lg:w-[320px] xl:w-[360px]" : "lg:w-[72px]"
      )}
    >
      <button 
        onClick={toggleExpanded}
        className={cn(
          "w-full flex hover:bg-background transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          expanded 
            ? "flex-row items-center justify-between p-6" 
            : "flex-row lg:flex-col items-center justify-between lg:justify-center p-6 lg:px-0 lg:py-8 gap-2 lg:gap-8"
        )}
      >
        <div className={cn("flex items-center", expanded ? "flex-row gap-2" : "flex-row lg:flex-col gap-3 lg:gap-6")}>
          {(expanded || !expanded) && (
            <Trophy className={cn("text-[#FF6B00] shrink-0", expanded ? "w-5 h-5" : "w-6 h-6")} strokeWidth={2.5} />
          )}
          
          {expanded ? (
            <h2 className="font-heading text-xl font-bold text-foreground whitespace-nowrap">Top Grinders</h2>
          ) : (
            <>
              {/* Mobile Collapsed Text */}
              <h2 className="lg:hidden font-heading text-xl font-bold text-foreground whitespace-nowrap">Top Grinders</h2>
              {/* PC Collapsed Text (Stacked Upright) */}
              <span className="hidden lg:inline-block font-heading font-bold text-foreground tracking-[-0.1em] [writing-mode:vertical-rl] [text-orientation:upright] uppercase text-sm whitespace-nowrap leading-none">
                Top Grinders
              </span>
            </>
          )}
        </div>
        <div className="text-foreground transition-transform duration-200">
          {expanded ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
        </div>
      </button>

      <div 
        className={cn(
          "px-6 transition-all duration-200 ease-in-out",
          expanded ? "pb-6 pt-0 opacity-100" : "h-0 overflow-hidden opacity-0 pointer-events-none"
        )}
      >
        {leaderboard.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No tasks completed yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {leaderboard.map((entry, idx) => (
              <div key={entry.user_id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-lg text-foreground w-5 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="h-10 w-10 border-[1.5px] border-foreground shadow-[2px_2px_0px_black] rounded-full overflow-hidden bg-[#FFD600] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    {entry.profile_pic ? (
                      <img src={entry.profile_pic} alt={entry.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="font-bold text-foreground text-sm">
                        {entry.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-foreground truncate max-w-[120px]" title={entry.name}>
                    {entry.name}
                  </span>
                </div>
                <div className="bg-background border-[1.5px] border-foreground px-3 py-1 rounded-full shadow-[2px_2px_0px_black] shrink-0">
                  <span className="text-sm font-bold">{entry.tasks_completed}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
