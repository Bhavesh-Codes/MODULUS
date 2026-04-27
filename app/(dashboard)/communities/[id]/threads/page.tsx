"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
    MessageSquareDashed, PlusCircle, Loader2, ChevronRight,
    ThumbsUp, ThumbsDown, Lock, MessageSquare, Image as ImageIcon,
    HelpCircle, AlignLeft,
} from "lucide-react"
import { ThreadImage } from "@/components/thread-image"

const POST_TYPE_META: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
    text: { label: "TEXT", color: "bg-muted text-foreground", Icon: AlignLeft },
    question: { label: "QUESTION", color: "bg-[#0057FF] text-white", Icon: HelpCircle },
    image: { label: "IMAGE", color: "bg-[#FF3CAC] text-white", Icon: ImageIcon },
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

export default function ThreadsPage() {
    const params = useParams()
    const communityId = params.id as string

    const { data: threads, isLoading } = useQuery({
        queryKey: ["threads", communityId],
        queryFn: async () => {
            const res = await fetch(`/api/communities/${communityId}/threads`)
            if (!res.ok) throw new Error("Failed to fetch threads")
            return res.json()
        },
    })

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-10 h-10 animate-spin text-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[#FFD600] border-[2px] border-foreground shadow-[3px_3px_0_black] flex items-center justify-center">
                        <MessageSquareDashed className="w-5 h-5 text-foreground" strokeWidth={2.5} />
                    </div>
                    <h2 className="font-heading font-extrabold text-[22px] text-foreground">Threads</h2>
                    {threads && (
                        <span className="font-mono text-[13px] text-muted-foreground bg-muted border-[2px] border-foreground px-2 py-0.5 rounded-full">
                            {threads.length}
                        </span>
                    )}
                </div>

                <Link
                    href={`/communities/${communityId}/threads/new`}
                    className="flex items-center gap-2 px-4 py-2 rounded-[0.875rem] border-[2px] border-foreground bg-[#FFD600] shadow-[4px_4px_0px_black] font-heading font-bold text-[14px] text-foreground hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                >
                    <PlusCircle className="w-4 h-4" />
                    New Thread
                </Link>
            </div>

            {/* Thread list */}
            {!threads || threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-20 h-20 rounded-[20px] bg-muted border-[3px] border-foreground shadow-[4px_4px_0_black] flex items-center justify-center">
                        <MessageSquareDashed className="w-10 h-10 text-foreground opacity-40" />
                    </div>
                    <p className="font-heading font-bold text-[18px] text-muted-foreground">No threads yet</p>
                    <p className="font-sans text-[14px] text-muted-foreground/70">Start the conversation — post the first thread!</p>
                    <Link
                        href={`/communities/${communityId}/threads/new`}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-[0.875rem] border-[2px] border-foreground bg-[#FFD600] shadow-[4px_4px_0px_black] font-heading font-bold text-[14px] text-foreground hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all mt-2"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Post a Thread
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {threads.map((thread: any) => {
                        const meta = POST_TYPE_META[thread.post_type] ?? POST_TYPE_META.text
                        const Icon = meta.Icon
                        return (
                            <Link
                                key={thread.id}
                                href={`/communities/${communityId}/threads/${thread.id}`}
                                className="group block bg-card border-[2px] border-foreground rounded-[1.25rem] shadow-[4px_4px_0_black] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all p-5"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Vote count column */}
                                    <div className="flex flex-col items-stretch gap-1 shrink-0 pt-0.5 font-mono text-[12px] font-bold">
                                        <span className="inline-flex items-center justify-center gap-1 rounded-[7px] border-[1.5px] border-foreground bg-card px-2 py-1 text-[#00C853]">
                                            <ThumbsUp className="w-3.5 h-3.5" />
                                            {thread.vote_up_count ?? 0}
                                        </span>
                                        <span className="inline-flex items-center justify-center gap-1 rounded-[7px] border-[1.5px] border-foreground bg-card px-2 py-1 text-[#FF3B30]">
                                            <ThumbsDown className="w-3.5 h-3.5" />
                                            {thread.vote_down_count ?? 0}
                                        </span>
                                    </div>

                                    {/* Main content */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        {/* Top row: badges */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {thread.post_type !== 'image' && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] border-[1.5px] border-foreground font-mono text-[11px] font-bold tracking-wide ${meta.color}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {meta.label}
                                                </span>
                                            )}
                                            {thread.is_locked && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] border-[1.5px] border-foreground bg-[#FF6B00] text-white font-mono text-[11px] font-bold">
                                                    <Lock className="w-3 h-3" />
                                                    CLOSED
                                                </span>
                                            )}
                                            {thread.solution_reply_id && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] border-[1.5px] border-foreground bg-[#00C853] text-white font-mono text-[11px] font-bold">
                                                    ✓ SOLVED
                                                </span>
                                            )}
                                        </div>

                                        {/* Content preview */}
                                        <p className="font-sans text-[15px] text-foreground leading-snug line-clamp-2">
                                            {thread.content || ""}
                                        </p>

                                        {/* Image thumbnail */}
                                        {(thread as any).image_file_id && (
                                            <div className="mt-2 rounded-[0.75rem] border-[2px] border-foreground overflow-hidden max-w-[240px]">
                                                <ThreadImage
                                                    fileId={(thread as any).image_file_id}
                                                    className="w-full max-h-28 object-cover object-center"
                                                />
                                            </div>
                                        )}

                                        {/* Meta row */}
                                        <div className="flex items-center gap-3 font-mono text-[12px] text-muted-foreground">
                                            <span className="font-semibold text-foreground">{thread.author?.name ?? "Unknown"}</span>
                                            <span>·</span>
                                            <span>{timeAgo(thread.created_at)}</span>
                                            <span>·</span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                {thread.reply_count}
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
