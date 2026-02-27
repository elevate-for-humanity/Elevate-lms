
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

// Using nodejs runtime for better compatibility with Supabase

async function _GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const today = new Date().toISOString().split('T')[0];

    // Get all active apprenticeships with today's hours
    const { data: apprenticeships, error } = await db
      .from('apprenticeship_enrollments')
      .select(
        `
        id,
        student_id,
        employer_id,
        hours_completed,
        hours_required,
        student:profiles!apprenticeship_enrollments_student_id_fkey(
          id,
          email,
          full_name
        ),
        employer:profiles!apprenticeship_enrollments_employer_id_fkey(
          id,
          email,
          full_name
        ),
        program:programs(
          id,
          name
        )
      `
      )
      .eq('status', 'active');

    if (error) throw error;

    const results = [];

    for (const apprenticeship of apprenticeships || []) {
      // Get today's hours
      const { data: todayLog, error: logError } = await db
        .from('ojt_hours_log')
        .select('total_hours, check_in_time, check_out_time, approved')
        .eq('apprenticeship_id', apprenticeship.id)
        .eq('work_date', today)
        .maybeSingle();

      if (logError) {
        logger.error('Error fetching logs:', logError);
        continue;
      }

      // Only send summary if student checked in today
      const student = apprenticeship.student as any;
      const program = apprenticeship.program as any;
      
      if (todayLog && student?.email) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/apprentice/email-alerts`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'daily_summary',
              apprenticeshipId: apprenticeship.id,
              data: {
                studentName: student.full_name,
                studentEmail: student.email,
                programName: program?.name,
                todayHours: todayLog.total_hours || 0,
                totalHours: apprenticeship.hours_completed || 0,
                requiredHours: apprenticeship.hours_required || 2000,
                checkInTime: todayLog.check_in_time,
                checkOutTime: todayLog.check_out_time,
                approved: todayLog.approved,
                date: today,
              },
            }),
          }
        );

        results.push({
          student: student.full_name,
          hours: todayLog.total_hours,
          status: response.ok ? 'sent' : 'failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      summaries_sent: results.length,
      results,
    });
  } catch (error) { 
    logger.error('End of day summary cron error:', error);
    return NextResponse.json(
      { error: 'Failed to send end of day summaries' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/cron/end-of-day-summary', _GET);
