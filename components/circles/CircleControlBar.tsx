import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Maximize, Minimize, MessageSquare, PenTool } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

  const toggleMic = () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
  const toggleCamera = () => localParticipant.setCameraEnabled(!isCameraEnabled)
  const toggleScreenShare = () => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)

  const handleLeave = async () => {
    await room.disconnect(true)
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
    router.back()
  }

  const btnClass = "h-[48px] w-[48px] flex items-center justify-center rounded-[14px] border-[2px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] bg-white hover:bg-[#F5F5F0] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#0A0A0A] transition-all"
  const activeBtnClass = "h-[48px] w-[48px] flex items-center justify-center rounded-[14px] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] bg-[#FFD600] translate-x-[2px] translate-y-[2px] transition-all"
  
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white border-[3px] border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] px-4 py-3 rounded-[100px] z-50">
      
      <button 
        onClick={toggleMic} 
        className={isMicrophoneEnabled ? btnClass : activeBtnClass}
        title={isMicrophoneEnabled ? "Mute" : "Unmute"}
      >
        {isMicrophoneEnabled ? <Mic className="w-5 h-5 text-[#0A0A0A]" /> : <MicOff className="w-5 h-5 text-[#0A0A0A]" />}
      </button>

      <button 
        onClick={toggleCamera} 
        className={isCameraEnabled ? btnClass : activeBtnClass}
        title={isCameraEnabled ? "Stop Video" : "Start Video"}
      >
        {isCameraEnabled ? <Video className="w-5 h-5 text-[#0A0A0A]" /> : <VideoOff className="w-5 h-5 text-[#0A0A0A]" />}
      </button>

      <button 
        onClick={toggleScreenShare} 
        className={isScreenShareEnabled ? activeBtnClass : btnClass}
        title={isScreenShareEnabled ? "Stop Sharing" : "Share Screen"}
      >
        <MonitorUp className="w-5 h-5 text-[#0A0A0A]" />
      </button>

      <div className="w-[2px] h-[32px] bg-[#E8E8E0] mx-1"></div>

      <button 
        onClick={toggleWhiteboard} 
        className={isWhiteboardOpen ? activeBtnClass : btnClass}
        title={isWhiteboardOpen ? "Close Whiteboard" : "Open Whiteboard"}
      >
        <PenTool className="w-5 h-5 text-[#0A0A0A]" />
      </button>

      <button 
        onClick={toggleChat} 
        className={isChatOpen ? activeBtnClass : btnClass}
        title={isChatOpen ? "Close Chat" : "Open Chat"}
      >
        <MessageSquare className="w-5 h-5 text-[#0A0A0A]" />
      </button>

      <div className="w-[2px] h-[32px] bg-[#E8E8E0] mx-1"></div>

      <button
        onClick={toggleFullscreen}
        className={btnClass}
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
         {isFullscreen ? <Minimize className="w-5 h-5 text-[#0A0A0A]" /> : <Maximize className="w-5 h-5 text-[#0A0A0A]" />}
      </button>

      <div className="w-[2px] h-[32px] bg-[#E8E8E0] mx-1"></div>

      <button 
        onClick={handleLeave}
        className="h-[48px] px-6 flex items-center justify-center gap-2 rounded-[14px] border-[3px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] bg-[#FF3B30] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#0A0A0A] transition-all text-white font-heading font-bold ml-1"
      >
        <PhoneOff className="w-5 h-5 text-white" />
        Leave
      </button>

    </div>
  )
}
