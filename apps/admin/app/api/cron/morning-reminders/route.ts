import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
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
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await requireAdminClient();

    // Get all active apprenticeships with notification settings
    const { data: notifications, error } = await supabase
      .from('apprentice_notifications')
      .select(
        `
        *,
        apprenticeship:program_enrollments!apprentice_notifications_apprenticeship_id_fkey(
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
        )
      `,
      )
      .eq('notification_type', 'checkin_reminder')
      .eq('enabled', true)
      .contains('days_of_week', [new Date().getDay()]);

    if (error) throw error;

    const results = [];

    for (const notification of notifications || []) {
      const { apprenticeship } = notification;
      if (!apprenticeship?.student?.email) continue;

      // Send reminder email
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org'}/api/apprentice/email-alerts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${process.env.CRON_SECRET}` },
            signal: AbortSignal.timeout(10_000),
          body: JSON.stringify({
            type: 'checkin_reminder',
            apprenticeshipId: apprenticeship.id,
            data: {
              studentName: apprenticeship.student.full_name,
              studentEmail: apprenticeship.student.email,
              programName: apprenticeship.program?.name,
              employerName: apprenticeship.employer?.contact_name,
            },
          }),
        },
      );

      results.push({
        student: apprenticeship.student.full_name,
        status: response.ok ? 'sent' : 'failed',
      });

      // A failed delivery must remain eligible for the next scheduled attempt.
      if (!response.ok) continue;
      const { error: updateError } = await supabase
        .from('apprentice_notifications')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', notification.id);
      if (updateError) throw updateError;
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((result) => result.status === 'sent').length,
      results,
    });
  } catch (error) {
    logger.error('Morning reminders cron error:', error);
    return NextResponse.json({ error: 'Failed to send morning reminders' }, { status: 500 });
  }
}
export const GET = withRuntime(withApiAudit('/api/cron/morning-reminders', _GET));
