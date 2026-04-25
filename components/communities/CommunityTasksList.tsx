import { Sparkles } from "lucide-react"
import { getCommunityTasks } from "@/actions/tasks"
import TasksListClient from "./TasksListClient"

export default async function CommunityTasksList({
  communityId,
  memberCount,
  role
}: {
  communityId: string
  memberCount: number
  role: string
}) {
  const allTasks = await getCommunityTasks(communityId)

  // Peers only see active tasks. Owners/Curators see everything.
  const isModerator = role === "owner" || role === "curator"
  
  const activeTasks = allTasks.filter(t => t.status === "active")
  const pendingTasks = allTasks.filter(t => t.status === "pending")
  const closedTasks = allTasks.filter(t => t.status === "closed")

  return (
    <div className="flex flex-col gap-8 w-full">
      {isModerator && pendingTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-heading text-[22px] font-bold text-[#0A0A0A]">Pending Suggestions</h2>
            <span className="bg-[#FFD600] text-[#0A0A0A] text-xs font-bold px-2 py-0.5 rounded-full border-[1.5px] border-black shadow-[2px_2px_0px_#0A0A0A]">{pendingTasks.length}</span>
          </div>
          <TasksListClient tasks={pendingTasks} communityId={communityId} memberCount={memberCount} isModerator={isModerator} />
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-heading text-[28px] font-bold text-[#0A0A0A]">Active Tasks</h2>
        </div>
        {activeTasks.length > 0 ? (
          <TasksListClient tasks={activeTasks} communityId={communityId} memberCount={memberCount} isModerator={isModerator} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center border-2 border-[#0A0A0A] rounded-[24px] shadow-[4px_4px_0px_#0A0A0A] bg-[#F5F5F0]">
            <div className="w-16 h-16 bg-[#FFD600] border-2 border-[#0A0A0A] rounded-full flex items-center justify-center shadow-[4px_4px_0px_#0A0A0A] mb-6">
              <Sparkles className="w-7 h-7 text-[#0A0A0A]" strokeWidth={2} />
            </div>
            <h3 className="font-heading text-[22px] font-bold text-[#0A0A0A] mb-2">You're all caught up!</h3>
            <p className="text-[#555550] text-[16px] max-w-md leading-relaxed">
              There are no active tasks in this community right now. Take a break or start a focus session.
            </p>
          </div>
        )}
      </section>

      {isModerator && closedTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-heading text-[22px] font-bold text-[#0A0A0A]">Closed Tasks</h2>
          </div>
          <div className="opacity-70 grayscale-[50%] transition-all duration-200 hover:grayscale-0 hover:opacity-100">
            <TasksListClient tasks={closedTasks} communityId={communityId} memberCount={memberCount} isModerator={isModerator} />
          </div>
        </section>
      )}
    </div>
  )
}
