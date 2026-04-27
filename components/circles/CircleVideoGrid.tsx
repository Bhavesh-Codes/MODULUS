import { useTracks, VideoTrack } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { MicOff } from 'lucide-react'

export default function CircleVideoGrid() {
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false })
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false })

  const hasFocus = screenTracks.length > 0

  // ── Tile renderer ──────────────────────────────────────────────────────────
  const renderVideoTile = (track: any, containerClasses: string) => (
    <div
      key={track.participant.identity + track.source}
      className={`flex relative overflow-hidden bg-[#0A0A0A] border-[2px] border-[#0A0A0A] rounded-[20px] md:rounded-[24px] shadow-[3px_3px_0px_#0A0A0A] md:shadow-[4px_4px_0px_#0A0A0A] ${containerClasses}`}
    >
      <VideoTrack
        trackRef={track}
        className="h-full w-full object-cover"
      />
      <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-[#FFD600] border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] rounded-full px-2 md:px-3 py-0.5 md:py-1 flex items-center gap-1.5">
        <span className="font-mono text-[11px] md:text-[12px] font-bold text-[#0A0A0A]">
          {track.participant.identity || 'Participant'}
        </span>
        {!track.participant.isMicrophoneEnabled && (
          <MicOff className="w-3 h-3 text-[#0A0A0A]" />
        )}
      </div>
    </div>
  )

  // ── Screen-share focus layout ──────────────────────────────────────────────
  if (hasFocus) {
    return (
      <div className="flex h-full w-full flex-col p-2 md:p-6 md:pb-[100px] gap-2 md:gap-6 bg-white overflow-hidden">
        {/* Focused Hero */}
        <div className="flex-1 w-full min-h-0 bg-[#F5F5F0] border-[3px] border-[#0A0A0A] rounded-[24px] md:rounded-[32px] shadow-[4px_4px_0px_#0A0A0A] md:shadow-[6px_6px_0px_#0A0A0A] overflow-hidden relative">
          {screenTracks.length > 0 && <VideoTrack trackRef={screenTracks[0]} className="h-full w-full object-contain bg-[#0A0A0A]" />}
          {screenTracks.length > 0 && (
            <div className="absolute bottom-3 left-3 bg-[#FF3B30] text-white border-[2px] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] rounded-full px-3 py-1 flex items-center">
              <span className="font-mono text-[12px] md:text-[14px] font-bold">
                {screenTracks[0].participant.identity}&apos;s Screen
              </span>
            </div>
          )}
        </div>

        {/* Participants Strip — smaller on mobile */}
        <div className="h-[80px] md:h-[160px] w-full shrink-0 flex items-center gap-2 md:gap-4 overflow-x-auto overflow-y-hidden px-1 pb-1">
          {cameraTracks.map(t => renderVideoTile(t, 'h-full aspect-[3/4] shrink-0 bg-[#0A0A0A]'))}
        </div>
      </div>
    )
  }

  // ── Camera-only grid ───────────────────────────────────────────────────────
  const count = cameraTracks.length

  // Solo: fill the whole container height (most impactful use of screen)
  if (count === 1) {
    return (
      <div className="flex h-full w-full p-2 md:p-6 md:pb-[100px] bg-white">
        {renderVideoTile(cameraTracks[0], 'w-full h-full flex-1 bg-[#0A0A0A]')}
      </div>
    )
  }

  // 2+ participants:
  // Mobile  → always 1 column, each tile has a fixed aspect ratio → scrollable
  // Desktop → follows participant count (2-col, 2x2, 3-col)
  const desktopGrid =
    count === 2 ? 'md:grid-cols-2' :
      count <= 4 ? 'md:grid-cols-2' :
        'md:grid-cols-3'

  return (
    <div className="h-full w-full overflow-y-auto bg-white p-2 md:p-6 md:pb-[100px]">
      <div className={`grid grid-cols-1 ${desktopGrid} gap-2 md:gap-6 w-full`}>
        {cameraTracks.map(t =>
          // Each tile: full-width on mobile with a 4:3 aspect ratio so it's tall enough to see faces
          renderVideoTile(t, 'w-full aspect-[4/3] md:aspect-video bg-[#0A0A0A]')
        )}
      </div>
    </div>
  )
}
