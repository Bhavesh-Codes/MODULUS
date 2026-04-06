'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Radio, Users, Loader2, ArrowRight } from 'lucide-react'

type Params = Promise<{ id: string }>

type ActiveRoom = {
  name: string
  numParticipants: number
  maxParticipants: number
  creationTime: number
}

export default function CirclesLobbyPage(props: { params: Params }) {
  const params = use(props.params)
  const router = useRouter()
  const [roomName, setRoomName] = useState('General-Study')
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch(`/api/livekit/rooms?communityId=${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setActiveRooms(data.rooms || [])
        }
      } catch (err) {
        console.error("Failed to fetch rooms", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRooms()
    
    // Refresh rooms every 10 seconds automatically
    const interval = setInterval(fetchRooms, 10000)
    return () => clearInterval(interval)
  }, [params.id])

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomName.trim()) {
      router.push(`/communities/${params.id}/circles/${encodeURIComponent(roomName.trim())}`)
    }
  }

  const joinExisting = (name: string) => {
    router.push(`/communities/${params.id}/circles/${encodeURIComponent(name)}`)
  }

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row gap-8 items-start justify-center pt-10 pb-10">
      
      {/* Active Circles List */}
      <div className="w-full lg:flex-1 max-w-[700px] flex flex-col lg:pr-8">
         <h2 className="font-heading font-extrabold text-[24px] text-[#0A0A0A] mb-6 flex items-center gap-3">
           <div className="w-4 h-4 rounded-full bg-[#00C853] animate-pulse border-[2px] border-[#0A0A0A]" />
           Active Circles
         </h2>

         {isLoading ? (
           <div className="flex flex-col items-center justify-center py-32 border-[3px] border-dashed border-[#0A0A0A] rounded-[2rem] bg-[#F5F5F0]">
             <Loader2 className="w-8 h-8 animate-spin text-[#0A0A0A] mb-4" />
             <p className="font-heading font-bold text-[#555550]">Scanning frequencies...</p>
           </div>
         ) : activeRooms.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 border-[3px] border-dashed border-[#0A0A0A] rounded-[2rem] bg-[#F5F5F0] text-center px-6">
             <Radio className="w-10 h-10 text-[#999990] mb-4 opacity-50" />
             <p className="font-heading font-bold text-[18px] text-[#0A0A0A] mb-2">No active circles right now</p>
             <p className="font-sans text-[14px] text-[#555550]">Create a new one to start broadcasting.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 gap-4">
             {activeRooms.map((room) => (
               <div 
                 key={room.name} 
                 className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[1.5rem] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#0A0A0A] transition-all group"
               >
                  <div>
                     <h3 className="font-heading font-extrabold text-[18px] text-[#0A0A0A] mb-1 truncate max-w-[200px] sm:max-w-[300px]">{room.name}</h3>
                     <p className="font-sans text-[13px] text-[#555550] flex items-center gap-2">
                       <span className="flex items-center gap-1 font-bold text-[#0A0A0A]">
                         <Users className="w-4 h-4" /> {room.numParticipants}
                       </span> 
                       participants inside
                     </p>
                  </div>
                  <button 
                    onClick={() => joinExisting(room.name)}
                    className="mt-4 sm:mt-0 font-heading font-bold text-[14px] text-[#0A0A0A] bg-[#FFD600] border-[2px] border-[#0A0A0A] px-5 py-2.5 rounded-[12px] shadow-[3px_3px_0px_#0A0A0A] hover:-translate-y-1 hover:shadow-[5px_5px_0px_#0A0A0A] transition-all flex items-center justify-center gap-2"
                  >
                    Join <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* Create / Join New */}
      <div className="relative w-full lg:w-[400px] bg-[#FFFFFF] border-[3px] border-[#0A0A0A] rounded-[2rem] shadow-[8px_8px_0px_#0A0A0A] p-8 flex flex-col items-center text-center overflow-hidden shrink-0 mt-8 lg:mt-0">
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#0A0A0A 2px, transparent 2px)', backgroundSize: '16px 16px' }} 
        />
        
        <div className="w-14 h-14 rounded-[1rem] bg-[#FFD600] border-[3px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex items-center justify-center mb-5 relative z-10 transform -rotate-6">
          <Radio className="w-7 h-7 text-[#0A0A0A]" />
        </div>
        
        <h1 className="font-heading font-extrabold text-[26px] text-[#0A0A0A] mb-2 relative z-10">Start a Circle</h1>
        <p className="font-sans text-[14px] text-[#555550] mb-6 relative z-10">Create a new live room instantly.</p>

        <form onSubmit={handleJoin} className="w-full flex flex-col gap-4 relative z-10">
          <div className="flex flex-col text-left gap-2">
            <label className="font-heading font-bold text-[14px] text-[#0A0A0A] ml-1">Circle Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. math-homework"
              className="w-full h-[52px] rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#F5F5F0] px-4 font-mono text-[16px] text-[#0A0A0A] placeholder:text-[#999990] shadow-[3px_3px_0px_#0A0A0A] focus:outline-none focus:bg-[#FFFFFF] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[1px_1px_0px_#0A0A0A] transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!roomName.trim()}
            className="mt-2 w-full h-[52px] rounded-[1rem] border-[3px] border-[#0A0A0A] bg-[#00C853] shadow-[4px_4px_0px_#0A0A0A] hover:bg-[#00E676] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[1px_1px_0px_#0A0A0A] transition-all flex items-center justify-center gap-2 font-heading font-extrabold text-[16px] text-[#FFFFFF] disabled:opacity-50"
          >
            Create
            <Send className="w-4 h-4 ml-1" />
          </button>
        </form>
      </div>
    </div>
  )
}
