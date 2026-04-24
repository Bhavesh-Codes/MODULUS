"use client"

import { useState, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Upload,
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  Loader2,
  Sparkles,
  FileText,
  Image as ImageIcon,
  File,
  FileCode,
  Video,
  Music,
  Archive,
  Trash2,
  Download,
  Eye,
  Pencil,
  Search,
  X,
  Plus,
  Tag,
  FolderInput,
  Home,
  MoreVertical,
  Link2,
  ExternalLink,
  PlayCircle,
  Check,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────
interface VaultFolder {
  id: string
  name: string
  parent_id: string | null
}

interface VaultFile {
  id: string
  filename: string
  mime_type: string
  size_bytes: number
}

interface VaultItem {
  id: string
  created_at: string
  item_type?: string | null
  title?: string | null
  url?: string | null
  tags: string[] | null
  folder_id: string | null
  files: VaultFile | null
}

interface EditFormValues {
  filename: string
}

interface NewFolderFormValues {
  name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FOLDER_COLORS = [
  "#FFD600", "#0057FF", "#FF3CAC", "#00C853", "#FF6B00", "#FF3B30",
]

const getFolderColor = (id: string) =>
  FOLDER_COLORS[
    id.charCodeAt(0) % FOLDER_COLORS.length
  ]

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
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

const formatDate = (isoString: string) =>
  new Date(isoString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })

// Build a breadcrumb trail from flat folder list + current id
function buildBreadcrumb(
  folders: VaultFolder[],
  currentId: string | null
): VaultFolder[] {
  if (!currentId) return []
  const map = new Map(folders.map((f) => [f.id, f]))
  const trail: VaultFolder[] = []
  let node = map.get(currentId)
  while (node) {
    trail.unshift(node)
    node = node.parent_id ? map.get(node.parent_id) : undefined
  }
  return trail
}

// ─── Shared Tag Editor ────────────────────────────────────────────────────────
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

// ─── New Folder Modal ─────────────────────────────────────────────────────────
function NewFolderModal({
  isOpen,
  onClose,
  onCreated,
  parentId,
}: {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
  parentId: string | null
}) {
  const [isCreating, setIsCreating] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewFolderFormValues>({
    defaultValues: { name: "" },
  })

  const onSubmit = async (values: NewFolderFormValues) => {
    setIsCreating(true)
    try {
      const res = await fetch("/api/vault/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name.trim(), parent_id: parentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create folder")
      toast.success(`Folder "${values.name.trim()}" created!`)
      onCreated()
      reset()
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Could not create folder")
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] max-w-sm p-8">
        <DialogHeader>
          <DialogTitle className="font-heading font-extrabold text-[22px] text-[#0A0A0A] flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] border-[2px] border-[#0A0A0A] bg-[#FFD600] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
              <FolderPlus className="w-4 h-4 text-[#0A0A0A]" />
            </div>
            New Folder
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-3">
          <div className="space-y-2">
            <Label className="font-mono text-[12px] text-[#555550] uppercase tracking-wider">
              Folder Name
            </Label>
            <Input
              {...register("name", { required: "A folder name is required" })}
              autoFocus
              placeholder="e.g. Semester 1, Projects…"
              className="border-[2px] border-[#0A0A0A] rounded-[0.75rem] font-sans text-[14px]"
            />
            {errors.name && (
              <p className="font-sans text-[12px] text-[#FF3B30]">{errors.name.message}</p>
            )}
          </div>

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
              disabled={isCreating}
              className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFD600] shadow-[4px_4px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
              {isCreating ? "Creating…" : "Create Folder"}
            </button>
          </DialogFooter>
        </form>
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

function UploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  currentFolderId,
}: {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
  currentFolderId: string | null
}) {
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
    const toastId = toast.loading(`Uploading ${items.length} file(s)…`)

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
            const res = await fetch("/api/vault/folders", {
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

      // Sequential upload to prevent overwhelming the Next.js body parser with massive folder uploads
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
        if (targetFolderId) formData.append("folder_id", targetFolderId)
        
        const res = await fetch("/api/vault/upload", { method: "POST", body: formData })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Upload failed")
        }
      }
      toast.success("Files secured in Vault!", { id: toastId })
      onUploadComplete()
      queryClient.invalidateQueries({ queryKey: ["vaultFolders"] })
      handleClose()
    } catch (e: any) {
      toast.error(e.message || "Upload failed.", { id: toastId })
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
            Upload to Vault
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex-1 overflow-hidden flex flex-col">
          {/* Drop zones */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div
              className="border-[2px] border-dashed border-[#0A0A0A] rounded-[1.25rem] bg-[#F5F5F0] p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#E8E8E0] transition-colors text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-8 h-8 bg-[#FFD600] rounded-[8px] border-[2px] border-[#0A0A0A] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
                <Upload className="w-4 h-4 text-[#0A0A0A]" />
              </div>
              <p className="font-heading font-bold text-[13px] text-[#0A0A0A]">Upload Files</p>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
            </div>

            <div
              className="border-[2px] border-dashed border-[#0A0A0A] rounded-[1.25rem] bg-[#F5F5F0] p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#E8E8E0] transition-colors text-center"
              onClick={() => folderInputRef.current?.click()}
            >
              <div className="w-8 h-8 bg-[#FFD600] rounded-[8px] border-[2px] border-[#0A0A0A] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
                <FolderPlus className="w-4 h-4 text-[#0A0A0A]" />
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
            className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFD600] shadow-[4px_4px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? "Uploading…" : "Upload"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add Link Modal ───────────────────────────────────────────────────────────
function AddLinkModal({
  isOpen,
  onClose,
  onAdded,
  currentFolderId,
}: {
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
  currentFolderId: string | null
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [linkTags, setLinkTags] = useState<string[]>([])
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({})

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
    try {
      const res = await fetch("/api/vault/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          tags: linkTags,
          folder_id: currentFolderId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save link")
      toast.success("Link saved to Vault!")
      onAdded()
      handleClose()
    } catch (err: any) {
      toast.error(err.message || "Could not save link")
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
          {/* Title */}
          <div className="space-y-2">
            <Label className="font-mono text-[12px] text-[#555550] uppercase tracking-wider">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: undefined })) }}
              placeholder="e.g. React Docs, Lecture Recording…"
              autoFocus
              className="border-[2px] border-[#0A0A0A] rounded-[0.75rem] font-sans text-[14px]"
            />
            {errors.title && (
              <p className="font-sans text-[12px] text-[#FF3B30]">{errors.title}</p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label className="font-mono text-[12px] text-[#555550] uppercase tracking-wider">
              URL
            </Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setErrors(prev => ({ ...prev, url: undefined })) }}
              placeholder="https://example.com"
              className="border-[2px] border-[#0A0A0A] rounded-[0.75rem] font-sans text-[14px]"
            />
            {errors.url && (
              <p className="font-sans text-[12px] text-[#FF3B30]">{errors.url}</p>
            )}
          </div>

          {/* Tags */}
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

// ─── Edit Modal ───────────────────────────────────────────────────────────────
// key={item.id} on the wrapper in VaultPage guarantees fresh mount per file
function EditModal({
  item,
  onClose,
  onSaved,
}: {
  item: VaultItem
  onClose: () => void
  onSaved: () => void
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [tags, setTags] = useState<string[]>(item.tags ?? [])

  const { register, handleSubmit, formState: { errors } } = useForm<EditFormValues>({
    defaultValues: { filename: item.files?.filename ?? "" },
  })

  const onSubmit = async (values: EditFormValues) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/vault/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: values.filename.trim(), tags }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Update failed")
      toast.success("File updated successfully!")
      onSaved()
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Update failed")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DialogContent className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] max-w-md p-8">
      <DialogHeader>
        <DialogTitle className="font-heading font-extrabold text-[22px] text-[#0A0A0A]">
          Edit File
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
        <div className="space-y-2">
          <Label className="font-mono text-[12px] text-[#555550] uppercase tracking-wider">
            Filename
          </Label>
          <Input
            {...register("filename", { required: "Filename is required" })}
            className="border-[2px] border-[#0A0A0A] rounded-[0.75rem] font-sans text-[14px]"
          />
          {errors.filename && (
            <p className="font-sans text-[12px] text-[#FF3B30]">{errors.filename.message}</p>
          )}
        </div>
        <TagEditor tags={tags} onChange={setTags} />
        <DialogFooter className="pt-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFD600] shadow-[4px_4px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// ─── Move Modal ───────────────────────────────────────────────────────────────
function MoveModal({
  isOpen,
  onClose,
  onMoved,
  folders,
  currentFolderId,
  itemType,
  itemId,
}: {
  isOpen: boolean
  onClose: () => void
  onMoved: () => void
  folders: VaultFolder[]
  currentFolderId: string | null
  itemType: "file" | "folder" | null
  itemId: string | null
}) {
  const [isMoving, setIsMoving] = useState(false)

  if (!isOpen || !itemId || !itemType) return null

  // Prevent a folder from moving into itself or its own children
  const getSubTreeIds = (id: string, all: VaultFolder[]): string[] => {
    const children = all.filter(f => f.parent_id === id).map(f => f.id)
    return [id, ...children.flatMap(cid => getSubTreeIds(cid, all))]
  }
  const invalidTargets = itemType === "folder" ? getSubTreeIds(itemId, folders) : []

  // Ensure root isn't invalid unless item is literally the root folder (impossible)
  const validFolders = folders.filter(f => !invalidTargets.includes(f.id))

  const handleMove = async (targetFolderId: string | null) => {
    setIsMoving(true)
    try {
      const endpoint = itemType === "folder" ? `/api/vault/folders/${itemId}` : `/api/vault/items/${itemId}`
      const body = itemType === "folder" 
        ? { parent_id: targetFolderId }
        : { folder_id: targetFolderId }

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to move")
      }
      toast.success("Moved successfully!")
      onMoved()
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Failed to move item")
    } finally {
      setIsMoving(false)
    }
  }

  // Recursive render for folder picker
  const renderPickerTree = (parentId: string | null, depth: number = 0) => {
    const children = validFolders.filter(f => f.parent_id === parentId)
    if (children.length === 0) return null
    return (
      <ul className="space-y-1">
        {children.map(folder => (
          <li key={folder.id}>
            <button
              disabled={isMoving}
              onClick={() => handleMove(folder.id)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-[8px] border-[1.5px] border-transparent hover:border-[#0A0A0A] hover:bg-[#F5F5F0] hover:shadow-[2px_2px_0px_#0A0A0A] transition-all text-left font-sans text-[13px] font-medium text-[#0A0A0A] group"
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              <Folder className="w-4 h-4 text-[#555550] group-hover:text-[#FFD600] group-hover:fill-[#FFD600] transition-colors" />
              <span className="truncate">{folder.name}</span>
            </button>
            {renderPickerTree(folder.id, depth + 1)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] max-w-sm p-6 overflow-hidden flex flex-col max-h-[80vh]">
        <DialogHeader className="shrink-0 mb-4">
          <DialogTitle className="font-heading font-extrabold text-[20px] text-[#0A0A0A] flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] border-[2px] border-[#0A0A0A] bg-[#0057FF] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A]">
              <FolderInput className="w-4 h-4 text-white" />
            </div>
            Move To...
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 pr-2">
          {/* Root option */}
          <button
            disabled={isMoving}
            onClick={() => handleMove(null)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-[8px] border-[1.5px] border-transparent hover:border-[#0A0A0A] hover:bg-[#F5F5F0] hover:shadow-[2px_2px_0px_#0A0A0A] transition-all text-left font-sans text-[13px] font-medium text-[#0A0A0A] group"
          >
            <Home className="w-4 h-4 text-[#555550]" />
            <span className="font-bold">Vault Root (All Files)</span>
          </button>
          
          <div className="my-2 h-[2px] w-full bg-[#E8E8E0]" />
          
          {validFolders.length > 0 ? (
            renderPickerTree(null)
          ) : (
             <p className="font-mono text-[11px] text-[#999990] text-center pt-4">No nested folders available</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Folder Card ──────────────────────────────────────────────────────────────
function FolderCard({
  folder,
  onClick,
  onRename,
  onMove,
  onDelete,
  isDropTarget = false,
  isSelected = false,
  onToggle,
}: {
  folder: VaultFolder
  onClick: () => void
  onRename: (folder: VaultFolder) => void
  onMove: (folder: VaultFolder) => void
  onDelete: (folder: VaultFolder) => void
  isDropTarget?: boolean
  isSelected?: boolean
  onToggle?: (id: string) => void
}) {
  const color = getFolderColor(folder.id)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Permanently delete folder "${folder.name}" and move its contents to the parent folder?`)) return
    setIsDeleting(true)
    const toastId = toast.loading("Deleting folder...")
    try {
      const res = await fetch(`/api/vault/folders/${folder.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Folder deleted", { id: toastId })
      onDelete(folder)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete", { id: toastId })
      setIsDeleting(false)
    }
  }

  return (
    <motion.div
      layout
      data-drop-target={folder.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDropTarget ? 1.03 : 1,
        borderColor: isDropTarget ? "#FFD600" : "#0A0A0A",
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onClick={onClick}
      className={`group relative cursor-pointer bg-[#FFFFFF] border-[3px] rounded-[1.5rem] p-5 transition-all duration-150 select-none overflow-hidden ${
        isDropTarget
          ? "border-[#FFD600] bg-[#FFFBDE] shadow-[0px_0px_0px_4px_#FFD60066]"
          : "border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none"
      }`}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle?.(folder.id) }} 
        className={`absolute top-4 left-4 w-5 h-5 rounded-[6px] border-[2px] border-[#0A0A0A] flex items-center justify-center cursor-pointer transition-all z-20 ${isSelected ? 'bg-[#FFD600]' : 'bg-[#FFFFFF] opacity-0 group-hover:opacity-100 hover:bg-[#F5F5F0]'}`}
      >
        {isSelected && <Check className="w-3 h-3 text-[#0A0A0A]" strokeWidth={4} />}
      </div>
      <div className="flex items-center justify-between gap-3 mb-3 relative z-10 pl-8">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-12 h-12 rounded-[12px] border-[2px] border-[#0A0A0A] flex items-center justify-center shadow-[3px_3px_0px_#0A0A0A] transition-all group-hover:shadow-none group-hover:translate-x-[3px] group-hover:translate-y-[3px] shrink-0"
            style={{ backgroundColor: color }}
          >
            <Folder className="w-6 h-6 text-[#0A0A0A]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="font-heading font-bold text-[15px] text-[#0A0A0A] truncate"
              title={folder.name}
            >
              {folder.name}
            </h3>
          </div>
        </div>

        {/* Folder Action Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isDeleting}
              onClick={(e) => e.stopPropagation()}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#F5F5F0] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none outline-none focus:outline-none"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" /> : <MoreVertical className="w-4 h-4 text-[#0A0A0A]" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-[#FFFFFF] border-[2px] border-[#0A0A0A] rounded-[1rem] shadow-[4px_4px_0px_#0A0A0A] p-1.5 z-50"
          >
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(folder); }} className="flex items-center gap-2 cursor-pointer font-sans text-[13px] font-medium focus:bg-[#E8E8E0] px-2 py-1.5 rounded-[0.5rem] outline-none">
              <Pencil className="w-4 h-4 text-[#00C853]" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(folder); }} className="flex items-center gap-2 cursor-pointer font-sans text-[13px] font-medium focus:bg-[#E8E8E0] px-2 py-1.5 rounded-[0.5rem] outline-none">
              <FolderInput className="w-4 h-4 text-[#FF6B00]" /> Move
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E8E8E0] my-1" />
            <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-2 cursor-pointer font-sans text-[13px] font-medium text-[#FF3B30] focus:bg-[#FF3B30] focus:text-white px-2 py-1.5 rounded-[0.5rem] outline-none transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="h-[2px] rounded-full mt-2" style={{ backgroundColor: color }} />
    </motion.div>
  )
}

// ─── Link helpers ────────────────────────────────────────────────────────────
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

// ─── File Card ────────────────────────────────────────────────────────────────
function FileCard({
  item,
  folders,
  onDelete,
  onEdit,
  onMove,
  onDropFile,
  onDragOver,
  isSelected = false,
  onToggle,
}: {
  item: VaultItem
  folders: VaultFolder[]
  onDelete: () => void
  onEdit: (item: VaultItem) => void
  onMove: (item: VaultItem) => void
  onDropFile: (fileItemId: string, targetFolderId: string | null) => void
  onDragOver: (folderId: string | null) => void
  isSelected?: boolean
  onToggle?: (id: string) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isViewing, setIsViewing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUrl = async (action: "view" | "download") => {
    const res = await fetch(`/api/vault/items/${item.id}/download?action=${action}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Failed to get link")
    return data.url as string
  }

  const handleView = async () => {
    setIsViewing(true)
    try {
      window.open(await fetchUrl("view"), "_blank")
    } catch (e: any) {
      toast.error(e.message || "Could not open file")
    } finally {
      setIsViewing(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const url = await fetchUrl("download")
      const a = document.createElement("a")
      a.href = url
      a.download = item.files?.filename ?? "file"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e: any) {
      toast.error(e.message || "Download failed")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    const label = item.item_type === "link" ? "this link" : "this file"
    if (!window.confirm(`Permanently delete ${label} from your Vault?`)) return
    setIsDeleting(true)
    const toastId = toast.loading("Deleting file…")
    try {
      const res = await fetch(`/api/vault/items/${item.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Delete failed")
      }
      toast.success(item.item_type === "link" ? "Link deleted" : "File deleted", { id: toastId })
      onDelete()
    } catch (e: any) {
      toast.error(e.message || "Delete failed", { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  const [ytOpen, setYtOpen] = useState(false)

  const isLink = item.item_type === "link"
  const isBusy = isViewing || isDownloading || isDeleting
  const tags = item.tags ?? []
  const folderTrail = buildBreadcrumb(folders, item.folder_id)
  const pathString = folderTrail.length > 0
    ? folderTrail.map(f => f.name).join(" / ")
    : "Vault Root"
  const linkDomain = isLink && item.url ? getUrlDomain(item.url) : ""
  const ytVideoId = isLink && item.url ? getYouTubeVideoId(item.url) : null

  // ── Drag handling ──────────────────────────────────────────────────────────
  const getDropTarget = (x: number, y: number): string | null => {
    const els = document.elementsFromPoint(x, y)
    for (const el of els) {
      const target = (el as HTMLElement).closest("[data-drop-target]")
      if (target) return (target as HTMLElement).dataset.dropTarget ?? null
    }
    return null
  }

  const handleDrag = (_: any, info: { point: { x: number; y: number } }) => {
    const target = getDropTarget(info.point.x, info.point.y)
    onDragOver(target)
  }

  const handleDragEnd = (_: any, info: { point: { x: number; y: number } }) => {
    setIsDragging(false)
    const target = getDropTarget(info.point.x, info.point.y)
    onDragOver(null)
    if (target === null) return // dropped on empty space, snap back
    const folderId = target === "root" ? null : target
    onDropFile(item.id, folderId)
  }

  const handleLinkOpen = () => {
    if (ytVideoId) {
      setYtOpen(true)
    } else {
      window.open(item.url ?? "", "_blank", "noopener,noreferrer")
    }
  }

  return (
    <>
    {/* YouTube embed dialog */}
    {ytVideoId && (
      <Dialog open={ytOpen} onOpenChange={setYtOpen}>
        <DialogContent className="bg-[#0A0A0A] border-[3px] border-[#0A0A0A] rounded-[1.5rem] shadow-[8px_8px_0px_#FFD600] max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-4 pb-3">
            <DialogTitle className="font-heading font-extrabold text-[16px] text-white flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-[#FF3B30]" />
              {item.title || "YouTube Video"}
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              title={item.title ?? "YouTube Video"}
            />
          </div>
        </DialogContent>
      </Dialog>
    )}
    <motion.div
      layout
      drag
      dragSnapToOrigin
      dragElastic={0.12}
      dragTransition={{ bounceStiffness: 350, bounceDamping: 30 }}
      onDragStart={() => setIsDragging(true)}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      whileDrag={{ scale: 1.06, boxShadow: "8px 8px 0px #0A0A0A", zIndex: 100, cursor: "grabbing" }}
      onClick={isLink && !isDragging ? handleLinkOpen : undefined}
      className={`group relative bg-[#FFFFFF] border-[2px] border-[#0A0A0A] rounded-[1.5rem] p-5 shadow-[4px_4px_0px_#0A0A0A] transition-all duration-150 select-none ${
        isLink
          ? "cursor-pointer hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none"
          : isDragging ? "cursor-grabbing" : "cursor-grab hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none"
      }`}
      style={{ position: "relative", zIndex: isDragging ? 100 : "auto" }}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle?.(item.id) }} 
        className={`absolute top-4 left-4 w-5 h-5 rounded-[6px] border-[2px] border-[#0A0A0A] flex items-center justify-center cursor-pointer transition-all z-20 ${isSelected ? 'bg-[#FFD600]' : 'bg-[#FFFFFF] opacity-0 group-hover:opacity-100 hover:bg-[#F5F5F0]'}`}
      >
        {isSelected && <Check className="w-3 h-3 text-[#0A0A0A]" strokeWidth={4} />}
      </div>
      <div className="flex justify-between items-start mb-4 pl-8 relative z-10">
        <div className={`w-14 h-14 rounded-[12px] border-[2px] border-[#0A0A0A] flex items-center justify-center shadow-[3px_3px_0px_#0A0A0A] ${
          isLink ? getLinkBgColor(item.url ?? "") : "bg-[#FFFFFF]"
        }`}>
          {isLink
            ? getLinkIcon(item.url ?? "")
            : getFileIcon(item.files?.mime_type ?? "")}
        </div>
        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); isLink ? handleLinkOpen() : handleView() }}
            disabled={!isLink && isBusy}
            title={isLink ? (ytVideoId ? "Watch on YouTube" : "Open link") : "View in browser"}
            className="w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#0057FF] hover:text-white flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-[#0A0A0A] disabled:opacity-40"
          >
            {isLink
              ? (ytVideoId ? <PlayCircle className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />)
              : isViewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-4 h-4" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={isBusy}
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] hover:bg-[#F5F5F0] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none outline-none focus:outline-none disabled:opacity-40"
              >
                {isBusy && !isViewing ? <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" /> : <MoreVertical className="w-4 h-4 text-[#0A0A0A]" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-[#FFFFFF] border-[2px] border-[#0A0A0A] rounded-[1rem] shadow-[4px_4px_0px_#0A0A0A] p-1.5 z-50"
            >
              {item.item_type !== "link" && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload() }} className="flex items-center gap-2 cursor-pointer font-sans text-[13px] font-medium focus:bg-[#E8E8E0] px-2 py-1.5 rounded-[0.5rem] outline-none">
                <Download className="w-4 h-4 text-[#FFD600]" /> Download
              </DropdownMenuItem>
              )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item) }} className="flex items-center gap-2 cursor-pointer font-sans text-[13px] font-medium focus:bg-[#E8E8E0] px-2 py-1.5 rounded-[0.5rem] outline-none">
              <Pencil className="w-4 h-4 text-[#00C853]" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(item) }} className="flex items-center gap-2 cursor-pointer font-sans text-[13px] font-medium focus:bg-[#E8E8E0] px-2 py-1.5 rounded-[0.5rem] outline-none">
              <FolderInput className="w-4 h-4 text-[#FF6B00]" /> Move
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#E8E8E0] my-1" />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete() }} className="flex items-center gap-2 cursor-pointer font-sans text-[13px] font-medium text-[#FF3B30] focus:bg-[#FF3B30] focus:text-white px-2 py-1.5 rounded-[0.5rem] outline-none transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <h3 className="font-heading font-bold text-[15px] text-[#0A0A0A] truncate mb-1" title={isLink ? (item.title ?? "") : item.files?.filename}>
        {isLink ? (item.title || "Untitled Link") : (item.files?.filename || "Unknown File")}
      </h3>
      <div className="flex items-center justify-between mt-1">
        {isLink ? (
          <span className="font-mono text-[12px] font-medium text-[#555550] truncate max-w-[60%] flex items-center gap-1">
            <ExternalLink className="w-3 h-3 text-[#999990] shrink-0" />
            {linkDomain}
          </span>
        ) : (
          <span className="font-mono text-[12px] font-medium text-[#555550]">
            {formatBytes(item.files?.size_bytes ?? 0)}
          </span>
        )}
        <span className="font-mono text-[11px] text-[#999990]">{formatDate(item.created_at)}</span>
      </div>
      <div className="flex items-center mt-2.5 gap-1.5 overflow-hidden">
         <Folder className="w-3.5 h-3.5 text-[#999990] shrink-0" />
         <span className="font-mono text-[10px] text-[#999990] uppercase tracking-wider truncate">
           {pathString}
         </span>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2.5 py-0.5 rounded-[100px] border-[1.5px] border-[#0A0A0A] bg-[#F5F5F0] font-mono text-[11px] font-medium text-[#555550] shadow-[2px_2px_0px_#0A0A0A]">
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2.5 py-0.5 rounded-[100px] border-[1.5px] border-[#E8E8E0] bg-[#E8E8E0] font-mono text-[11px] text-[#999990]">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
    </>
  )
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({
  trail,
  onNavigate,
}: {
  trail: VaultFolder[]
  onNavigate: (id: string | null) => void
}) {
  return (
    <nav className="flex items-center gap-1 flex-wrap">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] border-[1.5px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-mono text-[12px] font-medium text-[#0A0A0A]"
      >
        <Home className="w-3.5 h-3.5" />
        Vault
      </button>
      {trail.map((folder, idx) => (
        <div key={folder.id} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-[#999990]" />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`px-2.5 py-1 rounded-[8px] border-[1.5px] font-mono text-[12px] font-medium transition-all ${
              idx === trail.length - 1
                ? "border-[#0A0A0A] bg-[#FFD600] shadow-[2px_2px_0px_#0A0A0A] text-[#0A0A0A]"
                : "border-[#0A0A0A] bg-[#FFFFFF] shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none text-[#0A0A0A]"
            }`}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </nav>
  )
}

// ─── Sidebar Folder Tree ──────────────────────────────────────────────────────
function SidebarFolderTree({
  folders,
  currentFolderId,
  onNavigate,
  activeDropZone,
  parentId = null,
  depth = 0,
}: {
  folders: VaultFolder[]
  currentFolderId: string | null
  onNavigate: (id: string | null) => void
  activeDropZone: string | null
  parentId?: string | null
  depth?: number
}) {
  const children = folders.filter((f) => f.parent_id === parentId)
  if (children.length === 0) return null

  return (
    <ul className="space-y-0.5">
      {children.map((folder) => {
        const isActive = currentFolderId === folder.id
        const isDropTarget = activeDropZone === folder.id
        const hasChildren = folders.some((f) => f.parent_id === folder.id)
        return (
          <li key={folder.id}>
            <button
              data-drop-target={folder.id}
              onClick={() => onNavigate(folder.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] transition-all text-left font-sans text-[13px] font-medium ${
                isDropTarget
                  ? "bg-[#FFD600] border-[1.5px] border-[#0A0A0A] text-[#0A0A0A] shadow-[0px_0px_0px_3px_#FFD60088]"
                  : isActive
                  ? "bg-[#FFD600] border-[1.5px] border-[#0A0A0A] text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]"
                  : "hover:bg-[#E8E8E0] text-[#0A0A0A]"
              }`}
              style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
              {isActive
                ? <FolderOpen className="w-4 h-4 shrink-0" />
                : <Folder className="w-4 h-4 shrink-0 text-[#555550]" />}
              <span className="truncate">{folder.name}</span>
              {hasChildren && (
                <ChevronRight className="w-3 h-3 ml-auto shrink-0 text-[#999990]" />
              )}
            </button>
            {isActive && hasChildren && (
              <SidebarFolderTree
                folders={folders}
                currentFolderId={currentFolderId}
                onNavigate={onNavigate}
                activeDropZone={activeDropZone}
                parentId={folder.id}
                depth={depth + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VaultPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [addLinkModalOpen, setAddLinkModalOpen] = useState(false)
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<VaultItem | null>(null)
  
  // Drag and drop state
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null) // folder id or "root"

  // New states for Folder rename and Move operations
  const [renameFolderItem, setRenameFolderItem] = useState<VaultFolder | null>(null)
  const [moveItem, setMoveItem] = useState<{ type: "file" | "folder"; id: string } | null>(null)

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
        ...selectedItemIds.map(id => fetch(`/api/vault/items/${id}`, { method: 'DELETE' })),
        ...selectedFolderIds.map(id => fetch(`/api/vault/folders/${id}`, { method: 'DELETE' }))
      ])
      toast.success("Deleted successfully", { id: toastId })
      queryClient.invalidateQueries({ queryKey: ["vaultItems"] })
      queryClient.invalidateQueries({ queryKey: ["vaultFolders"] })
      clearSelection()
    } catch (e: any) {
      toast.error("Failed to delete some items", { id: toastId })
    }
  }

  const queryClient = useQueryClient()

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: allFolders = [], isLoading: foldersLoading } = useQuery<VaultFolder[]>({
    queryKey: ["vaultFolders"],
    queryFn: async () => {
      const res = await fetch("/api/vault/folders")
      if (!res.ok) throw new Error("Failed to fetch folders")
      return (await res.json()).data
    },
  })

  const { data: vaultItems = [], isLoading: itemsLoading } = useQuery<VaultItem[]>({
    queryKey: ["vaultItems", currentFolderId],
    queryFn: async () => {
      const url = currentFolderId
        ? `/api/vault/items?folder_id=${currentFolderId}`
        : "/api/vault/items"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch items")
      return (await res.json()).data
    },
  })

  // ── Derived state ─────────────────────────────────────────────────────────
  // Subfolders of the current level
  const visibleFolders = allFolders.filter(
    (f) => f.parent_id === currentFolderId
  )

  // Client-side search filter on items + folders
  const filteredItems = vaultItems.filter((item) => {
    if (!searchQuery.trim()) {
      return (item.folder_id || null) === (currentFolderId || null)
    }
    const q = searchQuery.toLowerCase()
    return (
      (item.files?.filename?.toLowerCase().includes(q) ?? false) ||
      (item.title?.toLowerCase().includes(q) ?? false) ||
      (item.url?.toLowerCase().includes(q) ?? false) ||
      (item.tags ?? []).some((t) => t.toLowerCase().includes(q))
    )
  })

  const filteredFolders = visibleFolders.filter((f) =>
    searchQuery.trim() ? f.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  )

  const breadcrumb = buildBreadcrumb(allFolders, currentFolderId)

  const totalStorage = vaultItems.reduce((acc, item) => acc + (item.files?.size_bytes ?? 0), 0)

  // Quota is computed from all items across all folders — re-use root query for the sidebar bar
  const { data: rootItems = [] } = useQuery<VaultItem[]>({
    queryKey: ["vaultItems", null],         // always cached from the root fetch
    queryFn: async () => {
      const res = await fetch("/api/vault/items")
      if (!res.ok) throw new Error("Failed to fetch items")
      return (await res.json()).data
    },
    enabled: false,                         // only served from cache, root fetch populates it
  })

  const allStorageItems = currentFolderId ? rootItems : vaultItems
  const storageUsed = allStorageItems.reduce((acc, i) => acc + (i.files?.size_bytes ?? 0), 0)
  const storagePercentage = Math.min((storageUsed / (500 * 1024 * 1024)) * 100, 100)
  const storageColor = storagePercentage > 80 ? "bg-[#FF3B30]" : "bg-[#FF3CAC]"

  const invalidateItems = () =>
    queryClient.invalidateQueries({ queryKey: ["vaultItems", currentFolderId] })
  const invalidateFolders = () =>
    queryClient.invalidateQueries({ queryKey: ["vaultFolders"] })

  const navigate = (id: string | null) => {
    setCurrentFolderId(id)
    setSearchQuery("")
  }

  // ── Drag-and-drop handlers ────────────────────────────────────────────────
  const handleFileDrop = useCallback(async (fileItemId: string, targetFolderId: string | null) => {
    setActiveDropZone(null)
    const toastId = toast.loading("Moving file…")
    try {
      const res = await fetch(`/api/vault/items/${fileItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: targetFolderId }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Move failed")
      toast.success("File moved!", { id: toastId })
      queryClient.invalidateQueries({ queryKey: ["vaultItems"] })
    } catch (e: any) {
      toast.error(e.message || "Failed to move file", { id: toastId })
    }
  }, [queryClient])

  const isLoading = foldersLoading || itemsLoading
  const isEmpty = filteredFolders.length === 0 && filteredItems.length === 0 && !isLoading

  return (
    <>
      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={invalidateItems}
        currentFolderId={currentFolderId}
      />

      <AddLinkModal
        isOpen={addLinkModalOpen}
        onClose={() => setAddLinkModalOpen(false)}
        onAdded={invalidateItems}
        currentFolderId={currentFolderId}
      />

      <NewFolderModal
        isOpen={newFolderModalOpen || !!renameFolderItem}
        onClose={() => { setNewFolderModalOpen(false); setRenameFolderItem(null); }}
        onCreated={invalidateFolders}
        parentId={currentFolderId}
      />

      <MoveModal
        isOpen={!!moveItem}
        onClose={() => setMoveItem(null)}
        onMoved={() => { invalidateFolders(); invalidateItems(); }}
        folders={allFolders}
        currentFolderId={currentFolderId}
        itemType={moveItem?.type ?? null}
        itemId={moveItem?.id ?? null}
      />

      {/* Edit Modal — key forces fresh mount per file */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null) }}>
        {editItem && (
          <EditModal
            key={editItem.id}
            item={editItem}
            onClose={() => setEditItem(null)}
            onSaved={invalidateItems}
          />
        )}
      </Dialog>

      <div className="flex h-full w-full">
        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-[220px] bg-[#F5F5F0] border-r-[2px] border-[#0A0A0A] flex-col hidden md:flex shrink-0">
          <div className="p-4 border-b-[2px] border-[#0A0A0A]">
            <h2 className="font-heading font-extrabold text-[16px] text-[#0A0A0A]">MY VAULT</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* Root button */}
            <button
              data-drop-target="root"
              onClick={() => navigate(null)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[6px] transition-all text-left font-sans text-[13px] font-medium ${
                activeDropZone === "root"
                  ? "bg-[#FFD600] border-[1.5px] border-[#0A0A0A] text-[#0A0A0A] shadow-[0px_0px_0px_3px_#FFD60088]"
                  : currentFolderId === null
                  ? "bg-[#FFD600] border-[1.5px] border-[#0A0A0A] text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]"
                  : "hover:bg-[#E8E8E0] text-[#0A0A0A]"
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>All Files</span>
            </button>

            {foldersLoading ? (
              <div className="space-y-1 pt-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-7 bg-[#E8E8E0] rounded-[6px] animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {allFolders.length > 0 && (
                  <div className="font-mono text-[10px] text-[#999990] px-2 pt-3 pb-1 uppercase tracking-wider">
                    Folders
                  </div>
                )}
                <SidebarFolderTree
                  folders={allFolders}
                  currentFolderId={currentFolderId}
                  onNavigate={navigate}
                  activeDropZone={activeDropZone}
                />
              </>
            )}
          </div>

          {/* Storage quota */}
          <div className="p-4 border-t-[2px] border-[#0A0A0A] bg-[#FFFFFF]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[10px] text-[#555550]">STORAGE</span>
              <span className="font-mono text-[10px] font-bold text-[#0A0A0A]">
                {formatBytes(storageUsed)} / 500 MB
              </span>
            </div>
            <div className="w-full h-2 bg-[#F5F5F0] rounded-full overflow-hidden border-[1.5px] border-[#0A0A0A]">
              <div
                className={`h-full transition-all ${storageColor}`}
                style={{ width: `${Math.max(storagePercentage, 2)}%` }}
              />
            </div>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
        <div className="flex-1 bg-[#FFFFFF] flex flex-col overflow-hidden">

          {/* Top bar */}
          <div className="p-6 border-b-[2px] border-[#E8E8E0] bg-[#FFFFFF] z-10 shrink-0 space-y-4">
            {/* Breadcrumb */}
            <Breadcrumb trail={breadcrumb} onNavigate={navigate} />

            {/* Actions row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 max-w-sm min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999990] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or #tag…"
                  className="w-full pl-9 pr-8 py-2.5 rounded-[0.75rem] border-[2px] border-[#0A0A0A] bg-[#F5F5F0] font-sans text-[14px] text-[#0A0A0A] placeholder:text-[#999990] placeholder:font-mono outline-none focus:bg-[#FFFFFF] focus:shadow-[4px_4px_0px_#0A0A0A] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999990] hover:text-[#0A0A0A]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* New Folder */}
              <button
                onClick={() => setNewFolderModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[4px_4px_0px_#0A0A0A] font-heading font-bold text-[13px] text-[#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all shrink-0"
              >
                <FolderPlus className="w-4 h-4" />
                New Folder
              </button>

              {/* Add Link */}
              <button
                onClick={() => setAddLinkModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#0057FF] shadow-[4px_4px_0px_#0A0A0A] font-heading font-bold text-[13px] text-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all shrink-0"
              >
                <Link2 className="w-4 h-4" />
                Add Link
              </button>

              {/* Upload */}
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[0.875rem] border-[3px] border-[#0A0A0A] bg-[#FFD600] shadow-[5px_5px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:translate-x-[5px] hover:translate-y-[5px] hover:shadow-none transition-all shrink-0"
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
            </div>
          </div>

          {/* Grid content */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#FFFFFF]">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-[#F5F5F0] border-[2px] border-[#E8E8E0] rounded-[24px] h-[140px]"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  />
                ))}
              </div>
            ) : isEmpty ? (
              /* Empty state */
              <div className="w-full min-h-[400px] border-[2px] border-dashed border-[#0A0A0A] bg-[#F5F5F0] rounded-[24px] flex flex-col items-center justify-center text-center p-8 gap-4">
                <div className="relative w-20 h-20">
                  <div className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-[#0057FF] border-[1.5px] border-[#0A0A0A]" />
                  <div className="absolute -bottom-2 -left-3 w-4 h-4 bg-[#FF3CAC] border-[1.5px] border-[#0A0A0A] rotate-45" />
                  <div className="w-20 h-20 bg-[#FFFFFF] rounded-[16px] rotate-[-6deg] flex items-center justify-center border-[2px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
                    {currentFolderId
                      ? <FolderOpen className="w-10 h-10 text-[#FFD600]" />
                      : <Sparkles className="w-10 h-10 text-[#FF3CAC]" />}
                  </div>
                </div>
                <h3 className="font-heading font-extrabold text-[22px] text-[#0A0A0A]">
                  {currentFolderId ? "This folder is empty" : "Your Vault is Empty"}
                </h3>
                <p className="font-sans text-[15px] text-[#555550] max-w-xs">
                  {currentFolderId
                    ? "Upload a file here or create a sub-folder to organise your work."
                    : "Start securing your documents and resources. Upload your first file now."}
                </p>
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => setNewFolderModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[4px_4px_0px_#0A0A0A] font-heading font-bold text-[14px] text-[#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                  >
                    <FolderPlus className="w-4 h-4" />
                    New Folder
                  </button>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-[0.875rem] border-[3px] border-[#0A0A0A] bg-[#FFD600] shadow-[5px_5px_0px_#0A0A0A] font-heading font-bold text-[15px] text-[#0A0A0A] hover:translate-x-[5px] hover:translate-y-[5px] hover:shadow-none transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                </div>
              </div>
            ) : searchQuery && filteredFolders.length === 0 && filteredItems.length === 0 ? (
              /* No search results */
              <div className="w-full min-h-[400px] border-[2px] border-dashed border-[#0A0A0A] bg-[#F5F5F0] rounded-[24px] flex flex-col items-center justify-center text-center p-8 gap-4">
                <div className="w-16 h-16 bg-[#FFFFFF] rounded-[16px] flex items-center justify-center border-[2px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
                  <Search className="w-8 h-8 text-[#555550]" />
                </div>
                <h3 className="font-heading font-extrabold text-[22px] text-[#0A0A0A]">No matches found</h3>
                <p className="font-sans text-[14px] text-[#555550]">
                  Nothing matches &ldquo;<strong>{searchQuery}</strong>&rdquo;
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-5 py-2.5 rounded-[0.875rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] font-heading font-bold text-[14px] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                layout
              >
                <AnimatePresence>
                  {/* Folders first */}
                  {filteredFolders.map((folder) => (
                    <FolderCard
                      key={`folder-${folder.id}`}
                      folder={folder}
                      isDropTarget={activeDropZone === folder.id}
                      onClick={() => navigate(folder.id)}
                      onRename={(f) => {
                        // We can quickly implement a native prompt or use NewFolderModal
                        const newName = window.prompt("Enter new folder name:", f.name)
                        if (newName && newName.trim() !== f.name) {
                          fetch(`/api/vault/folders/${f.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: newName.trim() })
                          }).then(() => invalidateFolders())
                        }
                      }}
                      onMove={(f) => setMoveItem({ type: "folder", id: f.id })}
                      onDelete={invalidateFolders}
                      isSelected={selectedFolderIds.includes(folder.id)}
                      onToggle={toggleFolder}
                    />
                  ))}

                  {/* Separator label if both exist */}
                  {filteredFolders.length > 0 && filteredItems.length > 0 && (
                    <motion.div
                      key="file-separator"
                      className="col-span-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-3 py-1">
                        <div className="h-[2px] flex-1 bg-[#E8E8E0]" />
                        <span className="font-mono text-[11px] text-[#999990] uppercase tracking-wider">Files</span>
                        <div className="h-[2px] flex-1 bg-[#E8E8E0]" />
                      </div>
                    </motion.div>
                  )}

                  {/* File cards */}
                  {filteredItems.map((item) => (
                    <FileCard
                      key={`file-${item.id}`}
                      item={item}
                      folders={allFolders}
                      onDelete={invalidateItems}
                      onEdit={(i) => setEditItem(i)}
                      onMove={(i) => setMoveItem({ type: "file", id: i.id })}
                      onDropFile={handleFileDrop}
                      onDragOver={(id) => setActiveDropZone(id)}
                      isSelected={selectedItemIds.includes(item.id)}
                      onToggle={toggleItem}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Result count during search */}
            {searchQuery && (filteredFolders.length > 0 || filteredItems.length > 0) && (
              <p className="font-mono text-[11px] text-[#999990] mt-4">
                {filteredFolders.length + filteredItems.length} result
                {filteredFolders.length + filteredItems.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bulk Action Bar ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {(selectedItemIds.length > 0 || selectedFolderIds.length > 0) && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] px-6 py-3"
          >
            <span className="font-heading font-extrabold text-[15px] text-[#0A0A0A]">
              {selectedItemIds.length + selectedFolderIds.length} selected
            </span>
            <div className="w-[2px] h-5 bg-[#E8E8E0]" />
            <button
              onClick={clearSelection}
              className="font-heading font-bold text-[13px] text-[#555550] hover:text-[#0A0A0A] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF3B30] text-[#FFFFFF] rounded-[1rem] border-[2px] border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all font-heading font-bold text-[13px]"
            >
              <Trash2 className="w-4 h-4" />
              Delete {selectedItemIds.length + selectedFolderIds.length} item{selectedItemIds.length + selectedFolderIds.length !== 1 ? "s" : ""}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
