import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const body = await request.json();
    const { label, timer_type, duration_seconds } = body;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!label || !timer_type || duration_seconds === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        community_id: communityId,
        user_id: user.id,
        label,
        timer_type,
        duration_seconds: Math.round(duration_seconds),
      })
      .select()
      .single();

    if (error) {
      console.error('[FOCUS_SESSIONS_POST_ERROR_SUPABASE]', error);
      console.error('FULL SUPABASE ERROR:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[FOCUS_SESSIONS_POST_ERROR_CATCH]', error);
    console.error('FULL SUPABASE ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
