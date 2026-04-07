import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string; threadId: string }> }
) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: communityId, threadId } = await context.params
    const body = await request.json()
    const { reply_id } = body // null to unset

    // Only thread author may mark solution
    const { data: thread } = await supabase
        .from('threads')
        .select('author_id')
        .eq('id', threadId)
        .eq('community_id', communityId)
        .single()

    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    if (thread.author_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Validate reply belongs to this thread (unless unsetting)
    if (reply_id) {
        const { data: reply } = await supabase
            .from('replies')
            .select('id')
            .eq('id', reply_id)
            .eq('thread_id', threadId)
            .single()

        if (!reply) return NextResponse.json({ error: 'Reply not found in thread' }, { status: 404 })
    }

    const { data: updated, error } = await supabase
        .from('threads')
        .update({ solution_reply_id: reply_id ?? null })
        .eq('id', threadId)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(updated)
}
