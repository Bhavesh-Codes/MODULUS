// ---------------------------------------------------------------------------
// personal-tasks.ts — TypeScript types for the personal task manager
// ---------------------------------------------------------------------------

export type PersonalTaskStatus = "todo" | "in_progress" | "done" | "archived"
export type PersonalTaskPriority = "high" | "medium" | "low"
export type PersonalTaskRecurrenceType = "daily" | "weekly" | "custom" | "weekdays"

// ---------------------------------------------------------------------------
// PersonalTaskCategory
// ---------------------------------------------------------------------------

export interface PersonalTaskCategory {
  id: string
  user_id: string
  name: string
  created_at: string
}

// ---------------------------------------------------------------------------
// PersonalSubtask
// ---------------------------------------------------------------------------

export interface PersonalSubtask {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// PersonalTask
// ---------------------------------------------------------------------------

export interface PersonalTask {
  id: string
  user_id: string
  title: string
  description: string | null
  status: PersonalTaskStatus
  priority: PersonalTaskPriority | null
  category_id: string | null
  /** ISO date string (YYYY-MM-DD) representing the task date */
  date: string | null
  /** ISO date string representing the deadline */
  deadline: string | null
  is_pinned: boolean
  is_recurring: boolean
  recurrence_type: PersonalTaskRecurrenceType | null
  /** Number of days between recurrences (used when recurrence_type is "custom") */
  recurrence_days: number | null
  /** Days of the week for "weekdays" recurrence: 0=Sun, 1=Mon ... 6=Sat */
  recurrence_weekdays: number[] | null
  /** ID of the original task this was spawned from (for recurring chains) */
  parent_recurring_task_id: string | null
  created_at: string
  completed_at: string | null
}

// ---------------------------------------------------------------------------
// PersonalTaskWithDetails — task joined with its category and subtasks
// ---------------------------------------------------------------------------

export interface PersonalTaskWithDetails extends PersonalTask {
  category: PersonalTaskCategory | null
  subtasks: PersonalSubtask[]
}
