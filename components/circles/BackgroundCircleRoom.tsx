'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useParticipants,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { PhoneOff, ExternalLink } from 'lucide-react'
import { useCircleRoomStore } from '@/lib/stores/useCircleRoomStore'
import { useUiStore } from '@/lib/stores/uiStore'
import CircleVideoGrid from '@/components/circles/CircleVideoGrid'
import CircleControlBar from '@/components/circles/CircleControlBar'
import CircleChat from '@/components/circles/CircleChat'
import CircleWhiteboard from '@/components/circles/CircleWhiteboard'

const TOPNAV_HEIGHT = 64
const SIDEBAR_OPEN_WIDTH = 240
const SIDEBAR_COLLAPSED_WIDTH = 64

// Detect mobile (< md breakpoint = 768px)
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)')
        setIsMobile(mq.matches)
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])
    return isMobile
}

// ─── Mini PiP bar ─────────────────────────────────────────────────────────────
function MiniRoomBar({ communityId, circleId }: { communityId: string; circleId: string }) {
    const { clearRoom } = useCircleRoomStore()
    const router = useRouter()
    const participants = useParticipants()

    return (
        // On mobile: full-width bar at bottom with safe-area padding
        // On desktop: centered floating pill
        <div className="
            fixed z-[100] bottom-0 left-0 right-0
            md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto
            flex items-center gap-2 md:gap-3 px-4 py-3 md:py-2.5
            bg-[#0A0A0A] border-t-[2px] md:border-[2px] border-[#FFD600]
            md:rounded-[1.5rem] select-none
            shadow-[0_-4px_24px_rgba(0,0,0,0.4)] md:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
            pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-2.5
        ">
            <span className="flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
                <span className="font-mono text-[11px] text-[#00C853] font-bold uppercase tracking-wide">Live</span>
            </span>
            <span className="text-[#444] font-mono text-[11px] hidden md:inline">•</span>
            <span className="font-sans text-[12px] md:text-[13px] text-white font-medium truncate">
                {participants.length} in room
            </span>
            <div className="flex items-center gap-2 ml-auto md:ml-0">
                <button
                    onClick={() => router.push(`/communities/${communityId}/circles/${encodeURIComponent(circleId)}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-[#FFD600] hover:bg-yellow-300 text-[#0A0A0A] font-heading font-bold text-[12px] transition-all shrink-0"
                >
                    <ExternalLink className="w-3 h-3" />
                    <span className="hidden sm:inline">Return</span>
                </button>
                <button
                    onClick={clearRoom}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF3B30] hover:bg-red-400 transition-all shrink-0"
                    title="Leave room"
                >
                    <PhoneOff className="w-3.5 h-3.5 text-white" />
                </button>
            </div>
        </div>
    )
}

// ─── Full room UI — fills viewport minus top nav + right sidebar ───────────────
function FullRoomUI({ communityId, circleId }: { communityId: string; circleId: string }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard'>('chat')

    const { communitySidebarOpen } = useUiStore()
    const isMobile = useIsMobile()

    // On mobile: sidebar is a drawer overlay, so right = 0
    // On desktop: sidebar takes fixed space on the right
    const sidebarW = isMobile ? 0 : communitySidebarOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_COLLAPSED_WIDTH

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', handleFsChange)
        return () => document.removeEventListener('fullscreenchange', handleFsChange)
    }, [])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(console.error)
        else document.exitFullscreen()
    }

    const toggleChat = () => {
        if (!isSidebarOpen) { setActiveTab('chat'); setIsSidebarOpen(true) }
        else if (activeTab === 'chat') setIsSidebarOpen(false)
        else setActiveTab('chat')
    }

    const toggleWhiteboard = () => {
        if (!isSidebarOpen) { setActiveTab('whiteboard'); setIsSidebarOpen(true) }
        else if (activeTab === 'whiteboard') setIsSidebarOpen(false)
        else setActiveTab('whiteboard')
    }

    return (
        <div
            ref={containerRef}
            className="fixed bg-[#0A0A0A] overflow-hidden z-[45] flex flex-col"
            style={{
                top: isFullscreen ? 0 : TOPNAV_HEIGHT,
                left: 0,
                right: isFullscreen ? 0 : sidebarW,
                bottom: 0,
                transition: 'right 0.25s ease, top 0.25s ease',
            }}
        >
            <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
                {/* Video + controls */}
                <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
                    <div className="flex-1 min-h-0 overflow-hidden relative">
                        <CircleVideoGrid />
                    </div>
                    <CircleControlBar
                        isFullscreen={isFullscreen}
                        toggleFullscreen={toggleFullscreen}
                        isChatOpen={isSidebarOpen && activeTab === 'chat'}
                        toggleChat={toggleChat}
                        isWhiteboardOpen={isSidebarOpen && activeTab === 'whiteboard'}
                        toggleWhiteboard={toggleWhiteboard}
                    />
                </div>

                {/* Chat / whiteboard panel — full height on desktop, half height on mobile */}
                {isSidebarOpen && (
                    <div className="
                        w-full h-[45vh] md:h-auto md:w-[320px] lg:w-[380px]
                        shrink-0 flex flex-col z-20
                        border-t-[2px] md:border-t-0 md:border-l-[2px] border-[#333]
                    ">
                        {activeTab === 'chat' && <CircleChat />}
                        {activeTab === 'whiteboard' && <CircleWhiteboard />}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Single persistent LiveKitRoom for the community session ──────────────────
export default function BackgroundCircleRoom({ currentCommunityId }: { currentCommunityId: string }) {
    const { token, circleId, communityId, clearRoom } = useCircleRoomStore()
    const pathname = usePathname()

    // Clear on layout unmount (user navigated to personal vault / explore / tasks)
    useEffect(() => {
        return () => { clearRoom() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Reactively disconnect when leaving this community
    useEffect(() => {
        if (!communityId) return
        if (!pathname.startsWith(`/communities/${communityId}`)) clearRoom()
    }, [pathname, communityId, clearRoom])

    if (!token || !circleId || !communityId) return null
    if (communityId !== currentCommunityId) return null

    const roomPath = `/communities/${communityId}/circles/${encodeURIComponent(circleId)}`
    const isOnRoomPage = pathname.startsWith(roomPath)

    return (
        <LiveKitRoom
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            connect={true}
            audio={false}
            video={false}
            style={{ display: 'contents' }}
        >
            <RoomAudioRenderer />
            {isOnRoomPage
                ? <FullRoomUI communityId={communityId} circleId={circleId} />
                : <MiniRoomBar communityId={communityId} circleId={circleId} />
            }
        </LiveKitRoom>
    )
}
