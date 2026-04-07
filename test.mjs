import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://oiuhelqyrmcpprqofopj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdWhlbHF5cm1jcHBycW9mb3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTMxNTgzNSwiZXhwIjoyMDkwODkxODM1fQ.GrlFnA0s362NJilK93M05lE0qhbrU9jTKJ7E_eNcAs0'
);

async function run() {
    const communityId = '87b352ed-97a5-402d-a4d6-4a1db8699647';

    const { data: threads, error: threadsError } = await supabase
        .from('threads')
        .select('id, content, post_type, is_locked, solution_reply_id, created_at, author_id')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

    if (threadsError) {
        console.error('threadsError:', threadsError);
        return;
    }

    if (!threads?.length) {
        console.log('No threads found');
        return;
    }

    const threadIds = threads.map(t => t.id);
    const authorIds = [...new Set(threads.map(t => t.author_id))];

    const results = await Promise.all([
        supabase.from('users').select('id, name, profile_pic').in('id', authorIds),
        supabase.from('votes').select('target_id, value').eq('target_type', 'thread').in('target_id', threadIds),
        // Dummy user ID since we don't have auth here
        supabase.from('votes').select('target_id, value').eq('target_type', 'thread').in('target_id', threadIds).eq('user_id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('replies').select('thread_id').in('thread_id', threadIds),
    ]);

    console.log('usersError:', results[0].error);
    console.log('votesError:', results[1].error);
    console.log('myVotesError:', results[2].error);
    console.log('repliesError:', results[3].error);
    console.log('All threads:', threads);
}

run();
