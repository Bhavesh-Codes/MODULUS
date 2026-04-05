"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Loader2, Settings, UserMinus, UserPlus, Users, ArrowLeft, Shield, Globe, Lock, User, Clock, Star, PanelRight, MessageSquareDashed, FolderSync, Timer, Radio } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { data: community, isLoading } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${id}`)
      if (!res.ok) throw new Error("Failed to fetch community")
      return res.json()
    }
  })

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/communities/${id}/join`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to join")
      return res.json()
    },
    onSuccess: () => {
      if (community?.type === 'Private') {
        toast.success("Request sent!")
      } else {
        toast.success("Community joined!")
      }
      queryClient.invalidateQueries({ queryKey: ["community", id] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to join")
    }
  })

  // Leave mutation
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
    }
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
        <h2 className="font-heading font-extrabold text-[28px] text-[#0A0A0A]">Community Not Found</h2>
        <Link href="/explore" className="inline-flex mt-4 font-bold text-[#0057FF] hover:underline underline-offset-4 font-sans items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Go back
        </Link>
      </div>
    )
  }

  const role = community.membership?.role
  const isOwner = role === 'owner'
  const isPending = role === 'pending'
  const isMember = role === 'owner' || role === 'curator' || role === 'peer'

  return (
    <div className="w-full max-w-[1280px] mx-auto p-4 md:p-8 space-y-8 pb-32">
      
      {/* Header Card */}
      <div className="relative bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] overflow-hidden">
        {/* Banner Area */}
        <div className="h-48 md:h-64 bg-[#FFD600] border-b-[3px] border-[#0A0A0A] relative flex items-center justify-center">
           {/* Decorative Memphis Element */}
          <div className="absolute top-4 left-4 w-12 h-12 rounded-full border-[3px] border-[#0A0A0A] bg-[#FF3CAC] -translate-x-2 -translate-y-2" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-[3px] border-[#0A0A0A] bg-[#0057FF] rotate-12 translate-x-2 translate-y-2" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#0A0A0A 2.5px, transparent 2.5px)', backgroundSize: '30px 30px' }} />
          
          {community.banner_url ? (
            <img src={community.banner_url} alt="banner" className="w-full h-full object-cover relative z-10" />
          ) : (
            <h1 className="font-heading font-extrabold text-8xl text-[#0A0A0A] opacity-20 relative z-10 select-none">
              {community.name[0]?.toUpperCase()}
            </h1>
          )}
        </div>

        {/* Info Area */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="flex-1 space-y-4">
            <div className="flex items-center flex-wrap gap-3">
              <h1 className="font-heading font-extrabold text-[32px] md:text-[42px] leading-none text-[#0A0A0A]">
                {community.name}
              </h1>
              <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-[100px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] font-mono text-[13px] font-bold tracking-wide ${community.type === 'Public' ? 'bg-[#00C853] text-[#FFFFFF]' : 'bg-[#FF6B00] text-[#FFFFFF]'}`}>
                {community.type === 'Public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {community.type.toUpperCase()}
              </span>

              {role === 'owner' ? (
                <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-[12px] border-[2px] border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] font-mono text-[13px] font-bold tracking-wide bg-[#0057FF] text-[#FFFFFF]">
                  <Shield className="w-4 h-4" />
                  OWNER
                </span>
              ) : role === 'curator' ? (
                <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-[100px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] font-mono text-[13px] font-bold tracking-wide bg-[#FF3CAC] text-[#FFFFFF]">
                  <Star className="w-4 h-4" />
                  CURATOR
                </span>
              ) : role === 'peer' ? (
                <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-[100px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] font-mono text-[13px] font-bold tracking-wide bg-[#FFD600] text-[#0A0A0A]">
                  <User className="w-4 h-4" />
                  PEER
                </span>
              ) : role === 'pending' ? (
                <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-[100px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] font-mono text-[13px] font-bold tracking-wide bg-[#E8E8E0] text-[#0A0A0A]">
                  <Clock className="w-4 h-4" />
                  PENDING
                </span>
              ) : null}
              {isOwner && (
                <button
                  onClick={() => setIsMembersModalOpen(true)}
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
              <span className="font-bold text-[16px]">{community.member_count}</span> member{community.member_count !== 1 ? 's' : ''}
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
                    if(window.confirm(`Are you sure you want to leave ${community.name}?`)) {
                      leaveMutation.mutate()
                    }
                  }}
                  disabled={leaveMutation.isPending}
                  className="px-6 py-3 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#FF3B30] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all font-heading font-bold text-[15px] text-[#FFFFFF] flex items-center justify-center gap-2 disabled:opacity-50 w-full md:w-auto"
                >
                  {leaveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserMinus className="w-5 h-5" />}
                  Leave Community
                </button>
            ) : (
                <button
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  className="px-6 py-3 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#FFD600] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none transition-all font-heading font-bold text-[16px] text-[#0A0A0A] flex items-center justify-center gap-2 disabled:opacity-50 w-full md:w-auto"
                >
                  {joinMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  {community.type === 'Private' ? 'Request to Join' : 'Join Community'}
                </button>
            )}

            <div className="flex gap-2 self-end md:self-auto mt-2">
              {isMember && (
                <button 
                   onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                   title="Toggle Apps Sidebar" 
                   className={`w-12 h-12 rounded-[12px] border-[2px] border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all flex items-center justify-center ${isSidebarOpen ? 'bg-[#FFD600]' : 'bg-[#FFFFFF]'}`}
                >
                  <PanelRight className="w-5 h-5 text-[#0A0A0A]" />
                </button>
              )}

              {isOwner && (
                <button title="Community Settings" className="w-12 h-12 rounded-[12px] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#0A0A0A]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Content Area */}
        <div className="flex-1 w-full space-y-8">
          {children}
        </div>

        {/* Collapsible Sidebar */}
        {isSidebarOpen && isMember && (
          <aside className="w-full lg:w-80 shrink-0 bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] p-6 lg:sticky lg:top-8">
            <h3 className="font-heading font-extrabold text-[18px] text-[#0A0A0A] mb-4 border-b-[2px] border-[#0A0A0A] border-dashed pb-2">
              Community Apps
            </h3>
            <div className="space-y-3">
              <Link href={`/communities/${id}/threads`} className="w-full flex items-center gap-3 p-3 rounded-[1rem] border-[2px] border-[#0A0A0A] bg-[#F5F5F0] hover:bg-[#FFD600] hover:shadow-[3px_3px_0px_#0A0A0A] hover:-translate-y-1 transition-all text-left group">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFFFFF] border-[2px] border-[#0A0A0A] flex items-center justify-center shrink-0 group-hover:bg-[#0057FF] group-hover:text-[#FFFFFF] transition-colors">
                  <MessageSquareDashed className="w-5 h-5 text-[#0A0A0A] group-hover:text-[#FFFFFF]" />
                </div>
                <div>
                  <div className="font-heading font-bold text-[15px] text-[#0A0A0A]">Threads</div>
                  <div className="font-sans text-[12px] text-[#555550]">Discussions & QA</div>
                </div>
              </Link>

              <Link href={`/communities/${id}/vault`} className="w-full flex items-center gap-3 p-3 rounded-[1rem] border-[2px] border-[#0A0A0A] bg-[#F5F5F0] hover:bg-[#FF3CAC] hover:text-[#FFFFFF] hover:shadow-[3px_3px_0px_#0A0A0A] hover:-translate-y-1 transition-all text-left group">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFFFFF] border-[2px] border-[#0A0A0A] flex items-center justify-center shrink-0 text-[#0A0A0A]">
                  <FolderSync className="w-5 h-5 text-[#0A0A0A] group-hover:text-[#FFFFFF]" />
                </div>
                <div>
                  <div className="font-heading font-bold text-[15px] text-inherit">Vault</div>
                  <div className="font-sans text-[12px] text-inherit opacity-80">Shared Resources</div>
                </div>
              </Link>

              <Link href={`/communities/${id}/timer`} className="w-full flex items-center gap-3 p-3 rounded-[1rem] border-[2px] border-[#0A0A0A] bg-[#F5F5F0] hover:bg-[#00C853] hover:text-[#FFFFFF] hover:shadow-[3px_3px_0px_#0A0A0A] hover:-translate-y-1 transition-all text-left group">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFFFFF] border-[2px] border-[#0A0A0A] flex items-center justify-center shrink-0 text-[#0A0A0A]">
                  <Timer className="w-5 h-5 text-[#0A0A0A] group-hover:text-[#FFFFFF]" />
                </div>
                <div>
                  <div className="font-heading font-bold text-[15px] text-inherit">Focus Timer</div>
                  <div className="font-sans text-[12px] text-inherit opacity-80">Pomodoro sync</div>
                </div>
              </Link>

              <Link href={`/communities/${id}/circles`} className="w-full flex items-center gap-3 p-3 rounded-[1rem] border-[2px] border-[#0A0A0A] bg-[#F5F5F0] hover:bg-[#FF6B00] hover:text-[#FFFFFF] hover:shadow-[3px_3px_0px_#0A0A0A] hover:-translate-y-1 transition-all text-left group">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFFFFF] border-[2px] border-[#0A0A0A] flex items-center justify-center shrink-0 text-[#0A0A0A]">
                  <Radio className="w-5 h-5 text-[#0A0A0A] group-hover:text-[#FFFFFF]" />
                </div>
                <div>
                  <div className="font-heading font-bold text-[15px] text-inherit">Live Circles</div>
                  <div className="font-sans text-[12px] text-inherit opacity-80">Voice & Video</div>
                </div>
              </Link>
            </div>
          </aside>
        )}
      </div>

      {isOwner && (
        <ManageMembersModal 
          isOpen={isMembersModalOpen} 
          onClose={() => setIsMembersModalOpen(false)} 
          communityId={id} 
        />
      )}
    </div>
  )
}

function ManageMembersModal({ isOpen, onClose, communityId }: { isOpen: boolean, onClose: () => void, communityId: string }) {
  const queryClient = useQueryClient()

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["communityMembers", communityId],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${communityId}/members`)
      if (!res.ok) throw new Error("Failed to fetch members")
      return res.json()
    },
    enabled: isOpen
  })

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/communities/${communityId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "peer" })
      })
      if (!res.ok) throw new Error("Failed to approve")
      return res.json()
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["communityMembers", communityId] })
      const previousMembers = queryClient.getQueryData(["communityMembers", communityId])
      queryClient.setQueryData(["communityMembers", communityId], (old: any) => {
        if (!old) return old
        return old.map((m: any) => m.user_id === userId ? { ...m, role: "peer" } : m)
      })
      return { previousMembers }
    },
    onError: (err: any, variables, context) => {
      toast.error(err.message)
      if (context?.previousMembers) {
        queryClient.setQueryData(["communityMembers", communityId], context.previousMembers)
      }
    },
    onSuccess: () => {
      toast.success("Request approved!")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["communityMembers", communityId] })
      queryClient.invalidateQueries({ queryKey: ["community", communityId] })
    }
  })

  const kickMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/communities/${communityId}/members/${userId}`, {
        method: "DELETE"
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
    onError: (err: any, variables, context) => {
      toast.error(err.message)
      if (context?.previousMembers) {
        queryClient.setQueryData(["communityMembers", communityId], context.previousMembers)
      }
    },
    onSuccess: () => {
      toast.success("Member removed")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["communityMembers", communityId] })
      queryClient.invalidateQueries({ queryKey: ["community", communityId] })
    }
  })

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      const res = await fetch(`/api/communities/${communityId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      })
      if (!res.ok) throw new Error("Failed to update role")
      return res.json()
    },
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: ["communityMembers", communityId] })
      const previousMembers = queryClient.getQueryData(["communityMembers", communityId])
      queryClient.setQueryData(["communityMembers", communityId], (old: any) => {
        if (!old) return old
        return old.map((m: any) => m.user_id === userId ? { ...m, role } : m)
      })
      return { previousMembers }
    },
    onError: (err: any, variables, context) => {
      toast.error(err.message)
      if (context?.previousMembers) {
        queryClient.setQueryData(["communityMembers", communityId], context.previousMembers)
      }
    },
    onSuccess: () => {
      toast.success("Role updated")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["communityMembers", communityId] })
      queryClient.invalidateQueries({ queryKey: ["community", communityId] })
    }
  })

  const pendingMembers = members.filter((m: any) => m.role === "pending")
  const activeMembers = members.filter((m: any) => m.role === "peer" || m.role === "owner" || m.role === "curator")

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
                      <div key={m.user_id} className="flex items-center justify-between p-3 rounded-[1rem] border-[2px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] bg-[#FFFFFF] hover:-translate-y-1 transition-transform">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[8px] bg-[#E8E8E0] border-[1.5px] border-[#0A0A0A] overflow-hidden flex items-center justify-center shrink-0">
                             {m.user?.profile_pic ? (
                               <img src={m.user.profile_pic} alt="" className="w-full h-full object-cover" />
                             ) : (
                               <UserPlus className="w-5 h-5 text-[#555550]" />
                             )}
                          </div>
                          <div>
                            <div className="font-bold font-heading text-[15px] text-[#0A0A0A] line-clamp-1">{m.user?.name || "Unknown User"}</div>
                            <div className="font-sans text-[12px] text-[#555550]">Requested {new Date(m.joined_at).toLocaleDateString()}</div>
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
                      <div key={m.user_id} className="flex items-center justify-between p-3 rounded-[1rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#F5F5F0] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[8px] bg-[#FFD600] border-[1.5px] border-[#0A0A0A] overflow-hidden flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                             {m.user?.profile_pic ? (
                               <img src={m.user.profile_pic} alt="" className="w-full h-full object-cover" />
                             ) : (
                               <span className="font-bold font-heading text-[16px] text-[#0A0A0A]">{m.user?.name?.[0]?.toUpperCase()}</span>
                             )}
                          </div>
                          <div>
                            <div className="font-bold text-[14px] font-heading text-[#0A0A0A] line-clamp-1 flex items-center gap-2">
                              {m.user?.name || "Unknown User"}
                              {m.role === 'owner' && <span className="text-[10px] bg-[#FFD600] border-[1.5px] border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] px-1.5 rounded-[100px] font-bold tracking-widest uppercase">Owner</span>}
                            </div>
                            <div className="font-sans text-[12px] text-[#555550] mt-0.5">Joined {new Date(m.joined_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        {m.role !== 'owner' ? (
                          <div className="flex items-center gap-2">
                            <select
                               disabled={roleMutation.isPending}
                               value={m.role}
                               onChange={(e) => roleMutation.mutate({ userId: m.user_id, role: e.target.value })}
                               className="px-3 py-1.5 rounded-[8px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] bg-[#FFFFFF] text-[13px] font-bold font-sans outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all cursor-pointer disabled:opacity-50 appearance-none pr-8 relative hover:bg-[#F5F5F0]"
                               style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%230A0A0A%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
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
                          <div className="text-[12px] font-bold text-[#555550]">Owner (Immutable)</div>
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
