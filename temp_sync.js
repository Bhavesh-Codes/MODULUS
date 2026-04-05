require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: communities, error } = await supabase.from('communities').select('id');
  if (error) { console.error('Error fetching communities:', error); return; }

  for (const community of communities) {
    const { count, error: countError } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', community.id)
      .in('role', ['peer', 'owner', 'curator']);
    
    if (count !== null) {
      await supabase.from('communities').update({ member_count: count }).eq('id', community.id);
      console.log(`Updated community ${community.id} to count ${count}`);
    }
  }
}
run();
