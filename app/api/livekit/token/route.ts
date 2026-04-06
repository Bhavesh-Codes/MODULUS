import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AccessToken } from 'livekit-server-sdk'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const room = request.nextUrl.searchParams.get('room')
  const communityId = request.nextUrl.searchParams.get('communityId')
  const username = request.nextUrl.searchParams.get('username')

  if (!room || !username || !communityId) {
    return NextResponse.json({ error: 'Missing room, communityId, or username parameters' }, { status: 400 })
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    console.error('LIVEKIT_API_KEY or LIVEKIT_API_SECRET is not set in environment variables.')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  // Namespace the room to strictly prevent collisions across communities
  const namespacedRoom = `${communityId}_${room}`

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity: username })
    at.addGrant({ roomJoin: true, room: namespacedRoom })

    const token = await at.toJwt()

    return NextResponse.json({ token })
  } catch (err: any) {
    console.error('Error generating LiveKit token:', err)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
