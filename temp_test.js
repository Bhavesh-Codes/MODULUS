require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('communities').select('*, community_members(count)').not('community_members.role', 'eq', 'pending');
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error(error);
}
run();
