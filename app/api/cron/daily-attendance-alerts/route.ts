// pre-auth-registry: exempt — cron route, runs as service role with no user session
/**
 * GET /api/cron/daily-attendance-alerts
 * Alert instructors and admins about students with attendance issues today.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Students absent today (attendance_records with status=absent for today)
  const { data: absences, error } = await db
    .from('attendance_records')
    .select('id, student_id, program_id, date, notes, profiles!attendance_records_student_id_fkey(full_name, email)')
    .eq('date', today)
    .eq('status', 'absent')
    .limit(100);

  if (error) {
    logger.error('[cron/daily-attendance-alerts] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!absences?.length) {
    logger.info('[cron/daily-attendance-alerts] No absences today');
    return NextResponse.json({ ok: true, absences: 0 });
  }

  // Write admin alert
  await db.from('admin_alerts').insert({
    alert_type: 'daily_attendance',
    severity: absences.length > 5 ? 'warning' : 'info',
    message: `${absences.length} student${absences.length !== 1 ? 's' : ''} absent today (${today})`,
    metadata: { date: today, count: absences.length, student_ids: absences.map(a => a.student_id) },
  }).catch(() => {});

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Attendance] ${absences.length} absence${absences.length !== 1 ? 's' : ''} recorded — ${today}`,
    html: `<p>${absences.length} student${absences.length !== 1 ? 's' : ''} were marked absent today:</p><ul>${absences.map(a => { const p = (a as any).profiles; return `<li>${p?.full_name ?? a.student_id}${a.notes ? ` — ${a.notes}` : ''}</li>`; }).join('')}</ul><p><a href="https://www.elevateforhumanity.org/admin/attendance">View attendance →</a></p>`,
  }).catch((e: unknown) => logger.warn('[cron/daily-attendance-alerts] Email failed', { error: String(e) }));

  logger.info('[cron/daily-attendance-alerts] Done', { absences: absences.length });
  return NextResponse.json({ ok: true, absences: absences.length });
});
