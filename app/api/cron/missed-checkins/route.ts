
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

    // Get all active apprenticeships
    const { data: apprenticeships, error } = await db
      .from('apprenticeship_enrollments')
      .select(
        `
        id,
        student_id,
        employer_id,
        program_id,
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
      // Check if student has checked in today
      const { data: todayLog, error: logError } = await db
        .from('ojt_hours_log')
        .select('id, check_in_time')
        .eq('apprenticeship_id', apprenticeship.id)
        .eq('work_date', today)
        .maybeSingle();

      if (logError) {
        logger.error('Error checking logs:', logError);
        continue;
      }

      // If no check-in found, send alert to employer
      const student = apprenticeship.student as any;
      const employer = apprenticeship.employer as any;
      const program = apprenticeship.program as any;
      
      if (!todayLog && employer?.email) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/apprentice/email-alerts`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'missed_checkin',
              apprenticeshipId: apprenticeship.id,
              data: {
                studentName: student?.full_name,
                employerEmail: employer.email,
                employerName: employer.full_name,
                programName: program?.name,
                date: today,
              },
            }),
          }
        );

        results.push({
          student: student?.full_name,
          employer: employer.full_name,
          status: response.ok ? 'alert_sent' : 'failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      alerts_sent: results.length,
      results,
    });
  } catch (error) { 
    logger.error('Missed check-ins cron error:', error);
    return NextResponse.json(
      { error: 'Failed to check missed check-ins' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/cron/missed-checkins', _GET);
