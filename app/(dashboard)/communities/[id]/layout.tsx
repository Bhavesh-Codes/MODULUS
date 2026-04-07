"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, usePathname } from "next/navigation"
import {
  Loader2, Settings, UserMinus, UserPlus, Users, ArrowLeft,
  Shield, Globe, Lock, User, Clock, Star,
  MessageSquareDashed, FolderSync, Timer, Radio,
  ChevronLeft, ChevronRight, CheckSquare, Menu, X,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUiStore } from "@/lib/stores/uiStore"

// ─── Constants ───────────────────────────────────────────────────────────────

const SIDEBAR_OPEN_WIDTH = 240
const SIDEBAR_COLLAPSED_WIDTH = 64
const TOPNAV_HEIGHT = 64 // px — must match global nav bar height

// ─── App nav links ────────────────────────────────────────────────────────────

function getNavLinks(id: string) {
  return [
    { label: "Vault", href: `/communities/${id}/vault`, icon: FolderSync },
    { label: "Threads", href: `/communities/${id}/threads`, icon: MessageSquareDashed },
    { label: "Tasks", href: `/communities/${id}/tasks`, icon: CheckSquare },
    { label: "Focus", href: `/communities/${id}/focus`, icon: Timer },
    { label: "Circles", href: `/communities/${id}/circles`, icon: Radio },
  ]
}

// ─── Community App Sidebar ────────────────────────────────────────────────────

function CommunitySidebar({
  id,
  isMember,
}: {
  id: string
  isMember: boolean
}) {
  const {
    communitySidebarOpen,
    toggleCommunitySidebar,
    communitySidebarMobileOpen,
    setCommunitySidebarMobileOpen,
  } = useUiStore()

  const pathname = usePathname()
  const navLinks = getNavLinks(id)

  if (!isMember) return null

  const width = communitySidebarOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_COLLAPSED_WIDTH

  // Shared link renderer
  const renderLinks = (collapsed: boolean) =>
    navLinks.map(({ label, href, icon: Icon }) => {
      const isActive = pathname.startsWith(href)
      return (
        <Link
          key={href}
          href={href}
          title={collapsed ? label : undefined}
          onClick={() => setCommunitySidebarMobileOpen(false)}
          className={`
            relative flex items-center gap-3 transition-all
            ${collapsed ? "justify-center p-3 rounded-[1rem] mx-2 mb-3" : "px-4 py-3 rounded-[1rem] mx-4 mb-3"}
            border-[2px] border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none
            ${isActive
              ? "bg-[#FFD600]"
              : "bg-[#FFFFFF]"
            }
          `}
          style={{ minHeight: 48 }}
        >
          <Icon
            className="shrink-0"
            style={{ width: 20, height: 20, color: "#0A0A0A" }}
            strokeWidth={isActive ? 2.5 : 2}
          />
          {!collapsed && (
            <span
              className="font-sans text-[14px] text-[#0A0A0A] whitespace-nowrap overflow-hidden"
              style={{ fontWeight: isActive ? 700 : 500 }}
            >
              {label}
            </span>
          )}
        </Link>
      )
    })

  // Desktop sidebar (fixed right panel)
  const desktopSidebar = (
    <aside
      style={{
        position: "fixed",
        top: TOPNAV_HEIGHT,
        right: 0,
        width,
        height: `calc(100vh - ${TOPNAV_HEIGHT}px)`,
        transition: "width 0.25s ease",
        // NOTE: no 'display' here — let className="hidden md:flex" control it
        // so that inline style doesn't override the hidden class on mobile.
        flexDirection: "column",
        background: "#F5F5F0",
        borderLeft: "2px solid #0A0A0A",
        zIndex: 30,
        overflow: "hidden",
      }}
      className="hidden md:flex shadow-[-4px_0_10px_rgba(0,0,0,0.05)]"
    >
      {/* Toggle button */}
      <div
        className="shrink-0 flex items-center border-b-[2px] border-b-[#0A0A0A] bg-[#FFFFFF] shadow-sm mb-4"
        style={{
          height: 64,
          justifyContent: communitySidebarOpen ? "flex-end" : "center",
          padding: communitySidebarOpen ? "0 16px" : "0",
        }}
      >
        <button
          onClick={toggleCommunitySidebar}
          title={communitySidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="flex items-center justify-center bg-[#FFFFFF] hover:bg-[#FFD600] border-[2px] border-[#0A0A0A] shadow-[3px_3px_0_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all rounded-[10px]"
          style={{ width: 40, height: 40, minWidth: 40 }}
        >
          {communitySidebarOpen
            ? <ChevronRight style={{ width: 20, height: 20, color: "#0A0A0A" }} />
            : <ChevronLeft style={{ width: 20, height: 20, color: "#0A0A0A" }} />
          }
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col py-2">
        {renderLinks(!communitySidebarOpen)}
      </nav>
    </aside>
  )

  // Mobile sidebar (overlay from right)
  const mobileSidebar = (
    <>
      {/* Backdrop */}
      {communitySidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-[#0A0A0A]/50 z-40 md:hidden"
          onClick={() => setCommunitySidebarMobileOpen(false)}
        />
      )}

      {/* Panel */}
      <aside
        style={{
          position: "fixed",
          top: TOPNAV_HEIGHT,
          right: 0,
          width: SIDEBAR_OPEN_WIDTH,
          height: `calc(100vh - ${TOPNAV_HEIGHT}px)`,
          transform: communitySidebarMobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          // NOTE: no 'display' here — 'flex' is in className so md:hidden can override
          flexDirection: "column",
          background: "#F5F5F0",
          borderLeft: "2px solid #0A0A0A",
          zIndex: 50,
        }}
        className="flex flex-col md:hidden shadow-[-4px_0_10px_rgba(0,0,0,0.05)]"
      >
        <div
          className="shrink-0 flex items-center justify-between border-b-[2px] border-b-[#0A0A0A] bg-[#FFFFFF] px-4 mb-4"
          style={{ height: 64 }}
        >
          <span className="font-heading font-bold text-[15px] text-[#0A0A0A]">Apps</span>
          <button
            onClick={() => setCommunitySidebarMobileOpen(false)}
            className="flex items-center justify-center bg-[#FFFFFF] hover:bg-[#FFD600] border-[2px] border-[#0A0A0A] shadow-[3px_3px_0_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all rounded-[10px]"
            style={{ width: 40, height: 40, minWidth: 40 }}
          >
            <X style={{ width: 18, height: 18, color: "#0A0A0A" }} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto flex flex-col py-2">
          {renderLinks(false)}
        </nav>
      </aside>
    </>
  )

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  )
}

// ─── Community Header ─────────────────────────────────────────────────────────

function CommunityHeader({
  community,
  id,
  isSubPage,
  isMember,
  isOwner,
  isPending,
  role,
  onManageMembers,
  onMobileMenuOpen,
}: {
  community: any
  id: string
  isSubPage: boolean
  isMember: boolean
  isOwner: boolean
  isPending: boolean
  role: string | undefined
  onManageMembers: () => void
  onMobileMenuOpen: () => void
}) {
  const queryClient = useQueryClient()

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/communities/${id}/join`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to join")
      return res.json()
    },
    onSuccess: () => {
      if (community?.type === "Private") {
        toast.success("Request sent!")
      } else {
        toast.success("Community joined!")
      }
      queryClient.invalidateQueries({ queryKey: ["community", id] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to join")
    },
  })

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/communities/${id}/join`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to leave")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Left community")
      queryClient.invalidateQueries({ queryKey: ["community", id] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to leave")
    },
  })

  // ── Collapsed header (sub-pages) ──────────────────────────────────────────
  if (isSubPage) {
    return (
      <header
        className="flex items-center bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[1.5rem] shadow-[6px_6px_0px_#0A0A0A] px-5 py-3 gap-3 sticky top-4 z-40 shrink-0 transition-all duration-300 ease-in-out"
      >
        {/* Back link */}
        <Link
          href={`/communities/${id}`}
          className="px-3 py-1.5 flex items-center justify-center gap-1.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:bg-[#F5F5F0] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all shrink-0"
          title="Back to community home"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline">Back</span>
        </Link>

        {/* Community name and member count */}
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 flex-1 overflow-hidden">
          <span className="font-heading font-extrabold text-[#0A0A0A] leading-none truncate text-[18px]">
            {community.name}
          </span>
          <span className="font-mono text-[12px] text-[#555550]">
            <span className="hidden md:inline mr-2">•</span>
            {community.member_count} member{community.member_count !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Badges - compact icons */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            title={community.type.toUpperCase()}
            className={`flex items-center justify-center w-8 h-8 rounded-full border-[2px] border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] ${
              community.type === "Public"
                ? "bg-[#00C853] text-white"
                : "bg-[#FF6B00] text-white"
            }`}
          >
            {community.type === "Public"
              ? <Globe className="w-4 h-4" />
              : <Lock className="w-4 h-4" />
            }
          </span>

          {role === "owner" && (
            <span title="Owner" className="flex items-center justify-center w-8 h-8 rounded-full border-[2px] border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] bg-[#0057FF] text-white">
              <Shield className="w-4 h-4" />
            </span>
          )}
          {role === "curator" && (
            <span title="Curator" className="flex items-center justify-center w-8 h-8 rounded-full border-[2px] border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] bg-[#FF3CAC] text-white">
              <Star className="w-4 h-4" />
            </span>
          )}
          {role === "peer" && (
            <span title="Peer" className="flex items-center justify-center w-8 h-8 rounded-full border-[2px] border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] bg-[#FFD600] text-[#0A0A0A]">
              <User className="w-4 h-4" />
            </span>
          )}
          {role === "pending" && (
            <span title="Pending" className="flex items-center justify-center w-8 h-8 rounded-full border-[2px] border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] bg-[#E8E8E0] text-[#0A0A0A]">
              <Clock className="w-4 h-4" />
            </span>
          )}
        </div>

        {/* Mobile menu toggle */}
        {isMember && (
          <button
            onClick={onMobileMenuOpen}
            className="ml-auto flex items-center justify-center bg-[#FFFFFF] hover:bg-[#FFD600] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-[8px] md:hidden shrink-0"
            style={{ width: 36, height: 36 }}
            title="Open apps"
          >
            <Menu style={{ width: 18, height: 18, color: "#0A0A0A" }} />
          </button>
        )}
      </header>
    )
  }

  // ── Expanded header (community home) ──────────────────────────────────────
  return (
    <header
      className="relative bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] overflow-hidden"
      style={{ transition: "all 0.3s ease" }}
    >
      {/* Banner */}
      <div className="h-48 md:h-64 bg-[#FFD600] border-b-[3px] border-[#0A0A0A] relative flex items-center justify-center overflow-hidden">
        <div className="absolute top-4 left-4 w-12 h-12 rounded-full border-[3px] border-[#0A0A0A] bg-[#FF3CAC] -translate-x-2 -translate-y-2 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-16 h-16 border-[3px] border-[#0A0A0A] bg-[#0057FF] rotate-12 translate-x-2 translate-y-2 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#0A0A0A 2.5px, transparent 2.5px)",
            backgroundSize: "30px 30px",
          }}
        />
        {community.banner_url ? (
          <img
            src={community.banner_url}
            alt="banner"
            className="w-full h-full object-cover relative z-10"
          />
        ) : (
          <h1 className="font-heading font-extrabold text-8xl text-[#0A0A0A] opacity-20 relative z-10 select-none">
            {community.name[0]?.toUpperCase()}
          </h1>
        )}
      </div>

      {/* Info area */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="flex-1 space-y-4">
          <div className="flex items-center flex-wrap gap-3">
            <h1 className="font-heading font-extrabold text-[32px] md:text-[42px] leading-none text-[#0A0A0A]">
              {community.name}
            </h1>

            <span
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-[100px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] font-mono text-[13px] font-bold tracking-wide ${
                community.type === "Public"
                  ? "bg-[#00C853] text-[#FFFFFF]"
                  : "bg-[#FF6B00] text-[#FFFFFF]"
              }`}
            >
              {community.type === "Public"
                ? <Globe className="w-4 h-4" />
                : <Lock className="w-4 h-4" />
              }
              {community.type.toUpperCase()}
            </span>

            {role === "owner" && (
              <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-[12px] border-[2px] border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-mono text-[13px] font-bold tracking-wide bg-[#0057FF] text-[#FFFFFF]">
                <Shield className="w-4 h-4" />
                OWNER
              </span>
            )}
            {role === "curator" && (
              <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-[100px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] font-mono text-[13px] font-bold tracking-wide bg-[#FF3CAC] text-[#FFFFFF]">
                <Star className="w-4 h-4" />
                CURATOR
              </span>
            )}
            {role === "peer" && (
              <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-[100px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] font-mono text-[13px] font-bold tracking-wide bg-[#FFD600] text-[#0A0A0A]">
                <User className="w-4 h-4" />
                PEER
              </span>
            )}
            {role === "pending" && (
              <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-[100px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] font-mono text-[13px] font-bold tracking-wide bg-[#E8E8E0] text-[#0A0A0A]">
                <Clock className="w-4 h-4" />
                PENDING
              </span>
            )}

            {isOwner && (
              <button
                onClick={onManageMembers}
                className="ml-auto md:ml-2 px-4 py-1.5 rounded-[0.75rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:bg-[#FFD600] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Manage Members
              </button>
            )}
          </div>

          <p className="font-sans text-[16px] md:text-[18px] text-[#555550] max-w-3xl leading-relaxed">
            {community.description || "No description provided."}
          </p>

          <div className="flex items-center gap-2 font-mono text-[14px] text-[#0A0A0A]">
            <div className="w-10 h-10 rounded-[10px] bg-[#E8E8E0] border-[2px] border-[#0A0A0A] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
              <Users className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <span className="font-bold text-[16px]">{community.member_count}</span>
            {" "}member{community.member_count !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-col items-stretch md:items-end gap-3 mt-4 md:mt-0 relative z-20">
          {isOwner ? (
            <button
              disabled
              className="px-6 py-3 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#F5F5F0] font-heading font-bold text-[15px] text-[#0A0A0A] opacity-70 flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <Shield className="w-5 h-5" />
              You are the Owner
            </button>
          ) : isPending ? (
            <button
              disabled
              className="px-6 py-3 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#E8E8E0] shadow-[4px_4px_0px_#0A0A0A] font-heading font-bold text-[15px] text-[#0A0A0A] flex items-center justify-center gap-2 w-full md:w-auto opacity-70 cursor-not-allowed"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Request Pending...
            </button>
          ) : isMember ? (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to leave ${community.name}?`)) {
                  leaveMutation.mutate()
                }
              }}
              disabled={leaveMutation.isPending}
              className="px-6 py-3 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#FF3B30] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all font-heading font-bold text-[15px] text-[#FFFFFF] flex items-center justify-center gap-2 disabled:opacity-50 w-full md:w-auto"
            >
              {leaveMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserMinus className="w-5 h-5" />
              )}
              Leave Community
            </button>
          ) : (
            <button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="px-6 py-3 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#FFD600] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none transition-all font-heading font-bold text-[16px] text-[#0A0A0A] flex items-center justify-center gap-2 disabled:opacity-50 w-full md:w-auto"
            >
              {joinMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {community.type === "Private" ? "Request to Join" : "Join Community"}
            </button>
          )}

          <div className="flex gap-2 self-end md:self-auto mt-2">
            {isOwner && (
              <button
                title="Community Settings"
                className="w-12 h-12 rounded-[12px] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all flex items-center justify-center"
              >
                <Settings className="w-5 h-5 text-[#0A0A0A]" />
              </button>
            )}

            {/* Mobile menu toggle on expanded header */}
            {isMember && (
              <button
                onClick={onMobileMenuOpen}
                className="w-12 h-12 rounded-[12px] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all flex items-center justify-center md:hidden"
                title="Open apps"
              >
                <Menu className="w-5 h-5 text-[#0A0A0A]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const id = params.id as string
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)

  const { communitySidebarOpen, communitySidebarMobileOpen, setCommunitySidebarMobileOpen } =
    useUiStore()

  const { data: community, isLoading } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${id}`)
      if (!res.ok) throw new Error("Failed to fetch community")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-[#0A0A0A]" />
      </div>
    )
  }

  if (!community) {
    return (
      <div className="p-8 text-center mt-20">
        <h2 className="font-heading font-extrabold text-[28px] text-[#0A0A0A]">
          Community Not Found
        </h2>
        <Link
          href="/explore"
          className="px-5 py-2.5 mt-4 inline-flex items-center justify-center gap-2 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:bg-[#F5F5F0] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </Link>
      </div>
    )
  }

  const role = community.membership?.role
  const isOwner = role === "owner"
  const isPending = role === "pending"
  const isMember = role === "owner" || role === "curator" || role === "peer"

  // Detect sub-page: pathname is longer than "/communities/[id]"
  const communityRoot = `/communities/${id}`
  const isSubPage = pathname !== communityRoot && !pathname.endsWith(`/communities/${id}`)

  // Detect if we're inside a live circle room (needs full-screen breakout layout)
  const isCircleRoom = /\/communities\/[^\/]+\/circles\/.+/.test(pathname)

  // Sidebar width for content area right-padding (desktop only)
  const sidebarWidth = isMember
    ? communitySidebarOpen
      ? SIDEBAR_OPEN_WIDTH
      : SIDEBAR_COLLAPSED_WIDTH
    : 0

  return (
    <>
      {/* Right-side App Sidebar */}
      <CommunitySidebar id={id} isMember={isMember} />

      {/* Page content — shifts left to not go under sidebar on desktop */}
      <div
        className="[padding-right:0] md:[padding-right:var(--sidebar-w)] transition-[padding-right] duration-[250ms] ease-in-out"
        style={{ "--sidebar-w": `${sidebarWidth}px` } as React.CSSProperties}
      >
        {isCircleRoom ? (
          // ── Live circle room: breakout layout, no content padding, header + room fills rest ──
          <div
            className="flex flex-col"
            style={{ height: `calc(100dvh - ${TOPNAV_HEIGHT}px)` }}
          >
            {/* Compact community header — always sub-page style */}
            <div className="px-3 md:px-6 pt-3 pb-2 shrink-0">
              <CommunityHeader
                community={community}
                id={id}
                isSubPage={true}
                isMember={isMember}
                isOwner={isOwner}
                isPending={isPending}
                role={role}
                onManageMembers={() => setIsMembersModalOpen(true)}
                onMobileMenuOpen={() => setCommunitySidebarMobileOpen(true)}
              />
            </div>
            {/* Circle room fills remaining height */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {children}
            </div>
          </div>
        ) : (
          // ── Regular community pages: normal padded layout ──
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-4 pb-32 space-y-6">
            {/* Community header */}
            <CommunityHeader
              community={community}
              id={id}
              isSubPage={isSubPage}
              isMember={isMember}
              isOwner={isOwner}
              isPending={isPending}
              role={role}
              onManageMembers={() => setIsMembersModalOpen(true)}
              onMobileMenuOpen={() => setCommunitySidebarMobileOpen(true)}
            />

            {/* Page content */}
            <div className="w-full">
              {children}
            </div>
          </div>
        )}
      </div>

      {/* Manage members modal */}
      {isOwner && (
        <ManageMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          communityId={id}
        />
      )}
    </>
  )
}

// ─── Manage Members Modal (unchanged) ────────────────────────────────────────

function ManageMembersModal({
  isOpen,
  onClose,
  communityId,
}: {
  isOpen: boolean
  onClose: () => void
  communityId: string
}) {
  const queryClient = useQueryClient()

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["communityMembers", communityId],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}/members`)
      if (!res.ok) throw new Error("Failed to fetch members")
      return res.json()
    },
    enabled: isOpen,
  })

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/communities/${communityId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "peer" }),
      })
      if (!res.ok) throw new Error("Failed to approve")
      return res.json()
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["communityMembers", communityId] })
      const previousMembers = queryClient.getQueryData(["communityMembers", communityId])
      queryClient.setQueryData(["communityMembers", communityId], (old: any) => {
        if (!old) return old
        return old.map((m: any) =>
          m.user_id === userId ? { ...m, role: "peer" } : m
        )
      })
      return { previousMembers }
    },
    onError: (err: any, _v, context) => {
      toast.error(err.message)
      if (context?.previousMembers) {
        queryClient.setQueryData(["communityMembers", communityId], context.previousMembers)
      }
    },
    onSuccess: () => toast.success("Request approved!"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["communityMembers", communityId] })
      queryClient.invalidateQueries({ queryKey: ["community", communityId] })
    },
  })

  const kickMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/communities/${communityId}/members/${userId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove")
      return res.json()
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["communityMembers", communityId] })
      const previousMembers = queryClient.getQueryData(["communityMembers", communityId])
      queryClient.setQueryData(["communityMembers", communityId], (old: any) => {
        if (!old) return old
        return old.filter((m: any) => m.user_id !== userId)
      })
      return { previousMembers }
    },
    onError: (err: any, _v, context) => {
      toast.error(err.message)
      if (context?.previousMembers) {
        queryClient.setQueryData(["communityMembers", communityId], context.previousMembers)
      }
    },
    onSuccess: () => toast.success("Member removed"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["communityMembers", communityId] })
      queryClient.invalidateQueries({ queryKey: ["community", communityId] })
    },
  })

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/communities/${communityId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error("Failed to update role")
      return res.json()
    },
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: ["communityMembers", communityId] })
      const previousMembers = queryClient.getQueryData(["communityMembers", communityId])
      queryClient.setQueryData(["communityMembers", communityId], (old: any) => {
        if (!old) return old
        return old.map((m: any) => (m.user_id === userId ? { ...m, role } : m))
      })
      return { previousMembers }
    },
    onError: (err: any, _v, context) => {
      toast.error(err.message)
      if (context?.previousMembers) {
        queryClient.setQueryData(["communityMembers", communityId], context.previousMembers)
      }
    },
    onSuccess: () => toast.success("Role updated"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["communityMembers", communityId] })
      queryClient.invalidateQueries({ queryKey: ["community", communityId] })
    },
  })

  const pendingMembers = members.filter((m: any) => m.role === "pending")
  const activeMembers = members.filter(
    (m: any) => m.role === "peer" || m.role === "owner" || m.role === "curator"
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] max-w-lg p-6 flex flex-col max-h-[85vh]">
        <DialogHeader className="mb-4 shrink-0">
          <DialogTitle className="font-heading font-extrabold text-[22px] text-[#0A0A0A] flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#FFD600] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#0A0A0A]" />
            </div>
            Manage Members
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto pr-2 space-y-8 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
            </div>
          ) : (
            <>
              {/* Pending Requests */}
              {pendingMembers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-heading font-extrabold text-[16px] text-[#0A0A0A] flex items-center justify-between border-b-[2px] border-[#0A0A0A] pb-2 border-dashed">
                    Pending Requests
                    <span className="bg-[#FF6B00] text-white px-2 py-0.5 rounded-[100px] text-[12px] shadow-[2px_2px_0px_#0A0A0A] border-[1.5px] border-[#0A0A0A]">
                      {pendingMembers.length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {pendingMembers.map((m: any) => (
                      <div
                        key={m.user_id}
                        className="flex items-center justify-between p-3 rounded-[1rem] border-[2px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] bg-[#FFFFFF] hover:-translate-y-1 transition-transform"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[8px] bg-[#E8E8E0] border-[1.5px] border-[#0A0A0A] overflow-hidden flex items-center justify-center shrink-0">
                            {m.user?.profile_pic ? (
                              <img src={m.user.profile_pic} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <UserPlus className="w-5 h-5 text-[#555550]" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold font-heading text-[15px] text-[#0A0A0A] line-clamp-1">
                              {m.user?.name || "Unknown User"}
                            </div>
                            <div className="font-sans text-[12px] text-[#555550]">
                              Requested {new Date(m.joined_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={approveMutation.isPending || kickMutation.isPending}
                            onClick={() => kickMutation.mutate(m.user_id)}
                            className="w-10 h-10 rounded-[8px] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#FF3B30] hover:text-[#FFFFFF] transition-colors flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                          <button
                            disabled={approveMutation.isPending || kickMutation.isPending}
                            onClick={() => approveMutation.mutate(m.user_id)}
                            className="bg-[#00C853] text-[#FFFFFF] text-[14px] font-heading font-bold px-4 py-2 rounded-[8px] border-[2px] border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all flex items-center gap-1"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Members */}
              <div className="space-y-4">
                <h3 className="font-heading font-extrabold text-[16px] text-[#0A0A0A] flex items-center justify-between border-b-[2px] border-[#0A0A0A] pb-2 border-dashed">
                  Active Members
                  <span className="bg-[#E8E8E0] text-[#0A0A0A] px-2 py-0.5 rounded-[100px] text-[12px] shadow-[2px_2px_0px_#0A0A0A] border-[1.5px] border-[#0A0A0A]">
                    {activeMembers.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {activeMembers.map((m: any) => (
                    <div
                      key={m.user_id}
                      className="flex items-center justify-between p-3 rounded-[1rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#F5F5F0] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[8px] bg-[#FFD600] border-[1.5px] border-[#0A0A0A] overflow-hidden flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                          {m.user?.profile_pic ? (
                            <img src={m.user.profile_pic} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold font-heading text-[16px] text-[#0A0A0A]">
                              {m.user?.name?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[14px] font-heading text-[#0A0A0A] line-clamp-1 flex items-center gap-2">
                            {m.user?.name || "Unknown User"}
                            {m.role === "owner" && (
                              <span className="text-[10px] bg-[#FFD600] border-[1.5px] border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] px-1.5 rounded-[100px] font-bold tracking-widest uppercase">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="font-sans text-[12px] text-[#555550] mt-0.5">
                            Joined {new Date(m.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {m.role !== "owner" ? (
                        <div className="flex items-center gap-2">
                          <select
                            disabled={roleMutation.isPending}
                            value={m.role}
                            onChange={(e) =>
                              roleMutation.mutate({ userId: m.user_id, role: e.target.value })
                            }
                            className="px-3 py-1.5 rounded-[8px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] bg-[#FFFFFF] text-[13px] font-bold font-sans outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all cursor-pointer disabled:opacity-50 appearance-none pr-8 relative hover:bg-[#F5F5F0]"
                            style={{
                              backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%230A0A0A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 0.7rem top 50%",
                              backgroundSize: "0.65rem auto",
                            }}
                          >
                            <option value="owner">Owner</option>
                            <option value="curator">Curator</option>
                            <option value="peer">Peer</option>
                          </select>
                          <button
                            disabled={kickMutation.isPending}
                            onClick={() => {
                              if (window.confirm("Are you sure you want to kick this member?")) {
                                kickMutation.mutate(m.user_id)
                              }
                            }}
                            title="Remove User"
                            className="w-8 h-8 rounded-[8px] border-[2px] border-[#0A0A0A] bg-[#FF3B30] text-[#FFFFFF] shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center disabled:opacity-50"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[12px] font-bold text-[#555550]">
                          Owner (Immutable)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
