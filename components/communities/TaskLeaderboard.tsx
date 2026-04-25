import { getCommunityLeaderboard } from "@/actions/tasks"
import TaskLeaderboardClient from "./TaskLeaderboardClient"

export default async function TaskLeaderboard({ communityId }: { communityId: string }) {
  const leaderboard = await getCommunityLeaderboard(communityId)

  return <TaskLeaderboardClient leaderboard={leaderboard} />
}
