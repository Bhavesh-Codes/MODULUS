import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { syncMemberCount } from './sync'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, description, type } = await request.json()

    // 1. Insert into communities
    const { data: community, error: insertError } = await supabase
      .from('communities')
      .insert([{ 
        name, 
        description, 
        type, 
        owner_id: user.id 
      }])
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 2. Insert into community_members
    const { error: memberError } = await supabase
      .from('community_members')
      .insert([{
        community_id: community.id,
        user_id: user.id,
        role: 'owner'
      }])

    if (memberError) {
      // Typically we'd roll back here, but we'll return the error for now
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    await syncMemberCount(supabase, community.id)

    // Re-fetch community to return the updated record
    const { data: updatedCommunity } = await supabase
      .from('communities')
      .select('*')
      .eq('id', community.id)
      .single()

    return NextResponse.json(updatedCommunity || community)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  let query = supabase
    .from('communities')
    .select('*')
  
  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: communities, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: memberships } = await supabase
    .from('community_members')
    .select('community_id, role')
    .eq('user_id', user.id)

  const membershipMap = new Map()
  if (memberships) {
    memberships.forEach(m => membershipMap.set(m.community_id, m.role))
  }

  const enhancedCommunities = communities.map((c: any) => ({
    ...c,
    membership: membershipMap.has(c.id) ? { role: membershipMap.get(c.id) } : null
  }))

  return NextResponse.json(enhancedCommunities)
}
