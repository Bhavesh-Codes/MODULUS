"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

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

  if (!community) return null

  const role = community.membership?.role
  const isMember = role === 'owner' || role === 'curator' || role === 'peer'

  if (isMember) {
    return (
      <div className="bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] p-8 min-h-[300px] flex items-center justify-center">
           <div className="text-center space-y-4">
               <h2 className="font-heading font-bold text-[24px] text-[#0A0A0A]">Welcome to the Community</h2>
               <p className="font-sans text-[16px] text-[#555550]">Tabs and collaborative spaces will appear here.</p>
           </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F5F5F0] border-[2px] border-[#0A0A0A] rounded-[1.5rem] border-dashed p-8 text-center mt-8">
        <h3 className="font-heading font-bold text-[20px] text-[#0A0A0A] mb-2">Private Access</h3>
        <p className="font-sans text-[15px] text-[#555550]">Join the community to unlock files, tasks, circles, and discussions.</p>
    </div>
  )
}
