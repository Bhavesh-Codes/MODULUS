"use client"

import { useEffect, useState } from "react"

export function ThreadImage({ fileId, className }: { fileId: string; className?: string }) {
    const [url, setUrl] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        fetch(`/api/files/${fileId}/signed-url`)
            .then(r => r.ok ? r.json() : null)
            .then(json => { if (!cancelled && json?.url) setUrl(json.url) })
            .catch(() => { })
        return () => { cancelled = true }
    }, [fileId])

    if (!url) return null
    return (
        <img
            src={url}
            alt="Thread image"
            className={className ?? "w-full object-contain bg-[#F5F5F0]"}
        />
    )
}
