'use client'

import React, { useState, useEffect, use, useRef } from 'react'
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react'
import '@livekit/components-styles'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import CircleChat from '@/components/circles/CircleChat'
import CircleWhiteboard from '@/components/circles/CircleWhiteboard'
import CircleVideoGrid from '@/components/circles/CircleVideoGrid'
import CircleControlBar from '@/components/circles/CircleControlBar'

type Params = Promise<{ id: string; circleId: string }>

export default function CircleRoomPage(props: { params: Params }) {
  const { id, circleId } = use(props.params)
  const [token, setToken] = useState<string | null>(null)
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard'>('chat')

  useEffect(() => {
    let mounted = true

    async function fetchToken() {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Use name from user metadata, fallback to id
      const username = user.user_metadata?.name || user.id

      try {
        const response = await fetch(`/api/livekit/token?room=${circleId}&communityId=${id}&username=${encodeURIComponent(username)}`)
        
        if (response.ok) {
          const data = await response.json()
          if (mounted) {
            setToken(data.token)
          }
        } else {
          console.error("Failed to fetch LiveKit token", await response.text())
        }
      } catch (err) {
        console.error("Error fetching token:", err)
      }
    }

    fetchToken()

    return () => {
      mounted = false
    }
  }, [circleId, supabase])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err: any) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const toggleChat = () => {
    if (!isSidebarOpen) {
      setActiveTab('chat')
      setIsSidebarOpen(true)
    } else {
      if (activeTab === 'chat') {
        setIsSidebarOpen(false)
      } else {
        setActiveTab('chat')
      }
    }
  }

  const toggleWhiteboard = () => {
    if (!isSidebarOpen) {
      setActiveTab('whiteboard')
      setIsSidebarOpen(true)
    } else {
      if (activeTab === 'whiteboard') {
        setIsSidebarOpen(false)
      } else {
        setActiveTab('whiteboard')
      }
    }
  }

  if (!token) {
    return (
      <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 w-full bg-[#F5F5F0]">
        <Loader2 className="h-10 w-10 animate-spin text-[#FFD600]" />
        <p className="font-heading font-extrabold text-[20px] text-[#0A0A0A]">Connecting to Study Circle...</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col w-full bg-white relative transition-all ${isFullscreen ? 'h-screen' : 'h-[calc(100vh-4rem)]'}`}
    >
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        className="flex h-full w-full flex-col relative z-10"
      >
        <div className="flex h-full w-full overflow-hidden">
          <div className="flex-1 overflow-hidden relative bg-white flex flex-col items-center">
            <CircleVideoGrid />
            <CircleControlBar 
              isFullscreen={isFullscreen} 
              toggleFullscreen={toggleFullscreen} 
              isChatOpen={isSidebarOpen && activeTab === 'chat'}
              toggleChat={toggleChat}
              isWhiteboardOpen={isSidebarOpen && activeTab === 'whiteboard'}
              toggleWhiteboard={toggleWhiteboard}
            />
          </div>
          {isSidebarOpen && (
            <div className="w-[360px] lg:w-[400px] shrink-0 flex flex-col z-20 transition-all border-l-[3px] border-[#0A0A0A]">
              {activeTab === 'chat' && <CircleChat />}
              {activeTab === 'whiteboard' && <CircleWhiteboard />}
            </div>
          )}
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}
