import { useTracks, VideoTrack } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { MicOff } from 'lucide-react'

export default function CircleVideoGrid() {
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false })
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false })

  const hasFocus = screenTracks.length > 0

  const renderVideoTile = (track: any, containerClasses: string) => (
    <div 
      key={track.participant.identity + track.source}
      className={`flex relative overflow-hidden bg-[#0A0A0A] border-[2px] border-[#0A0A0A] rounded-[24px] shadow-[4px_4px_0px_#0A0A0A] ${containerClasses}`}
    >
       <VideoTrack
          trackRef={track}
          className="h-full w-full object-cover"
       />
       <div className="absolute bottom-3 left-3 bg-[#FFD600] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] rounded-full px-3 py-1 flex items-center gap-2">
          <span className="font-mono text-[12px] font-bold text-[#0A0A0A]">
            {track.participant.identity || 'Participant'}
          </span>
          {!track.participant.isMicrophoneEnabled && (
            <MicOff className="w-3 h-3 text-[#0A0A0A]" />
          )}
       </div>
    </div>
  )

  if (hasFocus) {
    return (
      <div className="flex h-full w-full flex-col p-6 pb-[100px] gap-6 bg-white overflow-hidden">
        {/* Focused Hero Section */}
        <div className="flex-1 w-full min-h-0 bg-[#F5F5F0] border-[3px] border-[#0A0A0A] rounded-[32px] shadow-[6px_6px_0px_#0A0A0A] overflow-hidden relative">
           {screenTracks.length > 0 && <VideoTrack trackRef={screenTracks[0]} className="h-full w-full object-contain bg-[#0A0A0A]" />}
           {screenTracks.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-[#FF3B30] text-white border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] rounded-full px-4 py-2 flex items-center">
                 <span className="font-mono text-[14px] font-bold">Viewing: {screenTracks[0].participant.identity}'s Screen</span>
              </div>
           )}
        </div>

        {/* Participants Strip */}
        <div className="h-[200px] w-full shrink-0 flex items-center gap-4 overflow-x-auto overflow-y-hidden pt-2 pl-2 pr-2 pb-4 mb-[-16px]">
           {cameraTracks.map(t => renderVideoTile(t, 'h-[160px] aspect-video shrink-0 bg-[#0A0A0A]'))}
        </div>
      </div>
    )
  }

  // Pure Grid Section
  return (
    <div className="flex h-full w-full flex-col p-6 pb-[100px] overflow-y-auto bg-white">
      <div 
        className={`grid gap-6 w-full h-full ${
          cameraTracks.length === 1 ? 'grid-cols-1' :
          cameraTracks.length === 2 ? 'grid-cols-2' :
          cameraTracks.length <= 4 ? 'grid-cols-2 grid-rows-2' :
          'grid-cols-3'
        }`}
      >
        {cameraTracks.map(t => renderVideoTile(t, 'w-full h-full bg-[#0A0A0A]'))}
      </div>
    </div>
  )
}
