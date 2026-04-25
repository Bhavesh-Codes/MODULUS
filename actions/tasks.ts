"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaskStatus = "pending" | "active" | "closed"

export interface CommunityTask {
  id: string
  community_id: string
  title: string
  status: TaskStatus
  created_by: string
  created_at: string
  due_date: string | null
  completion_count: number
  completed_by_me: boolean
}

export interface LeaderboardEntry {
  user_id: string
  name: string
  profile_pic: string | null
  tasks_completed: number
}

export interface DrilldownEntry {
  user_id: string
  name: string
  profile_pic: string | null
  role: string
  completed: boolean
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** Returns the authenticated user's ID or throws. */
async function requireAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: authData, error } = await supabase.auth.getUser()
  if (error || !authData.user) {
    throw new Error("Unauthorized. You must be signed in.")
  }
  return authData.user.id
}

/** Returns true if the user is an owner or curator of the community. */
async function isOwnerOrModerator(
  supabase: Awaited<ReturnType<typeof createClient>>,
  communityId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .single()

  return data?.role === "owner" || data?.role === "curator"
}

// ---------------------------------------------------------------------------
// createTask
// ---------------------------------------------------------------------------

/**
 * Creates a new task in the community.
 * Only owners and curators can call this action.
 *
 * @param communityId  - The community the task belongs to.
 * @param title        - The task title (required, non-empty).
 * @param status       - 'pending' (draft) or 'active' (published immediately).
 * @param dueDate      - Optional due date as a Date object.
 */
export async function createTask(
  communityId: string,
  title: string,
  status: "pending" | "active",
  dueDate?: Date,
) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const canCreate = await isOwnerOrModerator(supabase, communityId, userId)
  if (!canCreate) {
    throw new Error("Unauthorized. Only owners and curators can create tasks.")
  }

  if (!title || title.trim().length === 0) {
    throw new Error("Task title cannot be empty.")
  }

  const { error } = await supabase.from("tasks").insert({
    community_id: communityId,
    title: title.trim(),
    status,
    created_by: userId,
    due_date: dueDate ? dueDate.toISOString() : null,
  })

  if (error) {
    console.error("Error creating task:", error)
    throw new Error("Failed to create task.")
  }

  revalidatePath(`/communities/${communityId}/tasks`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// toggleTaskCompletion
// ---------------------------------------------------------------------------

/**
 * Toggles the current user's completion status for a task.
 *
 * - If a row already exists in `task_completions` → delete it (uncheck).
 * - If no row exists → insert one (check).
 *
 * The `communityId` is used only to revalidate the correct path.
 */
export async function toggleTaskCompletion(taskId: string, communityId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Check for an existing completion row
  const { data: existing, error: fetchError } = await supabase
    .from("task_completions")
    .select("task_id")
    .eq("task_id", taskId)
    .eq("user_id", userId)
    .maybeSingle()

  if (fetchError) {
    console.error("Error checking task completion:", fetchError)
    throw new Error("Failed to check task completion status.")
  }

  if (existing) {
    // Row exists → remove it (uncheck)
    const { error: deleteError } = await supabase
      .from("task_completions")
      .delete()
      .eq("task_id", taskId)
      .eq("user_id", userId)

    if (deleteError) {
      console.error("Error removing task completion:", deleteError)
      throw new Error("Failed to uncheck task.")
    }

    revalidatePath(`/communities/${communityId}`)
    return { completed: false }
  } else {
    // No row → insert one (check)
    const { error: insertError } = await supabase
      .from("task_completions")
      .insert({
        task_id: taskId,
        user_id: userId,
        completed_at: new Date().toISOString(),
        show_in_drilldown: true, // default opt-in
      })

    if (insertError) {
      console.error("Error inserting task completion:", insertError)
      throw new Error("Failed to mark task as complete.")
    }

    revalidatePath(`/communities/${communityId}`)
    return { completed: true }
  }
}

// ---------------------------------------------------------------------------
// updateTaskStatus
// ---------------------------------------------------------------------------

/**
 * Allows an owner or curator to change a task's status.
 *
 * Valid transitions include: pending → active, active → closed, etc.
 * The server does not enforce a specific state machine — callers should
 * present only valid transitions in the UI.
 */
export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  communityId: string,
) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const canModerate = await isOwnerOrModerator(supabase, communityId, userId)
  if (!canModerate) {
    throw new Error("Unauthorized. Only owners and curators can change task status.")
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", taskId)
    .eq("community_id", communityId) // extra safety — scope to the community

  if (error) {
    console.error("Error updating task status:", error)
    throw new Error("Failed to update task status.")
  }

  revalidatePath(`/communities/${communityId}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// getCommunityTasks
// ---------------------------------------------------------------------------

/**
 * Fetches all tasks for the community.
 *
 * For each task:
 * - `completion_count` → total number of rows in `task_completions`
 * - `completed_by_me` → whether the current logged-in user has a completion row
 */
export async function getCommunityTasks(communityId: string): Promise<CommunityTask[]> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // 1. Fetch all tasks for this community
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, community_id, title, status, created_by, created_at, due_date")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })

  if (tasksError) {
    console.error("Error fetching community tasks:", tasksError)
    throw new Error("Failed to fetch community tasks.")
  }

  if (!tasks || tasks.length === 0) return []

  const taskIds = tasks.map((t) => t.id)

  // 2. Fetch all completion rows for these tasks in a single query
  const { data: completions, error: completionsError } = await supabase
    .from("task_completions")
    .select("task_id, user_id")
    .in("task_id", taskIds)

  if (completionsError) {
    console.error("Error fetching task completions:", completionsError)
    throw new Error("Failed to fetch task completions.")
  }

  // 3. Build lookup maps from the flat completions array
  const countByTask: Record<string, number> = {}
  const completedByMe = new Set<string>()

  for (const row of completions ?? []) {
    countByTask[row.task_id] = (countByTask[row.task_id] ?? 0) + 1
    if (row.user_id === userId) {
      completedByMe.add(row.task_id)
    }
  }

  // 4. Merge and return
  return tasks.map((task) => ({
    ...task,
    completion_count: countByTask[task.id] ?? 0,
    completed_by_me: completedByMe.has(task.id),
  }))
}

// ---------------------------------------------------------------------------
// getCommunityLeaderboard
// ---------------------------------------------------------------------------

/**
 * Returns the top 5 users with the most completed tasks in this community,
 * sorted descending by tasks completed.
 *
 * Joins `task_completions` with `tasks` (to scope by community) and then
 * with `users` to pull name and profile_pic.
 */
export async function getCommunityLeaderboard(
  communityId: string,
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()
  await requireAuth(supabase)

  // 1. Fetch all tasks for this community
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id")
    .eq("community_id", communityId)

  if (tasksError) {
    console.error("Error fetching tasks for leaderboard:", tasksError)
    throw new Error("Failed to fetch community tasks.")
  }

  if (!tasks || tasks.length === 0) return []

  const taskIds = tasks.map(t => t.id)

  // 2. Fetch completions for these tasks
  const { data: completions, error: completionsError } = await supabase
    .from("task_completions")
    .select("user_id")
    .in("task_id", taskIds)

  if (completionsError) {
    console.error("Error fetching completions for leaderboard:", completionsError)
    throw new Error("Failed to fetch task completions.")
  }

  if (!completions || completions.length === 0) return []

  // 3. Aggregate counts per user
  const countMap: Record<string, number> = {}
  for (const row of completions) {
    countMap[row.user_id] = (countMap[row.user_id] || 0) + 1
  }

  const userIds = Object.keys(countMap)

  // 4. Fetch user details
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, profile_pic")
    .in("id", userIds)

  if (usersError) {
    console.error("Error fetching users for leaderboard:", usersError)
    throw new Error("Failed to fetch users.")
  }

  // 5. Merge and sort
  const userMap: Record<string, { name: string; profile_pic: string | null }> = {}
  for (const user of users || []) {
    userMap[user.id] = { name: user.name, profile_pic: user.profile_pic }
  }

  const sorted = Object.entries(countMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return sorted.map(([userId, count]) => ({
    user_id: userId,
    name: userMap[userId]?.name || "Unknown",
    profile_pic: userMap[userId]?.profile_pic || null,
    tasks_completed: count,
  }))
}

// ---------------------------------------------------------------------------
// getTaskDrilldown
// ---------------------------------------------------------------------------

/**
 * Fetches all community members and returns a boolean for each indicating
 * whether they appear in `task_completions` for this specific task.
 *
 * Members who have opted out (`show_in_drilldown = false`) are still returned
 * but the `completed` flag will be `false` so they remain anonymous to peers.
 * Owners and curators receive the unfiltered truth.
 */
export async function getTaskDrilldown(
  taskId: string,
  communityId: string,
): Promise<DrilldownEntry[]> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const canModerate = await isOwnerOrModerator(supabase, communityId, userId)

  // 1. Get all members of the community with their user info
  const { data: members, error: membersError } = await supabase
    .from("community_members")
    .select(`
      user_id,
      role,
      users:user_id ( name, profile_pic )
    `)
    .eq("community_id", communityId)

  if (membersError) {
    console.error("Error fetching members for drilldown:", membersError)
    throw new Error("Failed to fetch community members.")
  }

  // 2. Get all completions for this specific task
  //    Include show_in_drilldown so we can respect privacy preferences
  const { data: completions, error: completionsError } = await supabase
    .from("task_completions")
    .select("user_id, show_in_drilldown")
    .eq("task_id", taskId)

  if (completionsError) {
    console.error("Error fetching completions for drilldown:", completionsError)
    throw new Error("Failed to fetch task completions.")
  }

  // Build a map: userId → show_in_drilldown
  const completionMap: Record<string, boolean> = {}
  for (const row of completions ?? []) {
    completionMap[row.user_id] = row.show_in_drilldown
  }

  // 3. Merge — respect privacy opt-out for non-moderators
  return (members ?? []).map((member) => {
    const userInfo = member.users as unknown as { name: string; profile_pic: string | null } | null
    const hasCompleted = member.user_id in completionMap
    const showsInDrilldown = completionMap[member.user_id] ?? false

    // Moderators see real data; peers only see completion if user opted in
    const completed = hasCompleted && (canModerate || showsInDrilldown)

    return {
      user_id: member.user_id,
      name: userInfo?.name ?? "Unknown",
      profile_pic: userInfo?.profile_pic ?? null,
      role: member.role,
      completed,
    }
  })
}
