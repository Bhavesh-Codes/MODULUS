import { NextResponse } from "next/server"
import { completeTask } from "@/actions/personal-tasks"

/**
 * POST /api/personal-tasks/complete
 *
 * Body: { taskId: string }
 *
 * Marks a personal task as done and, if it is a recurring task, spawns the
 * next occurrence. Authentication is handled inside the `completeTask` action
 * via the Supabase server client (reads the session cookie).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { taskId } = body

    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json(
        { error: "taskId is required and must be a string." },
        { status: 400 }
      )
    }

    const result = await completeTask(taskId)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"

    if (message === "Unauthorized. You must be signed in.") {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    if (message === "Task not found.") {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    console.error("POST /api/personal-tasks/complete error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
