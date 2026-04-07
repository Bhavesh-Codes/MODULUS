import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string; threadId: string; replyId: string }> }
) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { threadId, replyId } = await context.params

    const { data: reply } = await supabase
        .from('replies')
        .select('author_id')
        .eq('id', replyId)
        .eq('thread_id', threadId)
        .single()

    if (!reply) return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    if (reply.author_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase.from('replies').delete().eq('id', replyId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
