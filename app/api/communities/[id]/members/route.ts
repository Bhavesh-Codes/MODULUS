import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const { data: members, error } = await supabase
    .from('community_members')
    .select(`
      user_id,
      role,
      joined_at,
      users (
        id,
        name,
        profile_pic
      )
    `)
    .eq('community_id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const formatted = members.map(m => ({
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    user: Array.isArray(m.users) ? m.users[0] : m.users
  }))

  return NextResponse.json(formatted)
}
