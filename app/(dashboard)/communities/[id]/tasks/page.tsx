import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CommunityTasksList from "@/components/communities/CommunityTasksList"
import TaskLeaderboard from "@/components/communities/TaskLeaderboard"
import CreateTaskModal from "@/components/communities/CreateTaskModal"
import TasksPageRefresher from "@/components/communities/TasksPageRefresher"

export default async function CommunityTasksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // In Next.js 15+, params must be awaited
  const { id: communityId } = await params

  const supabase = await createClient()

  // 1. Get current logged-in user
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    redirect("/login")
  }

  // 2. Get user role in community
  const { data: memberData } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", authData.user.id)
    .single()

  const role = memberData?.role || "peer"
  const isModerator = role === "owner" || role === "curator"

  // 3. Get total community members for accurate progress percentages
  const { count } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId)
    .in("role", ["owner", "curator", "peer"])

  const memberCount = count || 1

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1280px] mx-auto px-4 md:px-8 pb-12">
      {/* Refreshes all server data on any click anywhere on the page */}
      <TasksPageRefresher />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <h1 className="font-heading text-4xl sm:text-[40px] font-extrabold text-[#0A0A0A]">
          Community Tasks
        </h1>

        {isModerator && (
          <CreateTaskModal communityId={communityId} />
        )}
      </div>

      {/* Main Flex Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start mt-4">
        {/* Left Column: Task Lists */}
        <div className="flex-1 flex flex-col gap-8 min-w-0 transition-all duration-300">
          <Suspense 
            fallback={
              <div className="animate-pulse h-[400px] bg-[#F5F5F0] rounded-[24px] border-2 border-[#0A0A0A] flex flex-col justify-center items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full border-2 border-black"></div>
                <div className="w-48 h-6 bg-white rounded-md border-2 border-black"></div>
              </div>
            }
          >
            <CommunityTasksList
              communityId={communityId}
              memberCount={memberCount}
              role={role}
            />
          </Suspense>
        </div>

        {/* Right Column: Leaderboard Sidebar */}
        <div className="w-full lg:w-auto shrink-0 min-w-0 transition-all duration-300">
          <Suspense 
            fallback={
              <div className="animate-pulse h-[300px] bg-[#F5F5F0] rounded-[24px] border-2 border-[#0A0A0A] p-6 flex flex-col gap-6 lg:w-[320px] xl:w-[360px]">
                <div className="w-32 h-6 bg-white rounded-md border border-black"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 items-center">
                      <div className="w-10 h-10 bg-white rounded-full border border-black shrink-0"></div>
                      <div className="h-4 bg-white rounded-md border border-black flex-1"></div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <TaskLeaderboard communityId={communityId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
