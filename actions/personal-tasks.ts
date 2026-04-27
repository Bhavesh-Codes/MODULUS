"use server"


import { createClient } from "@/lib/supabase/server"
import type {
  PersonalTaskWithDetails,
  PersonalTaskCategory,
  PersonalTaskStatus,
  PersonalTaskPriority,
  PersonalTaskRecurrenceType,
} from "@/lib/types/personal-tasks"

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

/** Returns the authenticated user's ID or throws. */
async function requireAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: authData, error } = await supabase.auth.getUser()
  if (error || !authData.user) {
    throw new Error("Unauthorized. You must be signed in.")
  }
  return authData.user.id
}



// ---------------------------------------------------------------------------
// createTask
// ---------------------------------------------------------------------------

export interface CreateTaskOptions {
  date?: string | null
  deadline?: string | null
  priority?: PersonalTaskPriority | null
  category_id?: string | null
}

/**
 * Creates a new personal task with a title and optional metadata.
 * Status defaults to "todo".
 */
export async function createTask(title: string, opts: CreateTaskOptions = {}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  if (!title || title.trim().length === 0) {
    throw new Error("Task title cannot be empty.")
  }

  const { data, error } = await supabase
    .from("personal_tasks")
    .insert({
      user_id: userId,
      title: title.trim(),
      status: "todo" satisfies PersonalTaskStatus,
      ...(opts.date !== undefined && { date: opts.date }),
      ...(opts.deadline !== undefined && { deadline: opts.deadline }),
      ...(opts.priority !== undefined && { priority: opts.priority }),
      ...(opts.category_id !== undefined && { category_id: opts.category_id }),
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating personal task:", error)
    throw new Error("Failed to create task.")
  }


  return { success: true, id: data.id }
}

// ---------------------------------------------------------------------------
// updateTask
// ---------------------------------------------------------------------------

export interface UpdateTaskFields {
  title?: string
  description?: string | null
  status?: PersonalTaskStatus
  priority?: PersonalTaskPriority | null
  category_id?: string | null
  date?: string | null
  deadline?: string | null
  is_pinned?: boolean
  is_recurring?: boolean
  recurrence_type?: PersonalTaskRecurrenceType | null
  recurrence_days?: number | null
  recurrence_weekdays?: number[] | null
  completed_at?: string | null
}

/**
 * Updates any combination of fields on a personal task.
 * Scoped to the authenticated user so users can only edit their own tasks.
 */
export async function updateTask(taskId: string, fields: UpdateTaskFields) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from("personal_tasks")
    .update(fields)
    .eq("id", taskId)
    .eq("user_id", userId) // safety: scope to the owner

  if (error) {
    console.error("Error updating personal task:", error)
    throw new Error("Failed to update task.")
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteTask
// ---------------------------------------------------------------------------

/**
 * Hard-deletes a personal task (and cascades to subtasks if configured in DB).
 */
export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from("personal_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error deleting personal task:", error)
    throw new Error("Failed to delete task.")
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// archiveTask
// ---------------------------------------------------------------------------

/**
 * Sets the task status to "archived" and records completed_at = now.
 */
export async function archiveTask(taskId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from("personal_tasks")
    .update({
      status: "archived" satisfies PersonalTaskStatus,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error archiving personal task:", error)
    throw new Error("Failed to archive task.")
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// completeTask
// ---------------------------------------------------------------------------

/**
 * Marks a task as done and, if the task is recurring, spawns the next
 * occurrence by copying all relevant fields and advancing the date.
 *
 * Recurrence date logic:
 *  - "daily"  → add 1 day
 *  - "weekly" → add 7 days
 *  - "custom" → add `recurrence_days` days
 */
export async function completeTask(taskId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // 1. Fetch the task so we have all fields needed for potential recurrence
  const { data: task, error: fetchError } = await supabase
    .from("personal_tasks")
    .select(
      "id, user_id, title, description, priority, category_id, date, is_pinned, is_recurring, recurrence_type, recurrence_days"
    )
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  if (fetchError || !task) {
    console.error("Error fetching personal task for completion:", fetchError)
    throw new Error("Task not found.")
  }

  const now = new Date().toISOString()

  // 2. Mark the original task as done (or archive it immediately if it's recurring to prevent clutter)
  const newStatus = task.is_recurring ? ("archived" as PersonalTaskStatus) : ("done" as PersonalTaskStatus)

  const { error: updateError } = await supabase
    .from("personal_tasks")
    .update({
      status: newStatus,
      completed_at: now,
    })
    .eq("id", taskId)
    .eq("user_id", userId)

  if (updateError) {
    console.error("Error completing personal task:", updateError)
    throw new Error("Failed to complete task.")
  }

  // 3. If recurring, spawn the next occurrence
  if (task.is_recurring) {
    const nextDate = computeNextDate(task.date, task.recurrence_type, task.recurrence_days)

    const { error: insertError } = await supabase
      .from("personal_tasks")
      .insert({
        user_id: userId,
        title: task.title,
        description: task.description,
        status: "todo" satisfies PersonalTaskStatus,
        priority: task.priority,
        category_id: task.category_id,
        date: nextDate,
        is_pinned: task.is_pinned,
        is_recurring: task.is_recurring,
        recurrence_type: task.recurrence_type,
        recurrence_days: task.recurrence_days,
        parent_recurring_task_id: task.id,
      })

    if (insertError) {
      // Log but do not fail the completion — the original task is already done
      console.error("Error spawning next recurring task:", insertError)
    }
  }

  return { success: true }
}

/**
 * Computes the next occurrence date string (YYYY-MM-DD) by advancing the
 * given base date according to the recurrence type.
 */
function computeNextDate(
  baseDate: string | null,
  recurrenceType: string | null,
  recurrenceDays: number | null,
): string | null {
  if (!baseDate) return null

  const todayStr = new Date().toISOString().split("T")[0]
  const date = new Date(baseDate)

  // Loop until the next date is at least today
  while (true) {
    if (recurrenceType === "daily") {
      date.setUTCDate(date.getUTCDate() + 1)
    } else if (recurrenceType === "weekly") {
      date.setUTCDate(date.getUTCDate() + 7)
    } else if (recurrenceType === "custom" && recurrenceDays != null) {
      date.setUTCDate(date.getUTCDate() + recurrenceDays)
    } else {
      date.setUTCDate(date.getUTCDate() + 1)
    }

    const nextDateStr = date.toISOString().split("T")[0]
    if (nextDateStr >= todayStr) {
      return nextDateStr
    }
  }
}

// ---------------------------------------------------------------------------
// getTasks
// ---------------------------------------------------------------------------

/**
 * Fetches all non-archived personal tasks for the logged-in user,
 * joined with their category and subtasks.
 */
export async function getTasks(): Promise<PersonalTaskWithDetails[]> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { data, error } = await supabase
    .from("personal_tasks")
    .select(`
      *,
      category:personal_task_categories ( id, user_id, name, created_at ),
      subtasks:personal_subtasks ( id, task_id, title, is_completed, created_at )
    `)
    .eq("user_id", userId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching personal tasks:", error)
    throw new Error("Failed to fetch tasks.")
  }

  return (data ?? []).map(normalizeTask)
}

// ---------------------------------------------------------------------------
// getArchivedTasks
// ---------------------------------------------------------------------------

/**
 * Fetches all archived personal tasks for the logged-in user,
 * joined with their category and subtasks.
 */
export async function getArchivedTasks(): Promise<PersonalTaskWithDetails[]> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { data, error } = await supabase
    .from("personal_tasks")
    .select(`
      *,
      category:personal_task_categories ( id, user_id, name, created_at ),
      subtasks:personal_subtasks ( id, task_id, title, is_completed, created_at )
    `)
    .eq("user_id", userId)
    .eq("status", "archived")
    .order("completed_at", { ascending: false })

  if (error) {
    console.error("Error fetching archived personal tasks:", error)
    throw new Error("Failed to fetch archived tasks.")
  }

  return (data ?? []).map(normalizeTask)
}

/**
 * Normalises a raw Supabase row (where joined relations may be null or an
 * array) into the strongly-typed `PersonalTaskWithDetails` shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTask(row: any): PersonalTaskWithDetails {
  return {
    ...row,
    category: row.category ?? null,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
  }
}

// ---------------------------------------------------------------------------
// createCategory
// ---------------------------------------------------------------------------

/**
 * Inserts a new category for the user.
 * Silently ignores if a category with the same name already exists for this user.
 */
export async function createCategory(name: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  if (!name || name.trim().length === 0) {
    throw new Error("Category name cannot be empty.")
  }

  const { error } = await supabase
    .from("personal_task_categories")
    .insert({ user_id: userId, name: name.trim() })

  // Unique constraint violation (23505) means the category already exists — ignore it.
  if (error && error.code !== "23505") {
    console.error("Error creating personal task category:", error)
    throw new Error("Failed to create category.")
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// getCategories
// ---------------------------------------------------------------------------

/**
 * Fetches all categories for the logged-in user, ordered by name.
 */
export async function getCategories(): Promise<PersonalTaskCategory[]> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { data, error } = await supabase
    .from("personal_task_categories")
    .select("id, user_id, name, created_at")
    .eq("user_id", userId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching personal task categories:", error)
    throw new Error("Failed to fetch categories.")
  }

  return data ?? []
}

// ---------------------------------------------------------------------------
// createSubtask
// ---------------------------------------------------------------------------

/**
 * Inserts a new subtask under the given task.
 */
export async function createSubtask(taskId: string, title: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  if (!title || title.trim().length === 0) {
    throw new Error("Subtask title cannot be empty.")
  }

  // Verify the parent task belongs to the current user before inserting
  const { data: task, error: taskError } = await supabase
    .from("personal_tasks")
    .select("id")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  if (taskError || !task) {
    throw new Error("Task not found.")
  }

  const { data, error } = await supabase
    .from("personal_subtasks")
    .insert({ task_id: taskId, title: title.trim(), is_completed: false })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating subtask:", error)
    throw new Error("Failed to create subtask.")
  }

  return { success: true, id: data.id }
}

// ---------------------------------------------------------------------------
// updateSubtask
// ---------------------------------------------------------------------------

export interface UpdateSubtaskFields {
  title?: string
  is_completed?: boolean
}

/**
 * Updates is_completed and/or title on a subtask.
 * Scoped via a join to ensure the subtask belongs to the current user's task.
 */
export async function updateSubtask(subtaskId: string, fields: UpdateSubtaskFields) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Verify ownership by checking the parent task's user_id
  const { data: subtask, error: subtaskError } = await supabase
    .from("personal_subtasks")
    .select("id, personal_tasks!inner( user_id )")
    .eq("id", subtaskId)
    .eq("personal_tasks.user_id", userId)
    .single()

  if (subtaskError || !subtask) {
    throw new Error("Subtask not found.")
  }

  const { error } = await supabase
    .from("personal_subtasks")
    .update(fields)
    .eq("id", subtaskId)

  if (error) {
    console.error("Error updating subtask:", error)
    throw new Error("Failed to update subtask.")
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteSubtask
// ---------------------------------------------------------------------------

/**
 * Deletes a subtask, scoped to the current user via the parent task.
 */
export async function deleteSubtask(subtaskId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Verify ownership before deleting
  const { data: subtask, error: subtaskError } = await supabase
    .from("personal_subtasks")
    .select("id, personal_tasks!inner( user_id )")
    .eq("id", subtaskId)
    .eq("personal_tasks.user_id", userId)
    .single()

  if (subtaskError || !subtask) {
    throw new Error("Subtask not found.")
  }

  const { error } = await supabase
    .from("personal_subtasks")
    .delete()
    .eq("id", subtaskId)

  if (error) {
    console.error("Error deleting subtask:", error)
    throw new Error("Failed to delete subtask.")
  }

  return { success: true }
}
