import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper: build nested reply tree from flat list
function buildTree(replies: any[], parentId: string | null = null): any[] {
    return replies
        .filter((r) => r.parent_reply_id === parentId)
        .map((r) => ({ ...r, children: buildTree(replies, r.id) }))
}

export async function GET(
    _request: Request,
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

    const { data: thread, error: threadError } = await supabase
        .from('threads')
        .select(`
      id, content, post_type, is_locked, solution_reply_id, created_at,
      author_id
    `)
        .eq('id', threadId)
        .eq('community_id', communityId)
        .single()

    if (threadError || !thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

    // Votes for thread
    const { data: threadVotes } = await supabase
        .from('votes')
        .select('value')
        .eq('target_type', 'thread')
        .eq('target_id', threadId)

    const threadVoteScore = (threadVotes ?? []).reduce((s, v) => s + v.value, 0)

    const { data: myThreadVote } = await supabase
        .from('votes')
        .select('value')
        .eq('target_type', 'thread')
        .eq('target_id', threadId)
        .eq('user_id', user.id)
        .maybeSingle()

    const { data: flatReplies, error: repliesError } = await supabase
        .from('replies')
        .select(`
      id, parent_reply_id, content, created_at,
      author_id
    `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

    if (repliesError) return NextResponse.json({ error: repliesError.message }, { status: 500 })

    // Build author profile map
    const authorIds = Array.from(new Set([
        thread.author_id,
        ...(flatReplies ?? []).map(r => r.author_id)
    ]))
    const { data: users } = await supabase
        .from('users')
        .select('id, name, profile_pic')
        .in('id', authorIds)

    const userMap = new Map(users?.map(u => [u.id, u]) ?? [])
    const getAuthor = (id: string) => userMap.get(id) ?? { id, name: 'Unknown', profile_pic: null }

    let imageFileId: string | null = null
    let clean_content = thread.content
    const fileMatch = clean_content.match(/\[FILE:([a-f0-9\-]+)\]/i)
    if (fileMatch) {
        imageFileId = fileMatch[1]
        clean_content = clean_content.replace(fileMatch[0], '').trim()
    }

    // Enrich each reply with votes and manual author
    const repliesWithVotes = await Promise.all(
        (flatReplies ?? []).map(async (reply) => {
            const [{ data: votes }, { data: myVote }] = await Promise.all([
                supabase.from('votes').select('value').eq('target_type', 'reply').eq('target_id', reply.id),
                supabase.from('votes').select('value').eq('target_type', 'reply').eq('target_id', reply.id).eq('user_id', user.id).maybeSingle(),
            ])
            const voteScore = (votes ?? []).reduce((s, v) => s + v.value, 0)
            return {
                ...reply,
                author: getAuthor(reply.author_id),
                vote_score: voteScore,
                my_vote: myVote?.value ?? 0
            }
        })
    )

    const replyTree = buildTree(repliesWithVotes)

    return NextResponse.json({
        ...thread,
        content: clean_content,
        author: getAuthor(thread.author_id),
        vote_score: threadVoteScore,
        my_vote: myThreadVote?.value ?? 0,
        image_file_id: imageFileId,
        replies: replyTree,
        current_user_id: user.id,
    })
}

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string; threadId: string }> }
) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: communityId, threadId } = await context.params
    const body = await request.json()

    const { data: thread } = await supabase
        .from('threads')
        .select('author_id')
        .eq('id', threadId)
        .eq('community_id', communityId)
        .single()

    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

    const { data: membership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle()

    const isAuthor = thread.author_id === user.id
    const isPrivileged = membership?.role === 'owner' || membership?.role === 'curator'

    if (!isAuthor && !isPrivileged) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof body.is_locked === 'boolean') updates.is_locked = body.is_locked

    const { data: updated, error } = await supabase
        .from('threads')
        .update(updates)
        .eq('id', threadId)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(updated)
}

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string; threadId: string }> }
) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: communityId, threadId } = await context.params

    const { data: thread } = await supabase
        .from('threads')
        .select('author_id')
        .eq('id', threadId)
        .eq('community_id', communityId)
        .single()

    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

    const { data: membership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle()

    const isAuthor = thread.author_id === user.id
    const isPrivileged = membership?.role === 'owner' || membership?.role === 'curator'

    if (!isAuthor && !isPrivileged) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase.from('threads').delete().eq('id', threadId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
// CACHE BUST Tue Apr  7 23:44:24 IST 2026
