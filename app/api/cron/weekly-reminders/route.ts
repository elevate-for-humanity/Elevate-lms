/**
 * GET /api/cron/weekly-reminders
 * Send weekly progress reminders to enrolled learners with < 50% completion.
 * Runs Monday mornings.
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

  const { data: learners, error } = await db
    .from('lms_progress')
    .select(`
      id, user_id, course_id, progress_percent, last_activity_at,
      profiles!lms_progress_user_id_fkey (full_name, email),
      courses (title)
    `)
    .in('status', ['enrolled', 'in_progress'])
    .lt('progress_percent', 50)
    .limit(300);

  if (error) {
    logger.error('[cron/weekly-reminders] DB error', { error: error.message });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const row of learners ?? []) {
    const profile = (row as any).profiles;
    const course = (row as any).courses;
    if (!profile?.email) continue;

    const pct = Math.round(row.progress_percent ?? 0);
    const courseTitle = course?.title ?? 'your course';

    await sendEmail({
      to: profile.email,
      subject: `Keep going — you're ${pct}% through ${courseTitle}`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#1e293b">Weekly Check-In</h2>
  <p>Hi ${profile.full_name ?? 'there'},</p>
  <p>You're <strong>${pct}% complete</strong> in <strong>${courseTitle}</strong>. Keep up the momentum — consistent progress is the key to earning your credential.</p>
  <p style="margin-top:24px">
    <a href="https://www.elevateforhumanity.org/lms/courses" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Continue Learning →</a>
  </p>
  <p style="color:#64748b;font-size:13px;margin-top:24px">You're receiving this because you're enrolled in an Elevate for Humanity program.</p>
</div>
      `.trim(),
    }).catch((err) =>
      logger.error('[cron/weekly-reminders] Failed to send reminder', { userId: row.user_id, error: String(err) }),
    );
    sent++;
  }

  logger.info('[cron/weekly-reminders] sent', { sent });
  return NextResponse.json({ ok: true, sent });
});
