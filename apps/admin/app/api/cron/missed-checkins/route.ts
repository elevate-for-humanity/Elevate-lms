import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
    const today = new Date().toISOString().split('T')[0];

    // Get all active apprenticeships
    const { data: apprenticeships, error } = await supabase
      .from('program_enrollments')
      .select(
        `
        id,
        student_id,
        employer_id,
        program_id,
        student:profiles!program_enrollments_student_id_profiles_fkey(
          id,
          email,
          full_name
        ),
        employer:employers!program_enrollments_employer_id_fkey(
          id,
          contact_email,
          contact_name
        ),
        program:programs!fk_program_enrollments_program(
          id,
          name
        )
      `,
      )
      .eq('status', 'active')
      .eq('enrollment_type', 'apprentice');

    if (error) throw error;

    const results = [];

    for (const apprenticeship of apprenticeships || []) {
      // Check if student has checked in today
      const { data: todayLog, error: logError } = await supabase
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

      if (!todayLog && employer?.contact_email) {
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
                employerEmail: employer.contact_email,
                employerName: employer.contact_name,
                programName: program?.name,
                date: today,
              },
            }),
          },
        );

        results.push({
          student: student?.full_name,
          employer: employer.contact_name,
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
    return NextResponse.json({ error: 'Failed to check missed check-ins' }, { status: 500 });
  }
}
export const GET = withRuntime(withApiAudit('/api/cron/missed-checkins', _GET));
