"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { Loader2, FolderSync, Download, Trash2, Plus, Image as ImageIcon, Video, Music, FileText, Archive, FileCode, File, Eye } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const getFileIcon = (mimeType: string = "") => {
  if (mimeType.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-[#0057FF]" />
  if (mimeType.startsWith("video/")) return <Video className="w-8 h-8 text-[#FF3CAC]" />
  if (mimeType.startsWith("audio/")) return <Music className="w-8 h-8 text-[#FFD600]" />
  if (mimeType.includes("pdf")) return <FileText className="w-8 h-8 text-[#FF3B30]" />
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("compressed"))
    return <Archive className="w-8 h-8 text-[#0A0A0A]" />
  if (mimeType.includes("json") || mimeType.includes("javascript") || mimeType.includes("html"))
    return <FileCode className="w-8 h-8 text-[#4285F4]" />
  return <File className="w-8 h-8 text-[#555550]" />
}

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 Bytes"
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export default function CommunityVaultPage() {
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)

  const { data: community } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${id}`)
      if (!res.ok) throw new Error("Failed to fetch community")
      return res.json()
    },
  })

  const { data: vaultItems = [], isLoading } = useQuery({
    queryKey: ["communityVault", id],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${id}/vault`)
      if (!res.ok) throw new Error("Failed to fetch vault")
      const json = await res.json()
      return json.data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/communities/${id}/vault/${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
         const err = await res.json()
         throw new Error(err.error || "Failed to remove item")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("File removed from Community Vault")
      queryClient.invalidateQueries({ queryKey: ["communityVault", id] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const handleDownload = async (itemId: string, filename: string, action: 'view' | 'download' = 'download') => {
    setActiveItemId(itemId)
    try {
      const res = await fetch(`/api/communities/${id}/vault/${itemId}/download?action=${action}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to get link")
      
      if (action === "view") {
        window.open(data.url, "_blank")
      } else {
        const a = document.createElement("a")
        a.href = data.url
        a.download = filename || "file"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to access file")
    } finally {
      setActiveItemId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-20">
         <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
      </div>
    )
  }

  const role = community?.membership?.role
  const canPublish = role === 'owner' || role === 'curator' || role === 'peer'

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
           <h2 className="font-heading font-extrabold text-[24px] text-[#0A0A0A] flex items-center gap-2">
             <div className="w-8 h-8 rounded-[8px] border-[2px] border-[#0A0A0A] bg-[#FF3CAC] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
               <FolderSync className="w-4 h-4 text-[#FFFFFF]" />
             </div>
             Community Vault
           </h2>
           <p className="font-sans text-[15px] text-[#555550]">Shared files, documents, and resources.</p>
         </div>

         {canPublish && (
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-5 py-2.5 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#FFD600] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all font-heading font-bold text-[14px] text-[#0A0A0A] flex items-center gap-2 shrink-0 justify-center"
            >
              <Plus className="w-5 h-5" />
              Publish from Vault
            </button>
         )}
       </div>

       {vaultItems.length === 0 ? (
          <div className="bg-[#F5F5F0] border-[2px] border-[#0A0A0A] rounded-[1.5rem] border-dashed p-12 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-[16px] bg-[#FFFFFF] border-[2px] border-[#0A0A0A] flex items-center justify-center mb-4 shadow-[4px_4px_0px_#0A0A0A]">
                <FolderSync className="w-8 h-8 text-[#0A0A0A] opacity-50" />
             </div>
             <h3 className="font-heading font-bold text-[20px] text-[#0A0A0A] mb-2">Vault is Empty</h3>
             <p className="font-sans text-[15px] text-[#555550] max-w-md mx-auto">No files have been published to the community vault yet. Publish files from your personal vault to share them with other members.</p>
          </div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
             {vaultItems.map((item: any) => {
               // Handle Supabase returning vault_items as object or array, and files as object or array
               const vi = Array.isArray(item.vault_items) ? item.vault_items[0] : item.vault_items;
               const file = Array.isArray(vi?.files) ? vi.files[0] : vi?.files;
               if (!file) return null;

               const u = Array.isArray(item.users) ? item.users[0] : item.users;

               const isMe = community?.membership?.user_id === u?.id
               const isOwner = role === 'owner' || role === 'curator'
               const canDelete = isMe || isOwner

               return (
                 <div key={item.id} className="group relative bg-[#FFFFFF] border-[2px] border-[#0A0A0A] rounded-[1.5rem] p-5 shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-150 flex flex-col h-[200px]">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-14 h-14 bg-[#FFFFFF] rounded-[12px] border-[2px] border-[#0A0A0A] flex items-center justify-center shadow-[3px_3px_0px_#0A0A0A]">
                        {getFileIcon(file.mime_type)}
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                           onClick={() => handleDownload(item.id, file.filename, 'view')}
                           disabled={activeItemId === item.id}
                           title="View file"
                           className="w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#0057FF] hover:text-[#FFFFFF] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                         >
                           <Eye className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => handleDownload(item.id, file.filename, 'download')}
                           disabled={activeItemId === item.id}
                           title="Download"
                           className="w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#00C853] hover:text-[#FFFFFF] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                         >
                           {activeItemId === item.id ? <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" /> : <Download className="w-4 h-4" />}
                         </button>
                         {canDelete && (
                            <button
                               onClick={() => deleteMutation.mutate(item.id)}
                               disabled={deleteMutation.isPending}
                               title="Remove from Community"
                               className="w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#FF3B30] hover:text-[#FFFFFF] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 text-[#FF3B30]"
                            >
                              {deleteMutation.isPending && deleteMutation.variables === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 border-current" />}
                            </button>
                         )}
                      </div>
                    </div>

                    <div className="flex-1 min-h-0">
                      <h3 className="font-heading font-bold text-[16px] text-[#0A0A0A] truncate" title={file.filename}>
                        {file.filename}
                      </h3>
                      <div className="font-mono text-[11px] text-[#555550] mt-1 space-x-2">
                        <span>{formatBytes(file.size_bytes)}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 pt-3 border-t-[2px] border-[#0A0A0A] border-dashed">
                      <div className="w-6 h-6 rounded-[6px] border-[1.5px] border-[#0A0A0A] overflow-hidden bg-[#E8E8E0] shrink-0">
                        {u?.profile_pic ? (
                           <img src={u.profile_pic} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-[#0A0A0A]">{u?.name?.[0]?.toUpperCase()}</div>
                        )}
                      </div>
                      <span className="font-sans text-[12px] font-medium text-[#555550] truncate">
                         {u?.name}
                      </span>
                    </div>
                 </div>
               )
             })}
          </div>
       )}

       <PublishFromVaultModal 
           isOpen={isPublishModalOpen} 
           onClose={() => setIsPublishModalOpen(false)} 
           communityId={id} 
       />
    </div>
  )
}

function PublishFromVaultModal({ isOpen, onClose, communityId }: { isOpen: boolean, onClose: () => void, communityId: string }) {
  const queryClient = useQueryClient()
  
  const { data: myVaultItems = [], isLoading } = useQuery({
    queryKey: ["vaultItems"],
    queryFn: async () => {
      const res = await fetch("/api/vault/items")
      if (!res.ok) throw new Error("Failed to fetch personal vault")
      const json = await res.json()
      return json.data
    },
    enabled: isOpen
  })

  // We only want actual files, not generic folders if they exist in myVaultItems
  const filesOnly = myVaultItems?.filter((m: any) => m.files) || []

  const publishMutation = useMutation({
    mutationFn: async (vaultItemId: string) => {
      const res = await fetch(`/api/communities/${communityId}/vault`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vault_item_id: vaultItemId })
      })
      if (!res.ok) {
         const d = await res.json()
         throw new Error(d.error || "Failed to publish")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("File published to Community Vault!")
      queryClient.invalidateQueries({ queryKey: ["communityVault", communityId] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
       <DialogContent className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] max-w-2xl p-6 flex flex-col max-h-[85vh]">
          <DialogHeader className="mb-4 shrink-0">
            <DialogTitle className="font-heading font-extrabold text-[22px] text-[#0A0A0A] flex items-center gap-2">
              <div className="w-8 h-8 rounded-[8px] border-[2px] border-[#0A0A0A] bg-[#FFD600] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
                <FolderSync className="w-4 h-4 text-[#0A0A0A]" />
              </div>
              Publish from Personal Vault
            </DialogTitle>
            <p className="font-sans text-[14px] text-[#555550]">Select a file from your personal vault to share it with this community.</p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 min-h-[300px]">
            {isLoading ? (
               <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
               </div>
            ) : filesOnly.length === 0 ? (
               <div className="text-center py-10 space-y-3">
                  <div className="w-16 h-16 rounded-[16px] bg-[#F5F5F0] border-[2px] border-[#0A0A0A] mx-auto flex items-center justify-center">
                     <File className="w-8 h-8 text-[#0A0A0A] opacity-30" />
                  </div>
                  <h3 className="font-heading font-bold text-[18px]">Your vault is empty</h3>
                  <p className="font-sans text-[14px] text-[#555550]">Upload files to your personal vault first.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filesOnly.map((item: any) => {
                    const isPublishing = publishMutation.isPending && publishMutation.variables === item.id
                    return (
                      <button
                         key={item.id}
                         disabled={publishMutation.isPending}
                         onClick={() => publishMutation.mutate(item.id)}
                         className="flex items-center gap-3 p-3 rounded-[1rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#F5F5F0] hover:-translate-y-1 transition-all text-left shadow-[2px_2px_0px_#0A0A0A] disabled:opacity-50"
                      >
                         <div className="w-10 h-10 rounded-[8px] bg-[#FFFFFF] border-[1.5px] border-[#0A0A0A] flex items-center justify-center shrink-0">
                           {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : getFileIcon(item.files.mime_type)}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="font-heading font-bold text-[14px] text-[#0A0A0A] truncate">{item.files.filename}</div>
                            <div className="font-mono text-[11px] text-[#555550]">{formatBytes(item.files.size_bytes)}</div>
                         </div>
                      </button>
                    )
                  })}
               </div>
            )}
          </div>
       </DialogContent>
    </Dialog>
  )
}
