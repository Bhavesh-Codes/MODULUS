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

    // Fetch up to 500 recent sessions for this community to derive unique labels
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('label')
      .eq('community_id', communityId)
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const labels = Array.from(new Set(data.filter(d => d.label).map(d => d.label)));

    return NextResponse.json(labels);
  } catch (error) {
    console.error('[FOCUS_LABELS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
