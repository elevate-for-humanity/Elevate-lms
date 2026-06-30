/**
 * GET /api/cron/end-of-day-summary
 * Send a daily operations summary to admin: enrollments, completions, payments, alerts.
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
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const since = todayStart.toISOString();

  const [enrollments, completions, payments, alerts] = await Promise.all([
    db.from('student_enrollments').select('id', { count: 'exact', head: true }).gte('created_at', since),
    db.from('lms_progress').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('updated_at', since),
    db.from('payments').select('id, amount_cents', { count: 'exact' }).gte('created_at', since).eq('status', 'succeeded'),
    db.from('admin_alerts').select('id', { count: 'exact', head: true }).gte('created_at', since).eq('resolved', false),
  ]);

  const enrollCount = enrollments.count ?? 0;
  const completeCount = completions.count ?? 0;
  const alertCount = alerts.count ?? 0;
  const paymentRows = payments.data ?? [];
  const paymentTotal = paymentRows.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  const paymentCount = payments.count ?? 0;

  const date = new Date().toLocaleDateString('en-US', { timeZone: 'America/Indiana/Indianapolis', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  await sendEmail({
    to: 'elevate4humanityedu@gmail.com',
    subject: `Daily Summary — ${date}`,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#1e293b">Daily Operations Summary</h2>
  <p style="color:#64748b">${date}</p>
  <table style="width:100%;border-collapse:collapse;margin-top:16px">
    <tr style="background:#f8fafc"><td style="padding:10px 16px;font-weight:600">New Enrollments</td><td style="padding:10px 16px;text-align:right">${enrollCount}</td></tr>
    <tr><td style="padding:10px 16px;font-weight:600">Course Completions</td><td style="padding:10px 16px;text-align:right">${completeCount}</td></tr>
    <tr style="background:#f8fafc"><td style="padding:10px 16px;font-weight:600">Payments Collected</td><td style="padding:10px 16px;text-align:right">${paymentCount} ($${(paymentTotal / 100).toFixed(2)})</td></tr>
    <tr><td style="padding:10px 16px;font-weight:600">Unresolved Alerts</td><td style="padding:10px 16px;text-align:right;color:${alertCount > 0 ? '#dc2626' : '#16a34a'}">${alertCount}</td></tr>
  </table>
  <p style="margin-top:24px"><a href="https://www.elevateforhumanity.org/admin">Open Admin Dashboard →</a></p>
</div>
    `.trim(),
  }).catch((err) => logger.error('[cron/end-of-day-summary] Failed to send summary email', { error: String(err) }));

  logger.info('[cron/end-of-day-summary] sent', { enrollCount, completeCount, paymentCount, alertCount });
  return NextResponse.json({ ok: true, enrollCount, completeCount, paymentCount, alertCount });
});
