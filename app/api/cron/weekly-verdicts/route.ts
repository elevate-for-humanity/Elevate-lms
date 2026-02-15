
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// This route is called by scheduled cron weekly (Sunday 7:30 PM EST)
// Generates compliance verdicts for all active enrollments
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with service role key
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

    // Calculate current week (Monday-Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

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
        { status: 500 }
      );
    }

    const result = data?.[0] || {
      total_enrollments: 0,
      verdicts_created: 0,
      on_track: 0,
      behind: 0,
      no_activity: 0,
    };

    // Create alerts for BEHIND and NO_ACTIVITY students
    if (result.behind > 0 || result.no_activity > 0) {
      await createAlertsFromVerdicts(supabase, periodStart, periodEnd);
    }

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
        error:
          ('Internal server error') ||
          'Internal server err',
      },
      { status: 500 }
    );
  }
}

// Helper function to create alerts from verdicts
async function createAlertsFromVerdicts(
  supabase: any,
  periodStart: string,
  periodEnd: string
) {
  try {
    // Get all BEHIND and NO_ACTIVITY verdicts
    const { data: verdicts, error } = await supabase
      .from('reporting_verdicts')
      .select(
        `
        id,
        enrollment_id,
        status,
        required_hours,
        logged_hours,
        required_sessions,
        completed_sessions,
        enrollments!inner(
          student_id,
          partner_owner_user_id,
          profiles!enrollments_student_id_fkey(full_name)
        )
      `
      )
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .in('status', ['BEHIND', 'NO_ACTIVITY']);

    if (error || !verdicts || verdicts.length === 0) {
      return;
    }

    // Create alerts
    const alerts = verdicts.map((item: any) => {
      const enrollment = item.enrollments;
      const studentName = enrollment?.profiles?.full_name || 'Student';

      let message = '';
      let severity = 'medium';

      if (item.status === 'NO_ACTIVITY') {
        message = `${studentName} has no activity this week (0 of ${item.required_hours || 0} hours required).`;
        severity = 'high';
      } else {
        const hoursMissing = (item.required_hours || 0) - (item.logged_hours || 0);
        message = `${studentName} is behind this week (${item.logged_hours || 0} of ${item.required_hours || 0} hours). Missing: ${hoursMissing.toFixed(1)} hours.`;
        severity = 'medium';
      }

      return {
        alert_type: 'weekly_hours_check',
        severity,
        student_id: enrollment?.student_id,
        enrollment_id: item.enrollment_id,
        partner_user_id: enrollment?.partner_owner_user_id,
        message,
        payload: {
          verdict_id: item.id,
          period_start: periodStart,
          period_end: periodEnd,
          required_hours: item.required_hours,
          logged_hours: item.logged_hours,
          required_sessions: item.required_sessions,
          completed_sessions: item.completed_sessions,
        },
      };
    });

    await supabase.from('alert_notifications').insert(alerts);
  } catch (error) {
    logger.error("Unhandled error", error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow GET for manual testing (development only)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Method not allowed in production' },
      { status: 405 }
    );
  }

  return POST(request);
}
