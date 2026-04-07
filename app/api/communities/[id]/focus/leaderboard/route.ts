import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all sessions for the community along with user details
    const { data: sessions, error } = await supabase
      .from('focus_sessions')
      .select(`
        duration_seconds,
        user_id,
        users:user_id (id, name, profile_pic)
      `)
      .eq('community_id', communityId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Since Supabase doesn't support GROUP BY aggregations with relations easily,
    // we aggregate the data in memory.
    const leaderboardMap = new Map<string, { id: string, name: string, profile_pic: string | null, total_duration: number }>();

    for (const session of sessions || []) {
      const u = session.users as any; // foreign key relation
      if (!u) continue; // In case user was deleted
      
      const userId = Array.isArray(u) ? u[0]?.id : u?.id;
      const userName = Array.isArray(u) ? u[0]?.name : u?.name;
      const userPic = Array.isArray(u) ? u[0]?.profile_pic : u?.profile_pic;

      if (!userId) continue;

      if (!leaderboardMap.has(userId)) {
        leaderboardMap.set(userId, {
          id: userId,
          name: userName,
          profile_pic: userPic,
          total_duration: 0
        });
      }
      
      const current = leaderboardMap.get(userId)!;
      current.total_duration += (session.duration_seconds || 0);
    }

    // Convert to array and sort by total duration descending
    const leaderboard = Array.from(leaderboardMap.values()).sort((a, b) => b.total_duration - a.total_duration);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('[FOCUS_LEADERBOARD_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
