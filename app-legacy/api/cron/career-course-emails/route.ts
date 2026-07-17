/**
 * GET /api/cron/career-course-emails
 * Send weekly progress emails to career course enrollees.
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
  const today = new Date().toISOString().split('T')[0];

  // Active enrollments in career/workforce programs
  const { data: enrollments, error } = await db
    .from('lms_progress')
    .select(`
      user_id, course_id, progress_percent, last_activity_at,
      profiles!lms_progress_user_id_fkey(full_name, email),
      courses(title, program_id)
    `)
    .in('status', ['enrolled', 'in_progress'])
    .limit(200);

  if (error) {
    logger.error('[cron/career-course-emails] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const row of enrollments ?? []) {
    const profile = (row as any).profiles;
    const course = (row as any).courses;
    if (!profile?.email) continue;

    const progress = Math.round(row.progress_percent ?? 0);
    const lastActivity = row.last_activity_at
      ? new Date(row.last_activity_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'not yet';

    await sendEmail({
      to: profile.email,
      subject: `Your weekly progress — ${course?.title ?? 'your course'}`,
      html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>Here's your weekly progress update for <strong>${course?.title ?? 'your course'}</strong>:</p><ul><li>Progress: <strong>${progress}%</strong></li><li>Last activity: ${lastActivity}</li></ul>${progress < 100 ? `<p><a href="https://www.elevateforhumanity.org/lms/courses/${row.course_id}">Continue learning →</a></p>` : '<p>🎉 Course complete! Check your certificate in your dashboard.</p>'}<p>— Elevate for Humanity</p>`,
    }).catch((e: unknown) => logger.warn('[cron/career-course-emails] Email failed', { user_id: row.user_id, error: String(e) }));

    sent++;
  }

  logger.info('[cron/career-course-emails] Done', { sent });
  return NextResponse.json({ ok: true, sent });
});
