/**
 * GET /api/cron/testing-no-show
 * Flag exam sessions scheduled for yesterday that were never started (no-show).
 * Notifies the proctor and writes an admin alert.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();

  // Sessions scheduled yesterday that are still in 'scheduled' status
  const yesterdayStart = new Date();
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const { data: noShows, error } = await db
    .from('exam_sessions')
    .select('id, student_name, student_email, exam_name, provider, proctor_id, scheduled_at')
    .eq('status', 'scheduled')
    .gte('scheduled_at', yesterdayStart.toISOString())
    .lte('scheduled_at', yesterdayEnd.toISOString());

  if (error) {
    logger.error('[cron/testing-no-show] DB error', { error: error.message });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = noShows ?? [];
  let flagged = 0;

  for (const session of rows) {
    // Mark as no-show
    await db
      .from('exam_sessions')
      .update({ status: 'no_show', updated_at: new Date().toISOString() })
      .eq('id', session.id)
      .then(undefined, (err) =>
        logger.error('[cron/testing-no-show] Failed to update session status', { sessionId: session.id, error: String(err) }),
      );

    // Admin alert
    await db.from('admin_alerts').insert({
      alert_type: 'exam_no_show',
      severity: 'medium',
      message: `No-show: ${session.student_name} did not appear for ${session.exam_name} (${session.provider}).`,
      metadata: { session_id: session.id, student_email: session.student_email, scheduled_at: session.scheduled_at },
    }).then(undefined, (err) =>
      logger.error('[cron/testing-no-show] Failed to insert admin alert', { error: String(err) }),
    );

    // Notify student if email on file
    if (session.student_email) {
      await sendEmail({
        to: session.student_email,
        subject: `Missed Exam Appointment — ${session.exam_name}`,
        html: `<p>Hi ${session.student_name},</p><p>We noticed you missed your scheduled exam appointment for <strong>${session.exam_name}</strong>. Please contact your instructor to reschedule.</p><p>— Elevate for Humanity</p>`,
      }).catch((err) =>
        logger.error('[cron/testing-no-show] Failed to send no-show email', { sessionId: session.id, error: String(err) }),
      );
    }

    flagged++;
  }

  logger.info('[cron/testing-no-show] flagged', { flagged });
  return NextResponse.json({ ok: true, flagged });
});
