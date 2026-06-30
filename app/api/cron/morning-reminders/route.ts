/**
 * GET /api/cron/morning-reminders
 * Daily 8 AM: remind students of today's scheduled sessions and pending tasks.
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
  const todayStart = `${today}T00:00:00.000Z`;
  const todayEnd = `${today}T23:59:59.999Z`;

  // Students with testing appointments today
  const { data: appointments } = await db
    .from('testing_appointments')
    .select('id, student_id, appointment_date, location, exam_type, profiles!testing_appointments_student_id_fkey(full_name, email)')
    .gte('appointment_date', todayStart)
    .lte('appointment_date', todayEnd)
    .eq('status', 'confirmed');

  let reminded = 0;
  for (const appt of appointments ?? []) {
    const profile = (appt as any).profiles;
    if (!profile?.email) continue;
    const time = new Date(appt.appointment_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
    await sendEmail({
      to: profile.email,
      subject: `Reminder: ${appt.exam_type ?? 'Exam'} today at ${time}`,
      html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>This is a reminder that you have a <strong>${appt.exam_type ?? 'testing appointment'}</strong> scheduled for <strong>today at ${time}</strong>${appt.location ? ` at ${appt.location}` : ''}.</p><p>Please arrive 15 minutes early with a valid photo ID.</p><p>— Elevate for Humanity</p>`,
    }).catch((e: unknown) => logger.warn('[cron/morning-reminders] Appointment email failed', { appt_id: appt.id, error: String(e) }));
    reminded++;
  }

  // Students with overdue lessons (progress_percent < 100, last_activity > 3 days ago)
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: overdue } = await db
    .from('lms_progress')
    .select('user_id, course_id, progress_percent, courses(title), profiles!lms_progress_user_id_fkey(full_name, email)')
    .in('status', ['enrolled', 'in_progress'])
    .lt('progress_percent', 100)
    .lt('last_activity_at', threeDaysAgo)
    .limit(100);

  for (const row of overdue ?? []) {
    const profile = (row as any).profiles;
    const course = (row as any).courses;
    if (!profile?.email) continue;
    await db.from('notifications').insert({
      user_id: row.user_id,
      type: 'deadline_reminder',
      title: 'Good morning — continue your course today',
      message: `You're ${Math.round(row.progress_percent ?? 0)}% through ${course?.title ?? 'your course'}. Log in to keep your momentum.`,
      action_url: `/lms/courses/${row.course_id}`,
      link: `/lms/courses/${row.course_id}`,
      read: false,
      idempotency_key: `morning-reminder-${row.user_id}-${row.course_id}-${today}`,
    }).onConflict('idempotency_key').ignore().catch(() => {});
    reminded++;
  }

  logger.info('[cron/morning-reminders] Done', { reminded });
  return NextResponse.json({ ok: true, reminded });
});
