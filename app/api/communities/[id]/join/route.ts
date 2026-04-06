import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { syncMemberCount } from '../../sync'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const { data: community, error: fetchError } = await supabase
    .from('communities')
    .select('type')
    .eq('id', id)
    .single()

  if (fetchError || !community) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 })
  }

  const role = community.type === 'Private' ? 'pending' : 'peer'

  const { error } = await supabase
    .from('community_members')
    .insert([{ community_id: id, user_id: user.id, role }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (role === 'peer') {
    await syncMemberCount(supabase, id)
  }

  return NextResponse.json({ success: true, role })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await syncMemberCount(supabase, id)

  return NextResponse.json({ success: true })
}
