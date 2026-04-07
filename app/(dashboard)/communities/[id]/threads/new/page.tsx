"use client"

import { useState, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ArrowLeft, AlignLeft, HelpCircle, Image as ImageIcon, UploadCloud, X } from "lucide-react"
import Link from "next/link"

type PostType = "text" | "question" | "image"

const TYPE_OPTIONS: { type: PostType; label: string; Icon: React.ElementType; accent: string }[] = [
    { type: "text", label: "Text", Icon: AlignLeft, accent: "bg-[#E8E8E0] text-[#0A0A0A]" },
    { type: "question", label: "Question", Icon: HelpCircle, accent: "bg-[#0057FF] text-white" },
    { type: "image", label: "Image", Icon: ImageIcon, accent: "bg-[#FF3CAC] text-white" },
]

export default function NewThreadPage() {
    const params = useParams()
    const communityId = params.id as string
    const router = useRouter()
    const queryClient = useQueryClient()

    const [postType, setPostType] = useState<PostType>("text")
    const [content, setContent] = useState("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const createMutation = useMutation({
        mutationFn: async ({ content, post_type }: { content: string; post_type: PostType }) => {
            const res = await fetch(`/api/communities/${communityId}/threads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, post_type }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to create thread")
            }
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["threads", communityId] })
            toast.success("Thread posted!")
            router.push(`/communities/${communityId}/threads/${data.id}`)
        },
        onError: (err: any) => toast.error(err.message),
    })

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (postType !== "image" && !content.trim()) {
            toast.error("Content cannot be empty")
            return
        }

        let finalContent = content.trim()

        if (postType === "image" && imageFile) {
            setUploading(true)
            try {
                const formData = new FormData()
                formData.append("file", imageFile)
                // Upload via vault file upload endpoint pattern
                const res = await fetch("/api/vault/upload", { method: "POST", body: formData })
                if (!res.ok) throw new Error("Image upload failed")
                const data = await res.json()
                const uploadedId = data.data?.id || data.file_id
                if (uploadedId) {
                    finalContent += `\n\n[FILE:${uploadedId}]`
                }
            } catch (err: any) {
                toast.error(err.message || "Image upload failed")
                setUploading(false)
                return
            }
            setUploading(false)
        }

        createMutation.mutate({ content: finalContent, post_type: postType })
    }

    const isSubmitting = uploading || createMutation.isPending

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Page header */}
            <div className="flex items-center gap-3">
                <Link
                    href={`/communities/${communityId}/threads`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0_#0A0A0A] font-heading font-bold text-[13px] text-[#0A0A0A] hover:bg-[#F5F5F0] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <h2 className="font-heading font-extrabold text-[22px] text-[#0A0A0A]">New Thread</h2>
            </div>

            {/* Form card */}
            <form
                onSubmit={handleSubmit}
                className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[1.5rem] shadow-[6px_6px_0_#0A0A0A] p-6 space-y-6"
            >
                {/* Post type selector */}
                <div className="space-y-2">
                    <label className="font-heading font-bold text-[13px] text-[#0A0A0A] uppercase tracking-wide">
                        Post Type
                    </label>
                    <div className="flex gap-3 flex-wrap">
                        {TYPE_OPTIONS.map(({ type, label, Icon, accent }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setPostType(type)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-[0.75rem] border-[2px] border-[#0A0A0A] font-heading font-bold text-[14px] transition-all ${postType === type
                                    ? `${accent} shadow-none translate-x-[3px] translate-y-[3px]`
                                    : "bg-[#FFFFFF] text-[#0A0A0A] shadow-[3px_3px_0_#0A0A0A] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content textarea (shown for text + question, optional description for image) */}
                {postType !== "image" && (
                    <div className="space-y-2">
                        <label className="font-heading font-bold text-[13px] text-[#0A0A0A] uppercase tracking-wide">
                            {postType === "question" ? "Your Question" : "Content"}
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={
                                postType === "question"
                                    ? "What do you want to ask the community?"
                                    : "Write something for the community..."
                            }
                            rows={6}
                            className="w-full px-4 py-3 rounded-[1rem] border-[2px] border-[#0A0A0A] bg-[#F5F5F0] font-sans text-[15px] text-[#0A0A0A] placeholder:text-[#999990] focus:outline-none focus:ring-2 focus:ring-[#FFD600] resize-none"
                        />
                    </div>
                )}

                {/* Image upload */}
                {postType === "image" && (
                    <div className="space-y-2">
                        <label className="font-heading font-bold text-[13px] text-[#0A0A0A] uppercase tracking-wide">
                            Image
                        </label>
                        {imagePreview ? (
                            <div className="relative rounded-[1rem] border-[2px] border-[#0A0A0A] overflow-hidden">
                                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#FF3B30] border-[2px] border-[#0A0A0A] flex items-center justify-center text-white hover:scale-105 transition-transform"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="w-full h-40 rounded-[1rem] border-[2px] border-dashed border-[#0A0A0A] bg-[#F5F5F0] flex flex-col items-center justify-center gap-2 hover:bg-[#E8E8E0] transition-colors"
                            >
                                <UploadCloud className="w-8 h-8 text-[#0A0A0A] opacity-40" />
                                <span className="font-sans text-[14px] text-[#555550]">Click to upload an image</span>
                            </button>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {/* Optional caption */}
                        <div className="space-y-1 pt-2">
                            <label className="font-heading font-bold text-[12px] text-[#555550] uppercase tracking-wide">
                                Caption (optional)
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Add a caption..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-[1rem] border-[2px] border-[#0A0A0A] bg-[#F5F5F0] font-sans text-[15px] text-[#0A0A0A] placeholder:text-[#999990] focus:outline-none focus:ring-2 focus:ring-[#FFD600] resize-none"
                            />
                        </div>
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#FFD600] shadow-[5px_5px_0_#0A0A0A] font-heading font-extrabold text-[16px] text-[#0A0A0A] hover:translate-x-[5px] hover:translate-y-[5px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {uploading ? "Uploading image..." : createMutation.isPending ? "Posting..." : "Post Thread"}
                </button>
            </form>
        </div>
    )
}
