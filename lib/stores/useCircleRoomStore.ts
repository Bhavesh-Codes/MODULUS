import { create } from 'zustand'

interface CircleRoomState {
    /** LiveKit JWT token for the active room */
    token: string | null
    /** The circle document ID */
    circleId: string | null
    /** The community this circle belongs to */
    communityId: string | null
    /** Human-readable room name (namespaced: communityId_circleId) */
    roomName: string | null

    setRoom: (payload: { token: string; circleId: string; communityId: string; roomName: string }) => void
    clearRoom: () => void
}

export const useCircleRoomStore = create<CircleRoomState>((set) => ({
    token: null,
    circleId: null,
    communityId: null,
    roomName: null,

    setRoom: (payload) => set(payload),
    clearRoom: () => set({ token: null, circleId: null, communityId: null, roomName: null }),
}))
