import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getEmailStats, getRecentFailures, checkEmailHealth } from '@/lib/email/monitor';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = (searchParams.get('timeframe') || '24h') as '24h' | '7d' | '30d';

    const [stats, failures, health] = await Promise.all([
      getEmailStats(timeframe),
      getRecentFailures(10),
      checkEmailHealth(),
    ]);

    return NextResponse.json({
      stats,
      failures,
      health,
      timeframe,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch email statistics' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/admin/email-stats', _GET);
