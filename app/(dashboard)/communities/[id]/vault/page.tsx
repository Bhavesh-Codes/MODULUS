"use client"

import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { Loader2, FolderSync, Download, Trash2, Plus, Image as ImageIcon, Video, Music, FileText, Archive, FileCode, File, Eye, Upload, Tag, X, Folder, Search, ChevronRight, FolderPlus, Settings2, Link2, ExternalLink, PlayCircle, MoreVertical, Check } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function getUrlDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("?")[0]
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v")
  } catch { /* ignore */ }
  return null
}

function getLinkIcon(url: string) {
  if (!url) return <Link2 className="w-8 h-8 text-[#0057FF]" />
  const lower = url.toLowerCase()
  if (lower.includes("youtube.com") || lower.includes("youtu.be"))
    return <PlayCircle className="w-8 h-8 text-[#FF3B30]" />
  if (lower.includes("drive.google.com"))
    return (
      <svg viewBox="0 0 87.3 78" className="w-8 h-8" aria-label="Google Drive">
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 52H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
        <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 47.5C.4 48.9 0 50.45 0 52h27.5z" fill="#00ac47"/>
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60l5.85 11.5z" fill="#ea4335"/>
        <path d="M43.65 25L57.4 0c-1.55 0-3.1.4-4.5 1.2L29.9 0 16.15 25z" fill="#00832d"/>
        <path d="M60 52H27.5L13.75 76.8c1.4.8 2.95 1.2 4.5 1.2h50.8c1.55 0 3.1-.4 4.5-1.2z" fill="#2684fc"/>
        <path d="M73.4 26.5L59.65 2.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 60 52h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
      </svg>
    )
  return <Link2 className="w-8 h-8 text-[#0057FF]" />
}

function getLinkBgColor(url: string): string {
  if (!url) return "bg-[#EEF3FF]"
  const lower = url.toLowerCase()
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "bg-[#FFF0F0]"
  if (lower.includes("drive.google.com")) return "bg-[#F0F7FF]"
  return "bg-[#EEF3FF]"
}

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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  
  // Folders & Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [folderStack, setFolderStack] = useState<{id: string, name: string}[]>([])
  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null

  // Modals state
  const [isCreateFolderModal, setIsCreateFolderModal] = useState(false)
  const [organizeItem, setOrganizeItem] = useState<any>(null)

  const { data: community } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${id}`)
      if (!res.ok) throw new Error("Failed to fetch community")
      return res.json()
    },
  })

  // Folders
  const { data: folders = [] } = useQuery({
    queryKey: ["communityVaultFolders", id],
    queryFn: async () => {
      const res = await fetch(`/api/communities/${id}/vault/folders`)
      if (!res.ok) throw new Error("Failed to fetch folders")
      const json = await res.json()
      return json.data
    }
  })

  // Items fetch (all community items)
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

  // Bulk actions state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([])

  const toggleItem = (id: string) => setSelectedItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleFolder = (id: string) => setSelectedFolderIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const clearSelection = () => { setSelectedItemIds([]); setSelectedFolderIds([]) }

  const handleBulkDelete = async () => {
    if (selectedItemIds.length === 0 && selectedFolderIds.length === 0) return
    const confirm = window.confirm(`Delete ${selectedItemIds.length} file(s) and ${selectedFolderIds.length} folder(s)?`)
    if (!confirm) return

    const toastId = toast.loading("Deleting selected items...")
    try {
      await Promise.all([
        ...selectedItemIds.map(itemId => fetch(`/api/communities/${id}/vault/${itemId}`, { method: 'DELETE' })),
        ...selectedFolderIds.map(folderId => fetch(`/api/communities/${id}/vault/folders?folderId=${folderId}`, { method: 'DELETE' }))
      ])
      toast.success("Deleted successfully", { id: toastId })
      queryClient.invalidateQueries({ queryKey: ["communityVaultFolders", id] })
      queryClient.invalidateQueries({ queryKey: ["communityVault", id] })
      clearSelection()
    } catch (e: any) {
      toast.error("Failed to delete some items", { id: toastId })
    }
  }

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

  const role = community?.membership?.role
  const canPublish = role === 'owner' || role === 'curator' || role === 'peer'
  const canOrganize = role === 'owner' || role === 'curator'

  // Filter Local Data
  const q = searchQuery.toLowerCase()
  const filteredItems = vaultItems.filter((m: any) => {
     // If actively searching, search globally across all folder structures
     if (q) {
        const vi = Array.isArray(m.vault_items) ? m.vault_items[0] : m.vault_items
        const file = Array.isArray(vi?.files) ? vi.files[0] : vi?.files
        const checksName = file?.filename?.toLowerCase().includes(q)
        const checksTags = m.tags?.some((t: string) => t.toLowerCase().includes(q))
        return checksName || checksTags
     }
     
     // Otherwise strictly show items inside the current folder layer
     return (m.folder_id || null) === (currentFolderId || null)
  })

  // Target folders exclusively tied to the current breadcrumb ID unless searching
  const filteredFolders = folders.filter((f: any) => {
     if (q) return f.name.toLowerCase().includes(q)
     return (f.parent_id || null) === (currentFolderId || null)
  })

  // Add renderItemCard dynamically
  const renderItemCard = (item: any) => {
    const vi = Array.isArray(item.vault_items) ? item.vault_items[0] : item.vault_items;
    const file = Array.isArray(vi?.files) ? vi.files[0] : vi?.files;
    const isLink = vi?.item_type === "link";
    if (!file && !isLink) return null;

    const u = Array.isArray(item.users) ? item.users[0] : item.users;

    const isMe = community?.membership?.user_id === u?.id
    const isOwner = role === 'owner' || role === 'curator'
    const canDelete = isMe || isOwner
    const linkDomain = isLink && vi.url ? getUrlDomain(vi.url) : ""
    const ytVideoId = isLink && vi.url ? getYouTubeVideoId(vi.url) : null

    const handleLinkOpen = () => {
      window.open(vi.url ?? "", "_blank", "noopener,noreferrer")
    }

    return (
      <div key={item.id} className={`group relative bg-[#FFFFFF] border-[2px] border-[#0A0A0A] rounded-[1.5rem] p-5 shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-150 flex flex-col h-[230px] ${isLink ? 'cursor-pointer' : ''}`} onClick={isLink ? handleLinkOpen : undefined}>
        <div 
          onClick={(e) => { e.stopPropagation(); toggleItem(item.id) }} 
          className={`absolute top-4 left-4 w-5 h-5 rounded-[6px] border-[2px] border-[#0A0A0A] flex items-center justify-center cursor-pointer transition-all z-10 ${selectedItemIds.includes(item.id) ? 'bg-[#FFD600]' : 'bg-[#FFFFFF] opacity-0 group-hover:opacity-100 hover:bg-[#F5F5F0]'}`}
        >
          {selectedItemIds.includes(item.id) && <Check className="w-3 h-3 text-[#0A0A0A]" strokeWidth={4} />}
        </div>
        <div className="flex justify-between items-start mb-3 pl-8">
          <div className={`w-14 h-14 rounded-[12px] border-[2px] border-[#0A0A0A] flex items-center justify-center shadow-[3px_3px_0px_#0A0A0A] shrink-0 ${isLink ? getLinkBgColor(vi.url ?? "") : "bg-[#FFFFFF]"}`}>
            {isLink ? getLinkIcon(vi.url ?? "") : getFileIcon(file?.mime_type)}
          </div>
          
          <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-wrap justify-end pl-2">
             <button
               onClick={(e) => { e.stopPropagation(); isLink ? handleLinkOpen() : handleDownload(item.id, file?.filename, 'view') }}
               disabled={activeItemId === item.id}
               title={isLink ? "Open link" : "View file"}
               className="w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#0057FF] hover:text-[#FFFFFF] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
             >
               {isLink ? (ytVideoId ? <PlayCircle className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />) : <Eye className="w-4 h-4" />}
             </button>
             {!isLink && (
               <button
                 onClick={(e) => { e.stopPropagation(); handleDownload(item.id, file?.filename, 'download') }}
                 disabled={activeItemId === item.id}
                 title="Download"
                 className="w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#00C853] hover:text-[#FFFFFF] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
               >
                 {activeItemId === item.id ? <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" /> : <Download className="w-4 h-4" />}
               </button>
             )}
             {canOrganize && (
                <button
                   onClick={(e) => { e.stopPropagation(); setOrganizeItem(item); }}
                   title="Organize Tags & Folders"
                   className="w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#FFD600] text-[#0A0A0A] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                   <Settings2 className="w-4 h-4" />
                </button>
             )}
             {canDelete && (
                <button
                   onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item.id); }}
                   disabled={deleteMutation.isPending}
                   title="Remove from Community"
                   className="w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#FF3B30] hover:text-[#FFFFFF] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 text-[#FF3B30]"
                >
                  {deleteMutation.isPending && deleteMutation.variables === item.id ? <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" /> : <Trash2 className="w-4 h-4 border-current" />}
                </button>
             )}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <h3 className="font-heading font-bold text-[16px] text-[#0A0A0A] truncate" title={isLink ? vi.title : file?.filename}>
            {isLink ? vi.title : file?.filename}
          </h3>
          <div className="font-mono text-[11px] text-[#555550] mt-1 flex items-center flex-wrap gap-2">
            {!isLink ? <span>{formatBytes(file?.size_bytes)}</span> : <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3 text-[#555550] shrink-0" />{linkDomain}</span>}
            <span>•</span>
            <span>{new Date(item.created_at).toLocaleDateString()}</span>
          </div>
          
          {/* Tags Bar */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2 pb-1">
               {item.tags.map((t: string) => (
                 <span key={t} className="px-2 py-0.5 rounded-[100px] border-[1.2px] border-[#0A0A0A] bg-[#F5F5F0] font-mono text-[10px] font-bold text-[#0A0A0A] whitespace-nowrap">
                   #{t}
                 </span>
               ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 pt-3 border-t-[2px] border-[#0A0A0A] border-dashed shrink-0">
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
  }

  if (isLoading && folderStack.length === 0) {
    return (
      <div className="w-full flex justify-center py-20">
         <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A]" />
      </div>
    )
  }

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
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {canOrganize && (
                 <button
                   onClick={() => setIsCreateFolderModal(true)}
                   className="p-2.5 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#F5F5F0] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all hidden sm:flex items-center justify-center cursor-pointer"
                   title="New Folder"
                 >
                   <FolderPlus className="w-5 h-5" />
                 </button>
              )}
              <button
                onClick={() => setIsAddLinkModalOpen(true)}
                className="px-5 py-2.5 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#0057FF] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all font-heading font-bold text-[14px] text-white flex items-center gap-2 justify-center cursor-pointer"
              >
                <Link2 className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Add Link</span>
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-5 py-2.5 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all font-heading font-bold text-[14px] text-[#0A0A0A] flex items-center gap-2 justify-center cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="px-5 py-2.5 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#FFD600] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all font-heading font-bold text-[14px] text-[#0A0A0A] flex items-center gap-2 justify-center"
              >
                <FolderSync className="w-4 h-4" />
                <span className="hidden sm:inline">Publish from Vault</span>
              </button>
            </div>
         )}
       </div>

       {/* Toolbar: Breadcrumbs + Search */}
       <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#E8E8E0] p-3 rounded-[1rem] border-[2px] border-[#0A0A0A]">
          <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar px-1">
            <button
               onClick={() => setFolderStack([])}
               className={`font-heading font-bold text-[14px] whitespace-nowrap hover:underline ${folderStack.length === 0 ? 'text-[#0057FF]' : 'text-[#0A0A0A]'}`}
            >
               Root
            </button>
            {folderStack.map((f, i) => (
              <div key={f.id} className="flex items-center gap-2 shrink-0">
                <ChevronRight className="w-4 h-4 text-[#555550]" />
                <button
                   onClick={() => setFolderStack(folderStack.slice(0, i + 1))}
                   className={`font-heading font-bold text-[14px] whitespace-nowrap hover:underline ${i === folderStack.length - 1 ? 'text-[#0057FF]' : 'text-[#0A0A0A]'}`}
                >
                   {f.name}
                </button>
              </div>
            ))}
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#555550]" />
            <Input
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search metadata or tags..."
               className="pl-9 bg-[#FFFFFF] border-[2px] border-[#0A0A0A] rounded-[0.75rem] shadow-[2px_2px_0px_#0A0A0A] h-10 font-sans text-[14px]"
            />
          </div>
       </div>

       {/* Empty State */}
       {filteredFolders.length === 0 && filteredItems.length === 0 && !isLoading ? (
          <div className="bg-[#F5F5F0] border-[2px] border-[#0A0A0A] rounded-[1.5rem] border-dashed p-12 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-[16px] bg-[#FFFFFF] border-[2px] border-[#0A0A0A] flex items-center justify-center mb-4 shadow-[4px_4px_0px_#0A0A0A]">
                <FolderSync className="w-8 h-8 text-[#0A0A0A] opacity-50" />
             </div>
             <h3 className="font-heading font-bold text-[20px] text-[#0A0A0A] mb-2">{searchQuery ? 'No results found' : 'Folder is Empty'}</h3>
             <p className="font-sans text-[15px] text-[#555550] max-w-md mx-auto">{searchQuery ? 'Try matching against different tags or filenames.' : 'Upload natively, publish from personal vaults, or create sub-folders here.'}</p>
          </div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
             {/* Render Folders First */}
             {filteredFolders.map((f: any) => (
                <CommunityFolderCard
                   key={f.id}
                   folder={f}
                   communityId={id}
                   canOrganize={canOrganize}
                   folderStack={folderStack}
                   setFolderStack={setFolderStack}
                   setSearchQuery={setSearchQuery}
                   isSelected={selectedFolderIds.includes(f.id)}
                   onToggle={toggleFolder}
                />
             ))}

             {/* Render Items */}
             {filteredItems.map(renderItemCard)}
          </div>
       )}

       {/* All Files View */}
       {!searchQuery && vaultItems.length > 0 && (
          <div className="mt-12 pt-8 border-t-[2px] border-[#0A0A0A] border-dashed">
            <h3 className="font-heading font-bold text-[20px] text-[#0A0A0A] mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-[8px] border-[2px] border-[#0A0A0A] bg-[#00C853] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
                <File className="w-4 h-4 text-white" />
              </div>
              All Files
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vaultItems.map(renderItemCard)}
            </div>
          </div>
       )}

       <PublishFromVaultModal 
           isOpen={isPublishModalOpen} 
           onClose={() => setIsPublishModalOpen(false)} 
           communityId={id} 
       />

       <CommunityUploadModal
           isOpen={isUploadModalOpen}
           onClose={() => setIsUploadModalOpen(false)}
           communityId={id}
       />

       <CommunityAddLinkModal
           isOpen={isAddLinkModalOpen}
           onClose={() => setIsAddLinkModalOpen(false)}
           communityId={id}
       />

       <CreateFolderModal
           isOpen={isCreateFolderModal}
           onClose={() => setIsCreateFolderModal(false)}
           communityId={id}
           currentFolderId={currentFolderId}
       />
       
       {organizeItem && (
          <CommunityOrganizeModal
             isOpen={!!organizeItem}
             onClose={() => setOrganizeItem(null)}
             communityId={id}
             item={organizeItem}
             folders={folders}
          />
       )}

      {/* Bulk Action Bar */}
      {(selectedItemIds.length > 0 || selectedFolderIds.length > 0) && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] p-4 px-6 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-200">
          <div className="font-heading font-extrabold text-[16px] text-[#0A0A0A]">
            {selectedItemIds.length + selectedFolderIds.length} Selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearSelection}
              className="font-heading font-bold text-[14px] text-[#555550] hover:text-[#0A0A0A] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF3B30] text-[#FFFFFF] rounded-[1rem] border-[2px] border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all font-heading font-bold text-[14px]"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Community Folder Card ────────────────────────────────────────────────────
function CommunityFolderCard({
  folder,
  communityId,
  canOrganize,
  folderStack,
  setFolderStack,
  setSearchQuery,
}: {
  folder: any
  communityId: string
  canOrganize: boolean
  folderStack: { id: string; name: string }[]
  setFolderStack: (s: { id: string; name: string }[]) => void
  setSearchQuery: (q: string) => void
  isSelected: boolean
  onToggle: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Delete folder "${folder.name}"? Its contents will be moved to the parent folder.`)) return
    setIsDeleting(true)
    const toastId = toast.loading("Deleting folder...")
    try {
      const res = await fetch(`/api/communities/${communityId}/vault/folders?folderId=${folder.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete folder")
      }
      toast.success("Folder deleted", { id: toastId })
      queryClient.invalidateQueries({ queryKey: ["communityVaultFolders", communityId] })
      queryClient.invalidateQueries({ queryKey: ["communityVault", communityId] })
    } catch (err: any) {
      toast.error(err.message || "Failed to delete folder", { id: toastId })
      setIsDeleting(false)
    }
  }

  return (
    <div
      onClick={() => {
        setSearchQuery("")
        setFolderStack([...folderStack, { id: folder.id, name: folder.name }])
      }}
      className="group relative bg-[#FFFFFF] border-[2px] border-[#0A0A0A] rounded-[1.5rem] p-5 shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-150 flex items-center gap-4 cursor-pointer"
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(folder.id) }} 
        className={`w-5 h-5 rounded-[6px] border-[2px] border-[#0A0A0A] flex items-center justify-center cursor-pointer transition-all shrink-0 ${isSelected ? 'bg-[#FFD600]' : 'bg-[#FFFFFF] opacity-0 group-hover:opacity-100 hover:bg-[#F5F5F0]'}`}
      >
        {isSelected && <Check className="w-3 h-3 text-[#0A0A0A]" strokeWidth={4} />}
      </div>
      <div className="w-12 h-12 bg-[#FFD600] rounded-[10px] border-[2px] border-[#0A0A0A] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] group-hover:bg-[#FFFFFF] transition-colors shrink-0">
        <Folder className="w-6 h-6 text-[#0A0A0A] fill-current" />
      </div>
      <h3 className="font-heading font-bold text-[16px] text-[#0A0A0A] truncate flex-1">{folder.name}</h3>

      {canOrganize && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isDeleting}
              onClick={(e) => e.stopPropagation()}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#F5F5F0] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none outline-none focus:outline-none shrink-0"
            >
              {isDeleting
                ? <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                : <MoreVertical className="w-4 h-4 text-[#0A0A0A]" />
              }
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 bg-[#FFFFFF] border-[2px] border-[#0A0A0A] rounded-[1rem] shadow-[4px_4px_0px_#0A0A0A] p-1.5 z-50"
          >
            <DropdownMenuSeparator className="bg-[#E8E8E0] my-1" />
            <DropdownMenuItem
              onClick={handleDelete}
              className="flex items-center gap-2 cursor-pointer font-sans text-[13px] font-medium text-[#FF3B30] focus:bg-[#FF3B30] focus:text-white px-2 py-1.5 rounded-[0.5rem] outline-none transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [tagInput, setTagInput] = useState("")

  const addTag = () => {
    const t = tagInput.trim().replace(/^#+/, "")
    if (t && !tags.includes(t)) onChange([...tags, t])
    setTagInput("")
  }

  return (
    <div className="space-y-2">
      <Label className="font-mono text-[12px] text-[#555550] uppercase tracking-wider flex items-center gap-1">
        <Tag className="w-3.5 h-3.5" /> Tags
      </Label>
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
          placeholder="Type a tag and press Enter…"
          className="border-[2px] border-[#0A0A0A] rounded-[0.75rem] font-sans text-[14px] flex-1"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-3 py-2 rounded-[0.75rem] border-[2px] border-[#0A0A0A] bg-[#F5F5F0] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
        >
          <Plus className="w-4 h-4 text-[#0A0A0A]" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-[100px] border-[1.5px] border-[#0A0A0A] bg-[#FFD600] shadow-[2px_2px_0px_#0A0A0A] font-mono text-[12px] font-medium text-[#0A0A0A]"
            >
              #{t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="ml-1 hover:opacity-60"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateFolderModal({ isOpen, onClose, communityId, currentFolderId }: { isOpen: boolean, onClose: () => void, communityId: string, currentFolderId: string | null }) {
   const [name, setName] = useState("")
   const queryClient = useQueryClient()
   const mutation = useMutation({
      mutationFn: async () => {
         const res = await fetch(`/api/communities/${communityId}/vault/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parent_id: currentFolderId })
         })
         if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to create folder")
         }
         return res.json()
      },
      onSuccess: () => {
         toast.success("Folder Created")
         queryClient.invalidateQueries({ queryKey: ["communityVaultFolders", communityId] })
         handleClose()
      },
      onError: (err: any) => toast.error(err.message)
   })
   
   const handleClose = () => { setName(""); onClose() }

   return (
      <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="font-heading font-extrabold text-[20px] text-[#0A0A0A]">New Folder</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
           <div className="space-y-2">
              <Label className="font-mono text-[12px] text-[#555550] uppercase">Folder Name</Label>
              <Input
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 autoFocus
                 className="border-[2px] border-[#0A0A0A] rounded-[1rem] shadow-[2px_2px_0_#0A0A0A]"
                 placeholder="e.g. Past Papers"
              />
           </div>
        </div>
        <DialogFooter>
           <button onClick={handleClose} className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] font-heading font-bold text-[14px] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">Cancel</button>
           <button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending} className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#0057FF] text-white shadow-[3px_3px_0px_#0A0A0A] font-heading font-bold text-[14px] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all disabled:opacity-50">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
           </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
   )
}

function CommunityOrganizeModal({ isOpen, onClose, communityId, item, folders }: { isOpen: boolean, onClose: () => void, communityId: string, item: any, folders: any[] }) {
   const [tags, setTags] = useState<string[]>(item?.tags || [])
   const [folderId, setFolderId] = useState<string>(item?.folder_id || "null")
   const queryClient = useQueryClient()

   const mutation = useMutation({
      mutationFn: async () => {
         const res = await fetch(`/api/communities/${communityId}/vault/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags, folder_id: folderId })
         })
         if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to update item")
         }
         return res.json()
      },
      onSuccess: () => {
         toast.success("Changes Saved")
         queryClient.invalidateQueries({ queryKey: ["communityVault", communityId] })
         onClose()
      },
      onError: (err: any) => toast.error(err.message)
   })
   
   return (
      <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] max-w-sm p-6 overflow-visible">
        <DialogHeader>
          <DialogTitle className="font-heading font-extrabold text-[20px] text-[#0A0A0A] flex items-center gap-2">
             <Settings2 className="w-5 h-5 text-[#0057FF]" /> Organize
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-6">
           <div className="space-y-2">
              <Label className="font-mono text-[12px] text-[#555550] uppercase">Destination Folder</Label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full border-[2px] border-[#0A0A0A] rounded-[1rem] shadow-[2px_2px_0_#0A0A0A] h-10 px-3 bg-[#FFFFFF] font-sans text-[14px]"
              >
                 <option value="null">Root (No Folder)</option>
                 {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                 ))}
              </select>
           </div>
           <TagEditor tags={tags} onChange={setTags} />
        </div>
        <DialogFooter className="mt-2 text-right">
           <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFD600] text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] font-heading font-bold text-[14px] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2 w-full">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
           </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
   )
}

type UploadItem = {
  id: string;
  file: File;
  customName: string;
  tags: string[];
  relativePath: string;
}

function CommunityUploadModal({ isOpen, onClose, communityId, currentFolderId }: { isOpen: boolean, onClose: () => void, communityId: string, currentFolderId: string | null }) {
  const [isUploading, setIsUploading] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])
  const [globalTags, setGlobalTags] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems = Array.from(e.target.files).map(f => ({
        id: Math.random().toString(36).substring(7),
        file: f,
        customName: f.name,
        tags: [],
        relativePath: f.webkitRelativePath || ""
      }))
      setItems(prev => [...prev, ...newItems])
    }
    // reset input so the same files can be selected again if needed
    e.target.value = ""
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
  const updateItem = (id: string, updates: Partial<UploadItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  const handleSubmit = async () => {
    if (items.length === 0) return
    setIsUploading(true)
    const toastId = toast.loading(`Uploading and securing ${items.length} file(s)...`)

    try {
      const folderMap = new Map<string, string>()

      const getFolderId = async (pathParts: string[], baseFolderId: string | null) => {
        let currentParent = baseFolderId
        let currentPath = ""
        
        for (const part of pathParts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part
          if (folderMap.has(currentPath)) {
            currentParent = folderMap.get(currentPath)!
          } else {
            const res = await fetch(`/api/communities/${communityId}/vault/folders`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: part, parent_id: currentParent })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || `Failed to create folder ${part}`)
            const newFolderId = json.data.id
            folderMap.set(currentPath, newFolderId)
            currentParent = newFolderId
          }
        }
        return currentParent
      }

      // Sequential upload to prevent overwhelming the server
      for (const item of items) {
        let targetFolderId = currentFolderId
        
        if (item.relativePath) {
          const parts = item.relativePath.split('/')
          const folderParts = parts.slice(0, -1)
          if (folderParts.length > 0) {
            targetFolderId = await getFolderId(folderParts, currentFolderId)
          }
        }

        const formData = new FormData()
        // Provide the basename as the 3rd argument to prevent FormData parsing errors with webkitRelativePath
        const finalName = item.customName.trim() || item.file.name
        formData.append("file", item.file, finalName)
        
        const combinedTags = Array.from(new Set([...globalTags, ...item.tags]))
        if (combinedTags.length > 0) formData.append("tags", JSON.stringify(combinedTags))
        
        const res = await fetch("/api/vault/upload", { method: "POST", body: formData })
        const result = await res.json()
        if (!res.ok) {
          throw new Error(result.error || "Upload failed")
        }

        // Share to community
        const postRes = await fetch(`/api/communities/${communityId}/vault`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            vault_item_id: result.vaultItem.id,
            folder_id: targetFolderId
          })
        })

        if (!postRes.ok) {
          const d = await postRes.json()
          throw new Error(d.error || "Failed to publish into community scope")
        }
      }

      toast.success("Files uploaded and shared!", { id: toastId })
      
      // Real-time grid invalidate & auto-closure
      queryClient.invalidateQueries({ queryKey: ["communityVaultFolders", communityId] })
      queryClient.invalidateQueries({ queryKey: ["communityVault", communityId] })
      handleClose()
    } catch (err: any) {
      toast.error(err.message || "Network error during upload.", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setItems([])
    setGlobalTags([])
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (folderInputRef.current) folderInputRef.current.value = ""
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] max-w-lg p-8 max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-heading font-extrabold text-[22px] text-[#0A0A0A]">
            Upload & Share
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex-1 overflow-hidden flex flex-col">
          {/* Drop zones */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div
              className="border-[2px] border-dashed border-[#0A0A0A] rounded-[1.25rem] bg-[#F5F5F0] p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#E8E8E0] transition-colors text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-8 h-8 bg-[#0057FF] rounded-[8px] border-[2px] border-[#0A0A0A] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
                <Upload className="w-4 h-4 text-[#FFFFFF]" />
              </div>
              <p className="font-heading font-bold text-[13px] text-[#0A0A0A]">Upload Files</p>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
            </div>

            <div
              className="border-[2px] border-dashed border-[#0A0A0A] rounded-[1.25rem] bg-[#F5F5F0] p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#E8E8E0] transition-colors text-center"
              onClick={() => folderInputRef.current?.click()}
            >
              <div className="w-8 h-8 bg-[#0057FF] rounded-[8px] border-[2px] border-[#0A0A0A] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
                <FolderPlus className="w-4 h-4 text-[#FFFFFF]" />
              </div>
              <p className="font-heading font-bold text-[13px] text-[#0A0A0A]">Upload Folder</p>
              {/* @ts-expect-error - webkitdirectory is a non-standard attribute but widely supported */}
              <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={handleFileSelect} />
            </div>
          </div>

          <div className="mt-4 shrink-0">
            <Label className="font-mono text-[11px] text-[#555550] uppercase tracking-wider mb-2 block">
              Global Tags (Applies to all)
            </Label>
            <TagEditor tags={globalTags} onChange={setGlobalTags} />
          </div>

          {items.length > 0 && (
            <div className="mt-4 flex-1 overflow-y-auto pr-2 border-t-[2px] border-[#E8E8E0] pt-4 min-h-[150px]">
              <div className="flex justify-between items-center mb-3">
                <span className="font-heading font-bold text-[14px]">Selected ({items.length})</span>
                <button onClick={() => setItems([])} className="text-[12px] font-bold text-[#FF3B30] hover:underline">Clear All</button>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="bg-[#F5F5F0] border-[2px] border-[#0A0A0A] rounded-[1rem] p-3 flex flex-col gap-2 relative group">
                    <button onClick={() => removeItem(item.id)} className="absolute top-3 right-3 text-[#555550] hover:text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[#F5F5F0] rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] flex items-center justify-center shrink-0">
                         <File className="w-4 h-4 text-[#0A0A0A]" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <input 
                           value={item.customName}
                           onChange={(e) => updateItem(item.id, { customName: e.target.value })}
                           className="font-heading font-bold text-[13px] text-[#0A0A0A] bg-transparent border-b border-transparent hover:border-[#0A0A0A] focus:border-[#0A0A0A] outline-none w-full truncate pb-0.5"
                           placeholder="Filename..."
                        />
                        <p className="font-mono text-[10px] text-[#555550] mt-0.5">{formatBytes(item.file.size)}</p>
                      </div>
                    </div>
                    <div className="pt-1">
                       <TagEditor tags={item.tags} onChange={(tags) => updateItem(item.id, { tags })} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 gap-3 shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || isUploading}
            className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#00C853] text-[#FFFFFF] shadow-[4px_4px_0px_#0A0A0A] font-heading font-bold text-[14px] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? "Uploading…" : "Upload & Share"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function CommunityAddLinkModal({ isOpen, onClose, communityId, currentFolderId }: { isOpen: boolean, onClose: () => void, communityId: string, currentFolderId: string | null }) {
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [linkTags, setLinkTags] = useState<string[]>([])
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({})
  const queryClient = useQueryClient()

  const validate = () => {
    const e: { title?: string; url?: string } = {}
    if (!title.trim()) e.title = "Title is required"
    if (!url.trim()) {
      e.url = "URL is required"
    } else {
      try { new URL(url.trim()) } catch { e.url = "Enter a valid URL (include https://)" }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSaving(true)
    const toastId = toast.loading("Saving link to Vault...")
    try {
      const res = await fetch("/api/vault/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          tags: linkTags,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save link")

      const postRes = await fetch(`/api/communities/${communityId}/vault`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          vault_item_id: data.data.id,
          folder_id: currentFolderId
        })
      })
      if (!postRes.ok) {
         const d = await postRes.json()
         throw new Error(d.error || "Failed to publish into community scope")
      }

      toast.success("Link saved and shared!", { id: toastId })
      queryClient.invalidateQueries({ queryKey: ["communityVault", communityId] })
      handleClose()
    } catch (err: any) {
      toast.error(err.message || "Could not save link", { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setUrl("")
    setLinkTags([])
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="font-heading font-extrabold text-[22px] text-[#0A0A0A] flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] border-[2px] border-[#0A0A0A] bg-[#0057FF] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            Add External Link
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-3">
          <div className="space-y-2">
            <Label className="font-mono text-[12px] text-[#555550] uppercase tracking-wider">Title</Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: undefined })) }}
              placeholder="e.g. React Docs, Lecture Recording…"
              autoFocus
              className="border-[2px] border-[#0A0A0A] rounded-[0.75rem] font-sans text-[14px]"
            />
            {errors.title && <p className="font-sans text-[12px] text-[#FF3B30]">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[12px] text-[#555550] uppercase tracking-wider">URL</Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setErrors(prev => ({ ...prev, url: undefined })) }}
              placeholder="https://example.com"
              className="border-[2px] border-[#0A0A0A] rounded-[0.75rem] font-sans text-[14px]"
            />
            {errors.url && <p className="font-sans text-[12px] text-[#FF3B30]">{errors.url}</p>}
          </div>

          <TagEditor tags={linkTags} onChange={setLinkTags} />

          <DialogFooter className="gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#0057FF] shadow-[4px_4px_0px_#0A0A0A] font-heading font-bold text-[14px] text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {isSaving ? "Saving…" : "Save Link"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
