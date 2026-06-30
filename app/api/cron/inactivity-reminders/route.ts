/**
 * GET /api/cron/inactivity-reminders
 * Send reminders to enrolled learners who haven't logged any lesson activity in 7+ days.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INACTIVE_DAYS = 7;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString().split('T')[0];

  const { data: inactive, error } = await db
    .from('lms_progress')
    .select(`
      id, user_id, course_id, last_activity_at, progress_percent,
      profiles!lms_progress_user_id_fkey (full_name, email),
      courses (title)
    `)
    .in('status', ['enrolled', 'in_progress'])
    .or(`last_activity_at.is.null,last_activity_at.lt.${cutoff}`)
    .limit(200);

  if (error) {
    logger.error('[cron/inactivity-reminders] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let reminded = 0;
  for (const row of inactive ?? []) {
    const profile = (row as any).profiles;
    const course = (row as any).courses;
    if (!profile?.email) continue;

    const daysInactive = row.last_activity_at
      ? Math.floor((Date.now() - new Date(row.last_activity_at).getTime()) / 86400000)
      : INACTIVE_DAYS;

    // Idempotent in-app notification
    await db.from('notifications').insert({
      user_id: row.user_id,
      type: 'deadline_reminder',
      title: 'Keep your momentum going',
      message: `You haven't logged into ${course?.title ?? 'your course'} in ${daysInactive} days. Pick up where you left off.`,
      action_label: 'Continue learning',
      action_url: `/lms/courses/${row.course_id}`,
      link: `/lms/courses/${row.course_id}`,
      read: false,
      idempotency_key: `inactivity-${row.user_id}-${row.course_id}-${today}`,
    }).onConflict('idempotency_key').ignore().catch(() => {});

    await sendEmail({
      to: profile.email,
      subject: `You haven't logged in for ${daysInactive} days — ${course?.title ?? 'your course'} is waiting`,
      html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>It's been <strong>${daysInactive} days</strong> since you last logged into <strong>${course?.title ?? 'your course'}</strong>. You're ${Math.round(row.progress_percent ?? 0)}% of the way through — keep going!</p><p><a href="https://www.elevateforhumanity.org/lms/courses/${row.course_id}">Continue learning →</a></p><p>— Elevate for Humanity</p>`,
    }).catch((e: unknown) => logger.warn('[cron/inactivity-reminders] Email failed', { user_id: row.user_id, error: String(e) }));

    reminded++;
  }

  logger.info('[cron/inactivity-reminders] Done', { reminded });
  return NextResponse.json({ ok: true, reminded });
});
