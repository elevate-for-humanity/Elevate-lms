// pre-auth-registry: exempt — cron route, runs as service role with no user session
/**
 * GET /api/cron/weekly-verdicts
 * Process pending instructor verdicts (lab/assignment sign-offs) older than 5 days.
 * Escalates to admin if still unreviewed.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STALE_DAYS = 5;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: stale, error } = await db
    .from('step_submissions')
    .select(`
      id, user_id, lesson_id, step_type, submitted_at,
      profiles!step_submissions_user_id_fkey (full_name, email)
    `)
    .eq('status', 'pending')
    .lt('submitted_at', cutoff)
    .limit(100);

  if (error) {
    logger.error('[cron/weekly-verdicts] DB error', { error: error.message });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = stale ?? [];
  let escalated = 0;

  for (const sub of rows) {
    // Insert admin alert for each stale submission
    await db.from('admin_alerts').insert({
      alert_type: 'stale_submission',
      severity: 'medium',
      message: `Submission for ${sub.step_type} (lesson ${sub.lesson_id}) by ${(sub as any).profiles?.full_name ?? sub.user_id} has been pending for ${STALE_DAYS}+ days.`,
      metadata: { submission_id: sub.id, user_id: sub.user_id, lesson_id: sub.lesson_id, submitted_at: sub.submitted_at },
    }).then(undefined, (err) =>
      logger.error('[cron/weekly-verdicts] Failed to insert admin alert', { submissionId: sub.id, error: String(err) }),
    );
    escalated++;
  }

  // Notify admin if any escalations
  if (escalated > 0) {
    await sendEmail({
      to: 'elevate4humanityedu@gmail.com',
      subject: `${escalated} Submission(s) Awaiting Instructor Review`,
      html: `<p>${escalated} lab/assignment submission(s) have been pending instructor sign-off for ${STALE_DAYS}+ days.</p><p><a href="https://www.elevateforhumanity.org/admin/instructor/submissions">Review Submissions →</a></p>`,
    }).catch((err) =>
      logger.error('[cron/weekly-verdicts] Failed to send escalation email', { error: String(err) }),
    );
  }

  logger.info('[cron/weekly-verdicts] escalated', { escalated });
  return NextResponse.json({ ok: true, escalated });
});
