"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Folder, ChevronRight, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

export default function VaultPage() {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const loadingToastId = toast.loading("Encrypting and uploading to your vault...")

    try {
      const response = await fetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Upload failed", { id: loadingToastId })
      } else {
        toast.success("File securely added to Vault!", { id: loadingToastId })
        // TBD: mutate swr/react-query to refresh file grid
      }
    } catch (error: any) {
      toast.error("Network error during upload.", { id: loadingToastId })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex h-full w-full">
      {/* Vault Specific Navigation Panel (Left) */}
      <aside className="w-[220px] bg-[#F5F5F0] border-r-[2px] border-[#0A0A0A] flex flex-col hidden md:flex shrink-0">
        <div className="p-4 border-b-[2px] border-[#0A0A0A] flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-[16px] text-[#0A0A0A]">MY VAULT</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="font-mono text-[10px] text-[#999990] mb-2 px-2">FOLDERS</div>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#E8E8E0] rounded-[6px] transition-colors text-left font-sans text-[14px] font-medium text-[#0A0A0A]">
            <ChevronRight className="w-4 h-4 text-[#555550]" />
            <Folder className="w-4 h-4 fill-[#FFD600] text-[#0A0A0A] stroke-[2px]" />
            <span>Coursework</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#E8E8E0] rounded-[6px] transition-colors text-left font-sans text-[14px] font-medium text-[#0A0A0A]">
            <ChevronRight className="w-4 h-4 text-[#555550]" />
            <Folder className="w-4 h-4 fill-[#0057FF] text-[#0A0A0A] stroke-[2px]" />
            <span>Projects</span>
          </button>
        </div>
        
        {/* Dynamic Static Quota Bar Placeholder */}
        <div className="p-4 border-t-[2px] border-[#0A0A0A] bg-[#FFFFFF]">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-[10px] text-[#555550]">STORAGE</span>
            <span className="font-mono text-[10px] font-bold text-[#0A0A0A]">0 / 500 MB</span>
          </div>
          <div className="w-full h-2 bg-[#F5F5F0] rounded-full overflow-hidden border-[1.5px] border-[#0A0A0A]">
            <div className="h-full bg-[#FF3CAC] w-[5%]" />
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 bg-[#FFFFFF] flex flex-col relative overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b-[2px] border-[#E8E8E0] bg-[#FFFFFF] z-10">
          <h1 className="font-heading font-extrabold text-[28px] text-[#0A0A0A]">Recent Files</h1>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <Button 
            onClick={handleUploadClick} 
            disabled={isUploading}
            className="bg-[#FFD600] text-[#0A0A0A] hover:bg-[#FFD600]/80 shadow-[3px_3px_0px_#0A0A0A] font-bold"
          >
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>

        {/* File Grid Empty State Placeholder */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#FFFFFF]">
          <div className="w-full h-full min-h-[400px] border-[2px] border-dashed border-[#0A0A0A] bg-[#F5F5F0] rounded-[24px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-[#FFFFFF] rounded-[16px] rotate-[-6deg] flex items-center justify-center border-[2px] border-[#0A0A0A] mb-6 shadow-[4px_4px_0px_#0A0A0A]">
               <Sparkles className="w-8 h-8 text-[#FF3CAC]" />
            </div>
            <h3 className="font-heading font-extrabold text-[24px] text-[#0A0A0A] mb-2">Your Vault is Empty</h3>
            <p className="font-sans text-[16px] text-[#555550] max-w-sm border-[1px] border-transparent font-medium">
              Start securing your documents, assignment resources, and personal links. Click the yellow upload button to begin.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
