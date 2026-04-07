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

    // Fetch user sessions for the community
    const { data: sessions, error } = await supabase
      .from('focus_sessions')
      .select('duration_seconds, label, started_at')
      .eq('community_id', communityId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate Bar Chart data (Hours per label)
    const labelMap = new Map<string, number>();
    // Aggregate Line Chart data (Trends over time by date)
    const dateMap = new Map<string, number>(); // YYYY-MM-DD -> seconds

    for (const session of sessions || []) {
      const dur = session.duration_seconds || 0;
      
      // Bar
      const label = session.label || 'Unlabeled';
      labelMap.set(label, (labelMap.get(label) || 0) + dur);

      // Line
      if (session.started_at) {
        const d = new Date(session.started_at);
        const dateStr = d.toISOString().split('T')[0]; // simple YYYY-MM-DD
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + dur);
      }
    }

    const barChartData = Array.from(labelMap.entries()).map(([name, seconds]) => ({
      name,
      hours: +(seconds / 3600).toFixed(2),
    }));

    // Sort dates chronologically for the line chart
    const lineChartData = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, seconds]) => ({
        date,
        hours: +(seconds / 3600).toFixed(2),
      }));

    return NextResponse.json({ barChartData, lineChartData });
  } catch (error) {
    console.error('[FOCUS_ANALYTICS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
