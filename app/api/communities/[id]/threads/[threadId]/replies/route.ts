import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string; threadId: string }> }
) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: communityId, threadId } = await context.params

    const { data: membership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (!membership || membership.role === 'pending') {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // Check thread exists and is not locked
    const { data: thread } = await supabase
        .from('threads')
        .select('id, is_locked')
        .eq('id', threadId)
        .eq('community_id', communityId)
        .single()

    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    if (thread.is_locked) return NextResponse.json({ error: 'Thread is locked' }, { status: 403 })

    const body = await request.json()
    const { content, parent_reply_id } = body

    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

    const { data: reply, error } = await supabase
        .from('replies')
        .insert({
            thread_id: threadId,
            author_id: user.id,
            content: content.trim(),
            parent_reply_id: parent_reply_id ?? null,
        })
        .select(`
      id, parent_reply_id, content, created_at,
      author_id
    `)
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: userData } = await supabase
        .from('users')
        .select('id, name, profile_pic')
        .eq('id', user.id)
        .single()

    const author = userData ?? { id: user.id, name: 'Unknown', profile_pic: null }

    return NextResponse.json({ ...reply, author, vote_score: 0, my_vote: 0, children: [] }, { status: 201 })
}
// BUST CACHE Tue Apr  7 22:59:22 IST 2026
