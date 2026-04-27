import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Maximize, Minimize, MessageSquare, PenTool } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useCircleRoomStore } from '@/lib/stores/useCircleRoomStore'

interface CircleControlBarProps {
  isFullscreen: boolean
  toggleFullscreen: () => void
  isChatOpen: boolean
  toggleChat: () => void
  isWhiteboardOpen: boolean
  toggleWhiteboard: () => void
}

export default function CircleControlBar({
  isFullscreen,
  toggleFullscreen,
  isChatOpen,
  toggleChat,
  isWhiteboardOpen,
  toggleWhiteboard
}: CircleControlBarProps) {
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const router = useRouter()
  const params = useParams()
  const communityId = params?.id as string
  const { clearRoom } = useCircleRoomStore()

  const toggleMic = () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
  const toggleCamera = () => localParticipant.setCameraEnabled(!isCameraEnabled)
  const toggleScreenShare = () => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)

  const handleLeave = async () => {
    await room.disconnect(true)
    if (document.fullscreenElement) await document.exitFullscreen()
    clearRoom()                                          // clears store → hides FullRoomUI
    router.push(`/communities/${communityId}/circles`)   // go to circles lobby
  }

  // Desktop: large buttons; Mobile: smaller to fit the narrow bar
  const btnClass = "h-10 w-10 md:h-[48px] md:w-[48px] flex items-center justify-center rounded-[12px] md:rounded-[14px] border-[2px] border-foreground shadow-[3px_3px_0px_black] md:shadow-[4px_4px_0px_black] bg-card hover:bg-background hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_black] md:hover:shadow-[2px_2px_0px_black] transition-all shrink-0"
  const activeBtnClass = "h-10 w-10 md:h-[48px] md:w-[48px] flex items-center justify-center rounded-[12px] md:rounded-[14px] border-[2px] border-foreground shadow-[1px_1px_0px_black] md:shadow-[2px_2px_0px_black] bg-[#FFD600] translate-x-[2px] translate-y-[2px] transition-all shrink-0"

  return (
    // On mobile: full-width bar at bottom with overflow-x scroll fallback
    // On desktop: centered floating pill (absolute positioned)
    <div className="
      w-full md:w-auto
      md:absolute md:bottom-6 md:left-1/2 md:-translate-x-1/2
      flex items-center justify-center gap-2 md:gap-3
      bg-card border-t-[3px] md:border-[3px] border-foreground
      md:shadow-[6px_6px_0px_black]
      px-3 py-2.5 md:px-4 md:py-3
      md:rounded-[100px]
      z-50
      overflow-x-auto overflow-y-hidden
      shrink-0
    ">

      <button
        onClick={toggleMic}
        className={isMicrophoneEnabled ? btnClass : activeBtnClass}
        title={isMicrophoneEnabled ? "Mute" : "Unmute"}
      >
        {isMicrophoneEnabled ? <Mic className="w-4 h-4 md:w-5 md:h-5 text-foreground" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5 text-foreground" />}
      </button>

      <button
        onClick={toggleCamera}
        className={isCameraEnabled ? btnClass : activeBtnClass}
        title={isCameraEnabled ? "Stop Video" : "Start Video"}
      >
        {isCameraEnabled ? <Video className="w-4 h-4 md:w-5 md:h-5 text-foreground" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5 text-foreground" />}
      </button>

      <button
        onClick={toggleScreenShare}
        className={isScreenShareEnabled ? activeBtnClass : btnClass}
        title={isScreenShareEnabled ? "Stop Sharing" : "Share Screen"}
      >
        <MonitorUp className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
      </button>

      <div className="w-[1px] md:w-[2px] h-[28px] md:h-[32px] bg-muted mx-0.5 md:mx-1 shrink-0" />

      <button
        onClick={toggleWhiteboard}
        className={isWhiteboardOpen ? activeBtnClass : btnClass}
        title={isWhiteboardOpen ? "Close Whiteboard" : "Open Whiteboard"}
      >
        <PenTool className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
      </button>

      <button
        onClick={toggleChat}
        className={isChatOpen ? activeBtnClass : btnClass}
        title={isChatOpen ? "Close Chat" : "Open Chat"}
      >
        <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
      </button>

      <div className="w-[1px] md:w-[2px] h-[28px] md:h-[32px] bg-muted mx-0.5 md:mx-1 shrink-0" />

      <button
        onClick={toggleFullscreen}
        className={btnClass}
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5 text-foreground" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5 text-foreground" />}
      </button>

      <div className="w-[1px] md:w-[2px] h-[28px] md:h-[32px] bg-muted mx-0.5 md:mx-1 shrink-0" />

      <button
        onClick={handleLeave}
        className="h-10 md:h-[48px] px-3 md:px-6 flex items-center justify-center gap-1.5 rounded-[12px] md:rounded-[14px] border-[2px] md:border-[3px] border-foreground shadow-[3px_3px_0px_black] md:shadow-[4px_4px_0px_black] bg-[#FF3B30] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_black] md:hover:shadow-[2px_2px_0px_black] transition-all text-white font-heading font-bold ml-0.5 md:ml-1 shrink-0"
      >
        <PhoneOff className="w-4 h-4 md:w-5 md:h-5 text-white" />
        {/* Hide label on mobile */}
        <span className="hidden md:inline">Leave</span>
      </button>

    </div>
  )
}
