"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Invisible component — drop it anywhere inside the tasks page.
 * It attaches a document-level click listener so that ANY interaction
 * on the page (sidebar toggle, leaderboard collapse, create task, checkbox, etc.)
 * triggers a silent router.refresh(), keeping all completion counts and the
 * leaderboard in sync without a hard reload or background polling.
 */
export default function TasksPageRefresher() {
  const router = useRouter()

  useEffect(() => {
    const handleClick = () => router.refresh()
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [router])

  return null
}
