"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import {
    Loader2, ArrowLeft, ThumbsUp, ThumbsDown, Lock, Unlock,
    Trash2, MessageSquare, HelpCircle, AlignLeft, Image as ImageIcon,
    CheckCircle2, ChevronDown, ChevronRight, Send, X,
} from "lucide-react"

import { ThreadImage } from "@/components/thread-image"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Author { id: string; name: string; profile_pic: string | null }

interface Reply {
    id: string
    parent_reply_id: string | null
    content: string
    created_at: string
    author: Author
    vote_score: number
    vote_up_count: number
    vote_down_count: number
    my_vote: number
    children: Reply[]
}

interface Thread {
    id: string
    content: string
    post_type: "text" | "question" | "image"
    is_locked: boolean
    solution_reply_id: string | null
    created_at: string
    author: Author
    vote_score: number
    vote_up_count: number
    vote_down_count: number
    my_vote: number
    replies: Reply[]
    current_user_id: string
    image_url?: string | null
    image_file_id?: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function Avatar({ user }: { user: Author }) {
    return user.profile_pic ? (
        <img
            src={user.profile_pic}
            alt={user.name}
            className="w-8 h-8 rounded-full border-[2px] border-foreground object-cover shrink-0"
        />
    ) : (
        <div className="w-8 h-8 rounded-full border-[2px] border-foreground bg-[#FFD600] flex items-center justify-center shrink-0 font-heading font-bold text-[13px] text-foreground">
            {user.name?.[0]?.toUpperCase() ?? "?"}
        </div>
    )
}

// ─── Vote Widget ──────────────────────────────────────────────────────────────

function VoteWidget({
    score,
    upCount,
    downCount,
    myVote,
    onVote,
}: {
    score: number
    upCount: number
    downCount: number
    myVote: number
    onVote: (value: 1 | -1) => void
}) {
    return (
        <div className="flex items-center gap-1.5">
            <button
                onClick={() => onVote(1)}
                className={`flex items-center justify-center w-7 h-7 rounded-[6px] border-[2px] border-foreground transition-all hover:translate-x-[2px] hover:translate-y-[2px] ${myVote === 1
                    ? "bg-[#00C853] shadow-none translate-x-[2px] translate-y-[2px]"
                    : "bg-card shadow-[2px_2px_0_black] hover:shadow-none"
                    }`}
            >
                <ThumbsUp className="w-3.5 h-3.5 text-foreground" />
            </button>

            <span
                className="font-mono font-bold text-[12px] min-w-6 text-center text-[#00C853]"
            >
                {upCount}
            </span>

            <button
                onClick={() => onVote(-1)}
                className={`flex items-center justify-center w-7 h-7 rounded-[6px] border-[2px] border-foreground transition-all hover:translate-x-[2px] hover:translate-y-[2px] ${myVote === -1
                    ? "bg-[#FF3B30] shadow-none translate-x-[2px] translate-y-[2px]"
                    : "bg-card shadow-[2px_2px_0_black] hover:shadow-none"
                    }`}
            >
                <ThumbsDown className="w-3.5 h-3.5 text-foreground" />
            </button>

            <span
                className="font-mono font-bold text-[12px] min-w-6 text-center text-[#FF3B30]"
                title={`Net score ${score > 0 ? `+${score}` : score}`}
            >
                {downCount}
            </span>
        </div>
    )
}

// ─── Reply Composer ───────────────────────────────────────────────────────────

function ReplyComposer({
    threadId,
    communityId,
    parentReplyId = null,
    placeholder = "Write a reply...",
    onSuccess,
    onCancel,
}: {
    threadId: string
    communityId: string
    parentReplyId?: string | null
    placeholder?: string
    onSuccess: (reply: Reply) => void
    onCancel?: () => void
}) {
    const [content, setContent] = useState("")

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/communities/${communityId}/threads/${threadId}/replies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: content.trim(), parent_reply_id: parentReplyId }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to post reply")
            }
            return res.json()
        },
        onSuccess: (reply) => {
            setContent("")
            onSuccess(reply)
            toast.success("Reply posted!")
        },
        onError: (err: any) => toast.error(err.message),
    })

    return (
        <div className="flex gap-3 items-start">
            <div className="flex-1 space-y-2">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full px-4 py-3 rounded-[1rem] border-[2px] border-foreground bg-background font-sans text-[14px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[#FFD600] resize-none"
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending || !content.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border-[2px] border-foreground bg-[#FFD600] shadow-[3px_3px_0_black] font-heading font-bold text-[13px] text-foreground hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Reply
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border-[2px] border-foreground bg-card shadow-[3px_3px_0_black] font-heading font-bold text-[13px] text-foreground hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                        >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Single Reply Card ────────────────────────────────────────────────────────

function ReplyCard({
    reply,
    depth,
    threadId,
    communityId,
    isSolution,
    isThreadAuthor,
    currentUserId,
    onMarkSolution,
    onDeleteReply,
    onVote,
    onNewReply,
}: {
    reply: Reply
    depth: number
    threadId: string
    communityId: string
    isSolution: boolean
    isThreadAuthor: boolean
    currentUserId: string
    onMarkSolution: (replyId: string | null) => void
    onDeleteReply: (replyId: string) => void
    onVote: (targetType: "reply", targetId: string, value: 1 | -1) => void
    onNewReply: (reply: Reply) => void
}) {
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const isAuthor = reply.author.id === currentUserId
    const indentColor = ["#FFD600", "#0057FF", "#FF3CAC", "#00C853", "#FF6B00"][depth % 5]

    return (
        <div className={`flex gap-3 ${depth > 0 ? "ml-8 mt-3" : "mt-4"}`}>
            {/* Left colored depth bar */}
            {depth > 0 && (
                <div
                    className="w-[3px] rounded-full shrink-0 mt-1"
                    style={{ background: indentColor, minHeight: 32 }}
                />
            )}

            <div className="flex-1 min-w-0">
                {/* Solution highlight banner */}
                {isSolution && (
                    <div className="flex items-center gap-1.5 mb-2 px-3 py-1 rounded-[8px] bg-[#00C853] border-[2px] border-foreground shadow-[2px_2px_0_black] w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span className="font-mono font-bold text-[11px] text-white tracking-wide">SOLUTION</span>
                    </div>
                )}

                {/* Card */}
                <div
                    className={`bg-card border-[2px] border-foreground rounded-[1rem] p-4 space-y-3 ${isSolution ? "ring-2 ring-[#00C853] ring-offset-1" : ""
                        }`}
                >
                    {/* Author row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Avatar user={reply.author} />
                            <span className="font-heading font-bold text-[14px] text-foreground">{reply.author.name}</span>
                            <span className="font-mono text-[12px] text-muted-foreground/70">{timeAgo(reply.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <VoteWidget
                                score={reply.vote_score}
                                upCount={reply.vote_up_count}
                                downCount={reply.vote_down_count}
                                myVote={reply.my_vote}
                                onVote={(val) => onVote("reply", reply.id, val)}
                            />
                            {isThreadAuthor && (
                                <button
                                    onClick={() => onMarkSolution(isSolution ? null : reply.id)}
                                    title={isSolution ? "Unmark solution" : "Mark as solution"}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border-[2px] border-foreground font-heading font-bold text-[11px] transition-all hover:translate-x-[2px] hover:translate-y-[2px] ${isSolution
                                        ? "bg-[#00C853] text-white shadow-none translate-x-[2px] translate-y-[2px]"
                                        : "bg-card text-foreground shadow-[2px_2px_0_black] hover:shadow-none"
                                        }`}
                                >
                                    <CheckCircle2 className="w-3 h-3" />
                                    {isSolution ? "Unmark" : "Solution"}
                                </button>
                            )}
                            {isAuthor && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("Delete this reply?")) onDeleteReply(reply.id)
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-[6px] border-[2px] border-foreground bg-card shadow-[2px_2px_0_black] font-heading font-bold text-[11px] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <p className="font-sans text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{reply.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowReplyForm((v) => !v)}
                            className="flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {showReplyForm ? "Cancel" : "Reply"}
                        </button>
                        {reply.children.length > 0 && (
                            <button
                                onClick={() => setCollapsed((v) => !v)}
                                className="flex items-center gap-1 font-mono text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {collapsed ? `Show ${reply.children.length} repl${reply.children.length === 1 ? "y" : "ies"}` : "Collapse"}
                            </button>
                        )}
                    </div>

                    {showReplyForm && (
                        <ReplyComposer
                            threadId={threadId}
                            communityId={communityId}
                            parentReplyId={reply.id}
                            placeholder="Reply to this comment..."
                            onSuccess={(r) => { setShowReplyForm(false); onNewReply(r) }}
                            onCancel={() => setShowReplyForm(false)}
                        />
                    )}
                </div>

                {/* Children */}
                {!collapsed && reply.children.map((child) => (
                    <ReplyCard
                        key={child.id}
                        reply={child}
                        depth={depth + 1}
                        threadId={threadId}
                        communityId={communityId}
                        isSolution={false} // solution only shown at top level match
                        isThreadAuthor={isThreadAuthor}
                        currentUserId={currentUserId}
                        onMarkSolution={onMarkSolution}
                        onDeleteReply={onDeleteReply}
                        onVote={onVote}
                        onNewReply={onNewReply}
                    />
                ))}
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ThreadDetailPage() {
    const params = useParams()
    const communityId = params.id as string
    const threadId = params.threadId as string
    const router = useRouter()
    const queryClient = useQueryClient()

    const { data: thread, isLoading } = useQuery<Thread>({
        queryKey: ["thread", threadId],
        queryFn: async () => {
            const res = await fetch(`/api/communities/${communityId}/threads/${threadId}`)
            if (!res.ok) throw new Error("Failed to fetch thread")
            return res.json()
        },
    })

    // ── Mutations ──────────────────────────────────────────────────────────────

    const voteMutation = useMutation({
        mutationFn: async ({ targetType, targetId, value }: { targetType: string; targetId: string; value: 1 | -1 }) => {
            const res = await fetch("/api/votes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target_type: targetType, target_id: targetId, value }),
            })
            if (!res.ok) throw new Error("Vote failed")
            return res.json()
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["thread", threadId] }),
        onError: (err: any) => toast.error(err.message),
    })

    const lockMutation = useMutation({
        mutationFn: async (is_locked: boolean) => {
            const res = await fetch(`/api/communities/${communityId}/threads/${threadId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_locked }),
            })
            if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["thread", threadId] })
            queryClient.invalidateQueries({ queryKey: ["threads", communityId] })
            toast.success(thread?.is_locked ? "Thread unlocked" : "Thread locked")
        },
        onError: (err: any) => toast.error(err.message),
    })

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/communities/${communityId}/threads/${threadId}`, { method: "DELETE" })
            if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["threads", communityId] })
            toast.success("Thread deleted")
            router.push(`/communities/${communityId}/threads`)
        },
        onError: (err: any) => toast.error(err.message),
    })

    const solutionMutation = useMutation({
        mutationFn: async (replyId: string | null) => {
            const res = await fetch(`/api/communities/${communityId}/threads/${threadId}/solution`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reply_id: replyId }),
            })
            if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["thread", threadId] })
            queryClient.invalidateQueries({ queryKey: ["threads", communityId] })
            toast.success("Solution updated")
        },
        onError: (err: any) => toast.error(err.message),
    })

    const deleteReplyMutation = useMutation({
        mutationFn: async (replyId: string) => {
            const res = await fetch(`/api/communities/${communityId}/threads/${threadId}/replies/${replyId}`, {
                method: "DELETE",
            })
            if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["thread", threadId] })
            toast.success("Reply deleted")
        },
        onError: (err: any) => toast.error(err.message),
    })

    // ── Optimistic new reply ───────────────────────────────────────────────────

    function handleNewReply(reply: Reply) {
        queryClient.invalidateQueries({ queryKey: ["thread", threadId] })
        queryClient.invalidateQueries({ queryKey: ["threads", communityId] })
    }

    // ── Loading / Error ────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-10 h-10 animate-spin text-foreground" />
            </div>
        )
    }

    if (!thread) {
        return (
            <div className="text-center py-20">
                <p className="font-heading font-bold text-[18px] text-muted-foreground">Thread not found.</p>
                <Link href={`/communities/${communityId}/threads`} className="mt-4 inline-flex items-center gap-2 font-heading font-bold text-[14px] text-foreground underline">
                    ← Back to threads
                </Link>
            </div>
        )
    }

    const meta = POST_TYPE_META[thread.post_type] ?? POST_TYPE_META.text
    const TypeIcon = meta.Icon
    const isThreadAuthor = thread.author.id === thread.current_user_id
    const canManage = isThreadAuthor

    function countReplies(replies: Reply[]): number {
        return replies.reduce((s, r) => s + 1 + countReplies(r.children), 0)
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back */}
            <Link
                href={`/communities/${communityId}/threads`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] border-[2px] border-foreground bg-card shadow-[3px_3px_0_black] font-heading font-bold text-[13px] text-foreground hover:bg-background hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
            >
                <ArrowLeft className="w-4 h-4" />
                All Threads
            </Link>

            {/* Thread card */}
            <div className="bg-card border-[3px] border-foreground rounded-[1.5rem] shadow-[6px_6px_0_black] overflow-hidden">
                {/* Top accent bar */}
                <div className={`h-2 ${meta.color.includes("bg-[#0057FF]") ? "bg-[#0057FF]" : meta.color.includes("bg-[#FF3CAC]") ? "bg-[#FF3CAC]" : "bg-[#FFD600]"}`} />

                <div className="p-6 space-y-5">
                    {/* Badges + actions row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                            {thread.post_type !== 'image' && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] border-[2px] border-foreground font-mono text-[12px] font-bold shadow-[2px_2px_0_black] ${meta.color}`}>
                                    <TypeIcon className="w-3.5 h-3.5" />
                                    {meta.label}
                                </span>
                            )}
                            {thread.is_locked && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] border-[2px] border-foreground bg-[#FF6B00] text-white font-mono text-[12px] font-bold shadow-[2px_2px_0_black]">
                                    <Lock className="w-3.5 h-3.5" />
                                    CLOSED
                                </span>
                            )}
                            {thread.solution_reply_id && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] border-[2px] border-foreground bg-[#00C853] text-white font-mono text-[12px] font-bold shadow-[2px_2px_0_black]">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    SOLVED
                                </span>
                            )}
                        </div>

                        {/* Author management actions */}
                        {canManage && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => lockMutation.mutate(!thread.is_locked)}
                                    disabled={lockMutation.isPending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border-[2px] border-foreground bg-card shadow-[3px_3px_0_black] font-heading font-bold text-[12px] text-foreground hover:bg-[#FFD600] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all disabled:opacity-50"
                                >
                                    {lockMutation.isPending ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : thread.is_locked ? (
                                        <Unlock className="w-3.5 h-3.5" />
                                    ) : (
                                        <Lock className="w-3.5 h-3.5" />
                                    )}
                                    {thread.is_locked ? "Unlock" : "Lock"}
                                </button>

                                <button
                                    onClick={() => {
                                        if (window.confirm("Permanently delete this thread and all its replies?")) {
                                            deleteMutation.mutate()
                                        }
                                    }}
                                    disabled={deleteMutation.isPending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border-[2px] border-foreground bg-card shadow-[3px_3px_0_black] font-heading font-bold text-[12px] text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all disabled:opacity-50"
                                >
                                    {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-3">
                        <Avatar user={thread.author} />
                        <div>
                            <span className="font-heading font-bold text-[15px] text-foreground">{thread.author.name}</span>
                            <p className="font-mono text-[12px] text-muted-foreground/70">{timeAgo(thread.created_at)}</p>
                        </div>
                    </div>

                    {/* Image */}
                    {thread.image_file_id && (
                        <div className="rounded-[1rem] border-[2px] border-foreground overflow-hidden">
                            <ThreadImage
                                fileId={thread.image_file_id}
                                className="w-full max-h-96 object-contain bg-background"
                            />
                        </div>
                    )}

                    {/* Content */}
                    {thread.content && (
                        <p className="font-sans text-[16px] text-foreground leading-relaxed whitespace-pre-wrap">{thread.content}</p>
                    )}

                    {/* Vote widget */}
                    <div className="flex items-center gap-4 pt-2 border-t-[2px] border-border">
                        <VoteWidget
                            score={thread.vote_score}
                            upCount={thread.vote_up_count}
                            downCount={thread.vote_down_count}
                            myVote={thread.my_vote}
                            onVote={(val) => voteMutation.mutate({ targetType: "thread", targetId: thread.id, value: val })}
                        />
                        <span className="font-mono text-[13px] text-muted-foreground flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4" />
                            {countReplies(thread.replies)} repl{countReplies(thread.replies) === 1 ? "y" : "ies"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Replies section ── */}
            <div className="space-y-2">
                <h3 className="font-heading font-extrabold text-[18px] text-foreground">
                    Discussion
                </h3>

                {thread.replies.map((reply) => (
                    <ReplyCard
                        key={reply.id}
                        reply={reply}
                        depth={0}
                        threadId={thread.id}
                        communityId={communityId}
                        isSolution={reply.id === thread.solution_reply_id}
                        isThreadAuthor={isThreadAuthor}
                        currentUserId={thread.current_user_id}
                        onMarkSolution={(id) => solutionMutation.mutate(id)}
                        onDeleteReply={(id) => deleteReplyMutation.mutate(id)}
                        onVote={(type, id, val) => voteMutation.mutate({ targetType: type, targetId: id, value: val })}
                        onNewReply={handleNewReply}
                    />
                ))}

                {thread.replies.length === 0 && (
                    <div className="py-10 text-center text-muted-foreground/70 font-sans text-[14px]">
                        No replies yet — be the first to respond!
                    </div>
                )}
            </div>

            {/* ── Reply Composer (bottom) ── */}
            {thread.is_locked ? (
                <div className="flex items-center gap-3 px-5 py-4 rounded-[1rem] border-[2px] border-foreground bg-muted">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <span className="font-heading font-bold text-[14px] text-muted-foreground">
                        This thread is closed. No new replies are allowed.
                    </span>
                </div>
            ) : (
                <div className="bg-card border-[3px] border-foreground rounded-[1.5rem] shadow-[4px_4px_0_black] p-5 space-y-3">
                    <h4 className="font-heading font-bold text-[15px] text-foreground">Post a Reply</h4>
                    <ReplyComposer
                        threadId={thread.id}
                        communityId={communityId}
                        onSuccess={handleNewReply}
                    />
                </div>
            )}
        </div>
    )
}
