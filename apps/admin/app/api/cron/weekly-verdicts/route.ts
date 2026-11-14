import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// This route is called by scheduled cron weekly (Sunday 7:30 PM EST)
// Generates compliance verdicts for all active enrollments
async function _POST(request: NextRequest) {
  try {
    await hydrateProcessEnv();
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await hydrateProcessEnv();
    const supabase = await requireAdminClient();

    // Calculate current week (Monday-Sunday)
    const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Indiana/Indianapolis' }).format(new Date());
    const today = new Date(localDate + 'T12:00:00Z');
    const dayOfWeek = today.getUTCDay(); // 0=Sunday, 1=Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + daysToMonday);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const periodStart = monday.toISOString().slice(0, 10);
    const periodEnd = sunday.toISOString().slice(0, 10);

    // Call the database function
    const { data, error }: any = await supabase.rpc('generate_reporting_verdicts', {
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Internal server error',
          period_start: periodStart,
          period_end: periodEnd,
        },
        { status: 500 },
      );
    }

    const result = data?.[0] || {
      total_enrollments: 0,
      verdicts_created: 0,
      on_track: 0,
      behind: 0,
      no_activity: 0,
    };

    // The reporting RPC persists verdicts and deduplicated dashboard notices atomically.

    return NextResponse.json({
      ok: true,
      period_start: periodStart,
      period_end: periodEnd,
      total_enrollments: result.total_enrollments,
      verdicts_created: result.verdicts_created,
      on_track: result.on_track,
      behind: result.behind,
      no_activity: result.no_activity,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}

// Allow GET for manual testing (development only)
async function _GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Method not allowed in production' }, { status: 405 });
  }

  return POST(request);
}
export const GET = withRuntime(withApiAudit('/api/cron/weekly-verdicts', _GET));
export const POST = withRuntime(withApiAudit('/api/cron/weekly-verdicts', _POST));
