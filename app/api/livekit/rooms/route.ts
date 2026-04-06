import { NextRequest, NextResponse } from "next/server"
import { RoomServiceClient } from "livekit-server-sdk"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const communityId = req.nextUrl.searchParams.get("communityId")
  if (!communityId) {
    return NextResponse.json({ error: "Missing communityId" }, { status: 400 })
  }

  let host = process.env.NEXT_PUBLIC_LIVEKIT_URL
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!host || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit config missing" }, { status: 500 })
  }

  // RoomServiceClient natively requires http/https instead of wss/ws
  host = host.replace('wss://', 'https://').replace('ws://', 'http://')

  try {
    const svc = new RoomServiceClient(host, apiKey, apiSecret)
    const rooms = await svc.listRooms()
    
    const prefix = `${communityId}_`
    const activeRooms = rooms
      .filter(r => r.name.startsWith(prefix))
      .map(r => ({
        name: r.name.replace(prefix, ''),
        numParticipants: r.numParticipants,
        maxParticipants: r.maxParticipants
      }))

    return NextResponse.json({ rooms: activeRooms })
  } catch (error) {
    console.error("Failed to list rooms", error)
    return NextResponse.json({ error: "Failed to list rooms" }, { status: 500 })
  }
}
