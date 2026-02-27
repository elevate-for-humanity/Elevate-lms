import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@supabase/supabase-js';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// This route is called by scheduled cron daily at 6 AM
// Cron expression: 0 11 * * * (11:00 UTC = 6:00 AM EST)
async function _POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const ymd = yesterday.toISOString().slice(0, 10);

    // Call the database function
    const { data, error }: any = await supabase.rpc('run_daily_attendance_alerts', {
      p_date: ymd,
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Internal server error',
          date: ymd,
        },
        { status: 500 }
      );
    }

    const result = data?.[0] || {
      processed_count: 0,
      alert_count: 0,
      critical_count: 0,
    };

    // Optional: Send daily digest emails here
    if (result.alert_count > 0) {
      // Trigger daily digest email campaign
      // await sendDailyDigestEmails(supabase, ymd);
    }

    return NextResponse.json({
      ok: true,
      date: ymd,
      processed: result.processed_count,
      alerts_created: result.alert_count,
      critical_alerts: result.critical_count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) { 
    return NextResponse.json(
      {
        ok: false,
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing (remove in production)
async function _GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Method not allowed in production' },
      { status: 405 }
    );
  }

  // Manually trigger the cron job for testing
  return POST(request);
}
export const GET = withApiAudit('/api/cron/daily-attendance-alerts', _GET);
export const POST = withApiAudit('/api/cron/daily-attendance-alerts', _POST);
