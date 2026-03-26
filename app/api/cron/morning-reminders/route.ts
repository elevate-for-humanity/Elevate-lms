
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
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

    // Get all active apprenticeships with notification settings
    const { data: notifications, error } = await supabase
      .from('apprentice_notifications')
      .select(
        `
        *,
        apprenticeship:apprenticeship_enrollments(
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
        )
      `
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
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/apprentice/email-alerts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'checkin_reminder',
            apprenticeshipId: apprenticeship.id,
            data: {
              studentName: apprenticeship.student.full_name,
              studentEmail: apprenticeship.student.email,
              programName: apprenticeship.program?.name,
              employerName: apprenticeship.employer?.full_name,
            },
          }),
        }
      );

      results.push({
        student: apprenticeship.student.full_name,
        status: response.ok ? 'sent' : 'failed',
      });

      // Update last_sent_at
      await supabase
        .from('apprentice_notifications')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', notification.id);
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      results,
    });
  } catch (error) { 
    logger.error('Morning reminders cron error:', error);
    return NextResponse.json(
      { error: 'Failed to send morning reminders' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/cron/morning-reminders', _GET);
