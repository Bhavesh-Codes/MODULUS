import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: communityId } = await context.params

        const { data: membership, error: memberError } = await supabase
            .from('community_members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', user.id)
            .maybeSingle()

        if (memberError) return NextResponse.json({ step: 'membership', error: memberError }, { status: 500 })
        if (!membership || membership.role === 'pending') return NextResponse.json({ error: 'Not a member' }, { status: 403 })

        const { data: threads, error: threadsError } = await supabase
            .from('threads')
            .select('id, content, post_type, is_locked, solution_reply_id, created_at, author_id')
            .eq('community_id', communityId)
            .order('created_at', { ascending: false })

        if (threadsError) {
            return NextResponse.json({ step: 'threads', error: threadsError }, { status: 500 })
        }
        if (!threads?.length) return NextResponse.json([])

        const threadIds = threads.map(t => t.id)
        const authorIds = [...new Set(threads.map(t => t.author_id))]

        const fileIdsMatches = threads.map(t => t.content.match(/\[FILE:([a-f0-9\-]+)\]/i))
        const fileIds = [...new Set(fileIdsMatches.map(m => m ? m[1] : null).filter(Boolean))]

        const [
            { data: usersData, error: usersError },
            { data: allVotes, error: votesError },
            { data: myVotes, error: myVotesError },
            { data: replyRows, error: repliesError },
            { data: fileRows },
        ] = await Promise.all([
            supabase.from('users').select('id, name, profile_pic').in('id', authorIds),
            supabase.from('votes').select('target_id, value').eq('target_type', 'thread').in('target_id', threadIds),
            supabase.from('votes').select('target_id, value').eq('target_type', 'thread').in('target_id', threadIds).eq('user_id', user.id),
            supabase.from('replies').select('thread_id').in('thread_id', threadIds),
            fileIds.length > 0 ? supabase.from('files').select('id, r2_object_key').in('id', fileIds) : Promise.resolve({ data: [] }),
        ])

        if (usersError || votesError || myVotesError || repliesError) {
            const errObj = {
                step: 'batch_queries',
                usersError,
                votesError,
                myVotesError,
                repliesError,
            }
            return NextResponse.json(errObj, { status: 500 })
        }

        const userMap = new Map((usersData ?? []).map(u => [u.id, u]))
        const voteScoreMap = new Map<string, number>()
        for (const v of allVotes ?? []) {
            voteScoreMap.set(v.target_id, (voteScoreMap.get(v.target_id) ?? 0) + v.value)
        }
        const myVoteMap = new Map((myVotes ?? []).map(v => [v.target_id, v.value]))
        const replyCountMap = new Map<string, number>()
        for (const r of replyRows ?? []) {
            replyCountMap.set(r.thread_id, (replyCountMap.get(r.thread_id) ?? 0) + 1)
        }

        const enriched = threads.map(thread => {
            let clean_content = thread.content
            let imageFileId: string | null = null
            const fileMatch = clean_content.match(/\[FILE:([a-f0-9\-]+)\]/i)
            if (fileMatch) {
                imageFileId = fileMatch[1]
                clean_content = clean_content.replace(fileMatch[0], '').trim()
            }

            return {
                ...thread,
                content: clean_content,
                author: userMap.get(thread.author_id) ?? { id: thread.author_id, name: 'Unknown', profile_pic: null },
                vote_score: voteScoreMap.get(thread.id) ?? 0,
                reply_count: replyCountMap.get(thread.id) ?? 0,
                my_vote: myVoteMap.get(thread.id) ?? 0,
                image_file_id: imageFileId,
            }
        })

        return NextResponse.json(enriched)

    } catch (err: any) {
        console.error('UNHANDLED ERROR in GET /threads:', err)
        return NextResponse.json({ step: 'unhandled', error: err?.message ?? String(err) }, { status: 500 })
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: communityId } = await context.params

    const { data: membership } = await supabase
        .from('community_members')
        .select('role')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (!membership || membership.role === 'pending') {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const body = await request.json()
    const { content, post_type, image_file_id } = body

    if (!post_type || !['text', 'question', 'image'].includes(post_type)) {
        return NextResponse.json({ error: 'Invalid post_type' }, { status: 400 })
    }
    if (post_type !== 'image' && !content?.trim()) {
        return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const insertData: Record<string, unknown> = {
        community_id: communityId,
        author_id: user.id,
        content: content?.trim() ?? '',
        post_type,
    }

    const { data: thread, error } = await supabase
        .from('threads')
        .insert(insertData)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(thread, { status: 201 })
}// BUST CACHE Tue Apr  7 23:32:50 IST 2026
// CACHE BUST Tue Apr  7 23:44:24 IST 2026
