'use client'

import { use, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { useCircleRoomStore } from '@/lib/stores/useCircleRoomStore'

type Params = Promise<{ id: string; circleId: string }>

export default function CircleRoomPage(props: { params: Params }) {
  const { id, circleId } = use(props.params)
  const supabase = createClient()

  const { token, circleId: storedCircleId, setRoom } = useCircleRoomStore()
  const isThisRoom = storedCircleId === circleId && !!token

  useEffect(() => {
    if (isThisRoom) return // Already have a live token for this room — BackgroundCircleRoom handles the UI

    let mounted = true

    async function fetchToken() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const username = user.user_metadata?.name || user.id

      try {
        const res = await fetch(
          `/api/livekit/token?room=${encodeURIComponent(circleId)}&communityId=${id}&username=${encodeURIComponent(username)}`
        )
        if (res.ok) {
          const data = await res.json()
          if (mounted) {
            setRoom({ token: data.token, circleId, communityId: id, roomName: `${id}_${circleId}` })
          }
        } else {
          console.error('Failed to fetch LiveKit token', await res.text())
        }
      } catch (err) {
        console.error('Error fetching token:', err)
      }
    }

    fetchToken()
    return () => { mounted = false }
  }, [circleId, id, isThisRoom, setRoom, supabase])

  // Show a loader until the store has the token.
  // Once token is set, BackgroundCircleRoom in the layout renders the full room UI.
  if (!isThisRoom) {
    return (
      <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 w-full bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-[#FFD600]" />
        <p className="font-heading font-extrabold text-[20px] text-foreground">Connecting to Study Circle...</p>
      </div>
    )
  }

  // Token is in store — BackgroundCircleRoom (in layout) renders the full UI via FullRoomUI.
  // This page renders nothing itself to avoid double-mounting LiveKitRoom.
  return null
}
