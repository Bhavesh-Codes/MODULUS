"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import {
  Vault,
  MessageSquare,
  CheckSquare,
  Timer,
  Users,
  ChevronRight,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Eye,
  EyeOff,
  Settings2,
  Folder,
  FileText,
  CheckCircle2,
  Video,
  Flame,
  Upload,
  Clock,
  X,
  GripVertical,
} from "lucide-react"
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableProvidedDragHandleProps,
} from "@hello-pangea/dnd"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function Avatar({ name, src, size = 7 }: { name?: string; src?: string; size?: number }) {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"
  const colors = ["#FFD600", "#0057FF", "#00C853", "#FF6B00", "#FF3B30"]
  const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length]
  return src ? (
    <img src={src} alt={name} className={`w-${size} h-${size} rounded-full object-cover border-[1.5px] border-foreground shrink-0`} />
  ) : (
    <div
      className={`w-${size} h-${size} rounded-full border-[1.5px] border-foreground flex items-center justify-center shrink-0 font-heading font-bold text-[10px] text-foreground`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}

function ActivityRow({ icon, avatar, name, action, meta, time }: {
  icon: React.ReactNode
  avatar?: string
  name: string
  action: string
  meta?: string
  time: string
}) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b-[1.5px] border-border last:border-0">
      <Avatar name={name} src={avatar} size={6} />
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[12px] text-foreground leading-snug">
          <span className="font-bold">{name}</span>{" "}
          <span className="text-muted-foreground">{action}</span>
          {meta && <span className="font-medium text-foreground"> {meta}</span>}
        </p>
        <span className="font-mono text-[10px] text-muted-foreground/70">{time}</span>
      </div>
      <div className="shrink-0 mt-0.5">{icon}</div>
    </div>
  )
}

// ─── Widget sizes ─────────────────────────────────────────────────────────────
const SIZES = ["sm", "md", "lg"] as const
type WidgetSize = typeof SIZES[number]
const SIZE_CLASSES: Record<WidgetSize, string> = {
  sm: "col-span-1",
  md: "col-span-1 sm:col-span-2",
  lg: "col-span-1 sm:col-span-2 md:col-span-3",
}
const SIZE_HEIGHT: Record<WidgetSize, string> = { sm: "h-[200px] md:h-[220px]", md: "h-[230px] md:h-[260px]", lg: "h-[260px] md:h-[300px]" }
const SIZE_COLS: Record<WidgetSize, number> = { sm: 1, md: 2, lg: 3 }

// ─── Widget shell ─────────────────────────────────────────────────────────────
function Widget({ id, title, icon, accentColor, href, size, canExpand, onResize, onHide, dragHandleProps, children }: {
  id: string; title: string; icon: React.ReactNode; accentColor: string; href: string
  size: WidgetSize; canExpand: boolean; onResize: (id: string, s: WidgetSize) => void
  onHide: (id: string) => void
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  children: React.ReactNode
}) {
  const router = useRouter()
  const sizeIdx = SIZES.indexOf(size)
  return (
    <div className={`${SIZE_CLASSES[size]} ${SIZE_HEIGHT[size]} group relative bg-card border-[2px] border-foreground rounded-[1.25rem] shadow-[4px_4px_0px_black] flex flex-col overflow-hidden transition-all duration-200`}>
      {/* header */}
      <div className="light-surface flex items-center justify-between px-3 py-2 border-b-[2px] border-foreground shrink-0" style={{ backgroundColor: accentColor }}>
        <div className="flex items-center gap-1.5">
          {/* Drag handle */}
          <span
            {...dragHandleProps}
            className="opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing text-black"
            title="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </span>
          <span className="font-heading font-extrabold text-[11px] text-black uppercase tracking-wide">{title}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {sizeIdx > 0 && (
            <button onClick={() => onResize(id, SIZES[sizeIdx - 1])} className="w-5 h-5 rounded-[5px] bg-[var(--card)44] hover:bg-[var(--card)88] flex items-center justify-center" title="Shrink">
              <Minimize2 className="w-2.5 h-2.5 text-black" />
            </button>
          )}
          {sizeIdx < SIZES.length - 1 && (
            <button
              onClick={() => canExpand ? onResize(id, SIZES[sizeIdx + 1]) : undefined}
              disabled={!canExpand}
              title={canExpand ? "Expand" : "No space — shrink another widget first"}
              className={`w-5 h-5 rounded-[5px] flex items-center justify-center ${canExpand ? "bg-[var(--card)44] hover:bg-[var(--card)88]" : "bg-[var(--card)22] opacity-40 cursor-not-allowed"}`}
            >
              <Maximize2 className="w-2.5 h-2.5 text-black" />
            </button>
          )}
          <button onClick={() => router.push(href)} className="w-5 h-5 rounded-[5px] bg-[var(--card)44] hover:bg-[var(--card)88] flex items-center justify-center" title={`Open ${title}`}>
            <ChevronRight className="w-2.5 h-2.5 text-black" />
          </button>
          <button onClick={() => onHide(id)} className="w-5 h-5 rounded-[5px] bg-[var(--card)44] hover:bg-[#FF3B3033] flex items-center justify-center" title="Hide widget">
            <EyeOff className="w-2.5 h-2.5 text-black" />
          </button>
        </div>
      </div>
      {/* body */}
      <div className="flex-1 overflow-y-auto px-3 py-2">{children}</div>
    </div>
  )
}

// ─── Activity feeds ───────────────────────────────────────────────────────────
function VaultActivity({ communityId, limit }: { communityId: string; limit: number }) {
  const { data = [] } = useQuery<any[]>({
    queryKey: ["communityVaultItems", communityId, null],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}/vault`)
      if (!res.ok) return []
      return (await res.json()).data ?? []
    },
  })
  const items = data.slice(0, limit)
  if (!items.length) return <p className="text-muted-foreground/60 text-[12px] text-center pt-4">No files yet</p>
  return (
    <>
      {items.map((item: any) => {
        const u = Array.isArray(item.users) ? item.users[0] : item.users
        const vi = Array.isArray(item.vault_items) ? item.vault_items[0] : item.vault_items
        const isLink = vi?.item_type === "link"
        return (
          <ActivityRow
            key={item.id}
            icon={isLink ? <FileText className="w-3 h-3 text-[#0057FF]" /> : <Upload className="w-3 h-3 text-[#FFD600]" />}
            avatar={u?.profile_pic}
            name={u?.name ?? "Someone"}
            action={isLink ? "added a link" : "uploaded a file"}
            meta={vi?.title ?? item.title}
            time={timeAgo(item.created_at)}
          />
        )
      })}
    </>
  )
}

function ThreadsActivity({ communityId, limit }: { communityId: string; limit: number }) {
  const { data = [] } = useQuery<any[]>({
    queryKey: ["threads", communityId],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}/threads`)
      if (!res.ok) return []
      const json = await res.json()
      return Array.isArray(json) ? json : json.data ?? []
    },
  })
  const items = data.slice(0, limit)
  if (!items.length) return <p className="text-muted-foreground/60 text-[12px] text-center pt-4">No threads yet</p>
  return (
    <>
      {items.map((t: any) => (
        <ActivityRow
          key={t.id}
          icon={<MessageSquare className="w-3 h-3 text-foreground" />}
          avatar={t.author?.profile_pic}
          name={t.author?.name ?? "Someone"}
          action="started a thread"
          meta={t.title}
          time={timeAgo(t.created_at)}
        />
      ))}
    </>
  )
}

function TasksActivity({ communityId, limit }: { communityId: string; limit: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 py-4">
      <CheckSquare className="w-6 h-6 text-muted-foreground/40" />
      <p className="text-muted-foreground/60 text-[12px] text-center">Task activity coming soon</p>
    </div>
  )
}

function FocusActivity({ communityId, limit }: { communityId: string; limit: number }) {
  const { data = [] } = useQuery<any[]>({
    queryKey: ["communityFocusLeaderboard", communityId],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}/focus/leaderboard`)
      if (!res.ok) return []
      const j = await res.json()
      return Array.isArray(j) ? j : j.data ?? []
    },
  })
  const items = data.slice(0, limit)
  if (!items.length) return <p className="text-muted-foreground/60 text-[12px] text-center pt-4">No sessions yet</p>
  return (
    <>
      {items.map((s: any, i: number) => (
        <ActivityRow
          key={s.user_id ?? i}
          icon={<Flame className="w-3 h-3 text-[#FF6B00]" />}
          avatar={s.profile_pic ?? s.user?.profile_pic}
          name={s.name ?? s.user?.name ?? "Someone"}
          action="focused for"
          meta={s.total_minutes ? `${s.total_minutes}m total` : undefined}
          time={s.last_session ? timeAgo(s.last_session) : ""}
        />
      ))}
    </>
  )
}

function CirclesActivity({ communityId, limit }: { communityId: string; limit: number }) {
  const { data: rooms = [] } = useQuery<any[]>({
    queryKey: ["livekitRooms", communityId],
    queryFn: async () => {
      const res = await fetch(`/api/livekit/rooms?communityId=${communityId}`)
      if (!res.ok) return []
      const j = await res.json()
      return Array.isArray(j.rooms) ? j.rooms : []
    },
    refetchInterval: 30_000,
  })
  const items = rooms.slice(0, limit)
  if (!items.length) return <p className="text-muted-foreground/60 text-[12px] text-center pt-4">No active circles</p>
  return (
    <>
      {items.map((r: any) => (
        <ActivityRow
          key={r.name}
          icon={<Video className="w-3 h-3 text-[#0057FF]" />}
          name={`${r.numParticipants} participant${r.numParticipants !== 1 ? 's' : ''}`}
          action="active in"
          meta={r.name}
          time="now"
        />
      ))}
    </>
  )
}

// ─── Widget definitions ───────────────────────────────────────────────────────
const WIDGETS = [
  { id: "vault", label: "Vault", accent: "#FFD600", path: "vault" },
  { id: "threads", label: "Threads", accent: "#E8F5FF", path: "threads" },
  { id: "tasks", label: "Tasks", accent: "#E6FFF0", path: "tasks" },
  { id: "focus", label: "Focus", accent: "#FFF0E6", path: "focus" },
  { id: "circles", label: "Circles", accent: "#F0F4FF", path: "circles" },
] as const
type WidgetId = typeof WIDGETS[number]["id"]

const COL_BUDGET = 6

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CommunityHomePage() {
  const params = useParams()
  const id = params.id as string

  const { data: community } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${id}`)
      if (!res.ok) throw new Error("Failed to fetch community")
      return res.json()
    },
  })

  const [widgetSizes, setWidgetSizes] = useState<Record<WidgetId, WidgetSize>>({
    vault: "md", threads: "sm", tasks: "sm", focus: "sm", circles: "sm",
  })
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(
    WIDGETS.map(w => w.id) as WidgetId[]
  )
  const [hidden, setHidden] = useState<Set<WidgetId>>(new Set())
  const [managing, setManaging] = useState(false)

  const totalCols = widgetOrder.reduce((sum, wId) =>
    hidden.has(wId) ? sum : sum + SIZE_COLS[widgetSizes[wId]], 0)

  const onResize = useCallback((widgetId: string, size: WidgetSize) => {
    setWidgetSizes(prev => {
      const next = { ...prev, [widgetId]: size }
      const newTotal = widgetOrder.reduce((s, wId) => hidden.has(wId) ? s : s + SIZE_COLS[next[wId as WidgetId]], 0)
      return newTotal > COL_BUDGET ? prev : next
    })
  }, [hidden, widgetOrder])

  const onHide = useCallback((wId: string) => setHidden(h => new Set([...h, wId as WidgetId])), [])
  const onShow = useCallback((wId: string) => setHidden(h => { const s = new Set(h); s.delete(wId as WidgetId); return s }), [])

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return
    const { source, destination } = result
    if (source.index === destination.index) return
    setWidgetOrder(prev => {
      const next = [...prev]
      const [moved] = next.splice(source.index, 1)
      next.splice(destination.index, 0, moved)
      return next
    })
  }, [])

  if (!community) return null
  const role = community.membership?.role
  const isMember = role === "owner" || role === "curator" || role === "peer"

  if (!isMember) {
    return (
      <div className="bg-background border-[2px] border-foreground rounded-[1.5rem] border-dashed p-8 text-center mt-8">
        <h3 className="font-heading font-bold text-[20px] text-foreground mb-2">Private Access</h3>
        <p className="font-sans text-[15px] text-muted-foreground">Join the community to unlock files, tasks, circles, and discussions.</p>
      </div>
    )
  }

  // Build the visible ordered list
  const orderedWidgets = widgetOrder
    .map(wId => WIDGETS.find(w => w.id === wId)!)
    .filter(Boolean)

  const visibleWidgets = orderedWidgets.filter(w => !hidden.has(w.id))

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-[20px] text-foreground leading-tight">Activity</h2>
          <p className="font-sans text-[11px] text-muted-foreground">Recent actions from community members</p>
        </div>
        <button
          onClick={() => setManaging(m => !m)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] border-[2px] border-foreground font-heading font-bold text-[12px] shadow-[3px_3px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ${managing ? "bg-foreground text-background" : "bg-[#FFD600] text-foreground"}`}
        >
          <Settings2 className="w-3.5 h-3.5" /> {managing ? "Done" : "Manage"}
        </button>
      </div>

      {/* Manage panel — hidden widget pills */}
      {managing && (
        <div className="bg-background border-[2px] border-foreground rounded-[1.25rem] p-3 flex flex-wrap gap-2">
          {orderedWidgets.map(w => {
            const isHidden = hidden.has(w.id)
            return (
              <button
                key={w.id}
                onClick={() => isHidden ? onShow(w.id) : onHide(w.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[0.625rem] border-[2px] border-foreground font-heading font-bold text-[12px] transition-all shadow-[2px_2px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none`}
                style={{ backgroundColor: isHidden ? "var(--border)" : w.accent }}
              >
                {isHidden ? <EyeOff className="w-3 h-3 text-muted-foreground/70" /> : <Eye className="w-3 h-3 text-foreground" />}
                <span className={isHidden ? "text-muted-foreground/70 line-through" : "text-foreground"}>{w.label}</span>
              </button>
            )
          })}
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/70 self-center">{hidden.size} hidden · drag to reorder</span>
        </div>
      )}

      {/* Bounded widget area with drag-and-drop */}
      <div className="bg-background border-[3px] border-foreground rounded-[2rem] shadow-[5px_5px_0px_black] p-4">
        {visibleWidgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <EyeOff className="w-8 h-8 text-muted-foreground/40" />
            <p className="font-heading font-bold text-[16px] text-muted-foreground/60">All widgets hidden</p>
            <button onClick={() => setManaging(true)} className="font-sans text-[13px] text-[#0057FF] underline">Manage widgets</button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="widget-grid" direction="horizontal">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 transition-colors duration-200 ${snapshot.isDraggingOver ? "bg-primary/5 rounded-[1.5rem]" : ""}`}
                >
                  {visibleWidgets.map(({ id: wId, label, accent, path }, index) => {
                    const currentCols = SIZE_COLS[widgetSizes[wId]]
                    const nextSize = SIZES[SIZES.indexOf(widgetSizes[wId]) + 1]
                    const nextCols = nextSize ? SIZE_COLS[nextSize] : 999
                    const canExpand = !!nextSize && (totalCols + (nextCols - currentCols)) <= COL_BUDGET
                    const activityLimit = widgetSizes[wId] === "sm" ? 2 : widgetSizes[wId] === "md" ? 4 : 6
                    return (
                      <Draggable key={wId} draggableId={wId} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`${SIZE_CLASSES[widgetSizes[wId]]} transition-opacity duration-150 ${dragSnapshot.isDragging ? "opacity-80 rotate-1 scale-[1.02]" : ""}`}
                          >
                            <Widget
                              id={wId}
                              title={label}
                              icon={null}
                              accentColor={accent}
                              href={`/communities/${id}/${path}`}
                              size={widgetSizes[wId]}
                              canExpand={canExpand}
                              onResize={onResize}
                              onHide={onHide}
                              dragHandleProps={dragProvided.dragHandleProps}
                            >
                              {wId === "vault" && <VaultActivity communityId={id} limit={activityLimit} />}
                              {wId === "threads" && <ThreadsActivity communityId={id} limit={activityLimit} />}
                              {wId === "tasks" && <TasksActivity communityId={id} limit={activityLimit} />}
                              {wId === "focus" && <FocusActivity communityId={id} limit={activityLimit} />}
                              {wId === "circles" && <CirclesActivity communityId={id} limit={activityLimit} />}
                            </Widget>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  )
}
