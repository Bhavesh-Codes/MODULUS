import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { syncMemberCount } from '../../../sync'

async function checkOwner(supabase: any, communityId: string, currentUserId: string) {
  const { data, error } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', currentUserId)
    .single()
  
  if (error || !data || data.role !== 'owner') {
    return false
  }
  return true
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string, userId: string }> }) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, userId } = await context.params

  const isOwner = await checkOwner(supabase, id, user.id)
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { role } = await request.json()

  const { error } = await supabase
    .from('community_members')
    .update({ role })
    .eq('community_id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (role === 'peer' || role === 'owner' || role === 'curator') {
    await syncMemberCount(supabase, id)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string, userId: string }> }) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, userId } = await context.params

  const isOwner = await checkOwner(supabase, id, user.id)
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await syncMemberCount(supabase, id)

  return NextResponse.json({ success: true })
}

