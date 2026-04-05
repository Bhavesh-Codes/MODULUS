import { SupabaseClient } from '@supabase/supabase-js'

export async function syncMemberCount(supabase: SupabaseClient, communityId: string) {
  const { count, error } = await supabase
    .from('community_members')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', communityId)
    .in('role', ['peer', 'owner', 'curator'])

  if (!error && count !== null) {
    await supabase.from('communities').update({ member_count: count }).eq('id', communityId)
  }
}
