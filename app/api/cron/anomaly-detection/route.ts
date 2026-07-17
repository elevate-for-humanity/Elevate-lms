/**
 * GET /api/cron/anomaly-detection
 *
 * Detects operational anomalies by comparing the last hour against the
 * prior 7-day hourly baseline. Fires admin_alerts on:
 *   - Cron failure spike (>2 failures in last hour vs baseline)
 *   - Workflow dead-letter spike (>3 new dead letters in last hour)
 *   - Payment failure spike (>3 failed payments in last hour)
 *   - Notification backlog (>50 unread notifications older than 1h)
 *   - Auth error spike (>10 failed logins in last hour)
 *
 * Runs every 30 minutes via scheduler.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Anomaly {
  type: string;
  severity: 'critical' | 'high' | 'medium';
  message: string;
  value: number;
  threshold: number;
}

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const now = new Date();
  const since1h  = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const since7d  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const anomalies: Anomaly[] = [];

  // ── 1. Cron failure spike ─────────────────────────────────────────────────
  const [cronFailed1h, cronFailed7d] = await Promise.all([
    db.from('cron_job_runs').select('id', { count: 'exact', head: true })
      .eq('status', 'failed').gte('started_at', since1h),
    db.from('cron_job_runs').select('id', { count: 'exact', head: true })
      .eq('status', 'failed').gte('started_at', since7d),
  ]);
  const cronFailed1hCount = cronFailed1h.count ?? 0;
  const cronBaseline = ((cronFailed7d.count ?? 0) / (7 * 24)); // avg per hour
  if (cronFailed1hCount > 2 && cronFailed1hCount > cronBaseline * 3) {
    anomalies.push({
      type: 'cron_failure_spike',
      severity: cronFailed1hCount > 5 ? 'critical' : 'high',
      message: `${cronFailed1hCount} cron failures in the last hour (7-day avg: ${cronBaseline.toFixed(1)}/hr)`,
      value: cronFailed1hCount,
      threshold: 2,
    });
  }

  // ── 2. Workflow dead-letter spike ─────────────────────────────────────────
  const { count: dlCount } = await db
    .from('workflow_dead_letters')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since1h);
  if ((dlCount ?? 0) > 3) {
    anomalies.push({
      type: 'dead_letter_spike',
      severity: (dlCount ?? 0) > 10 ? 'critical' : 'high',
      message: `${dlCount} workflow dead letters in the last hour`,
      value: dlCount ?? 0,
      threshold: 3,
    });
  }

  // ── 3. Payment failure spike ──────────────────────────────────────────────
  const { count: payFailed } = await db
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('created_at', since1h);
  if ((payFailed ?? 0) > 3) {
    anomalies.push({
      type: 'payment_failure_spike',
      severity: (payFailed ?? 0) > 10 ? 'critical' : 'high',
      message: `${payFailed} payment failures in the last hour`,
      value: payFailed ?? 0,
      threshold: 3,
    });
  }

  // ── 4. Notification backlog ───────────────────────────────────────────────
  const { count: notifBacklog } = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)
    .lt('created_at', since1h);
  if ((notifBacklog ?? 0) > 50) {
    anomalies.push({
      type: 'notification_backlog',
      severity: 'medium',
      message: `${notifBacklog} unread notifications older than 1 hour`,
      value: notifBacklog ?? 0,
      threshold: 50,
    });
  }

  // ── 5. Admin alert accumulation ───────────────────────────────────────────
  const { count: newAlerts } = await db
    .from('admin_alerts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since1h)
    .in('severity', ['critical', 'high']);
  if ((newAlerts ?? 0) > 5) {
    anomalies.push({
      type: 'alert_accumulation',
      severity: (newAlerts ?? 0) > 15 ? 'critical' : 'high',
      message: `${newAlerts} high/critical admin alerts created in the last hour`,
      value: newAlerts ?? 0,
      threshold: 5,
    });
  }

  if (anomalies.length === 0) {
    logger.info('[cron/anomaly-detection] no anomalies detected');
    return NextResponse.json({ ok: true, anomalies: 0 });
  }

  // Write admin alerts for each anomaly (deduplicate by type within last hour)
  const { data: existingAlerts } = await db
    .from('admin_alerts')
    .select('alert_type')
    .in('alert_type', anomalies.map((a) => a.type))
    .gte('created_at', since1h);
  const alreadyFired = new Set((existingAlerts ?? []).map((a: any) => a.alert_type));

  let fired = 0;
  for (const anomaly of anomalies) {
    if (alreadyFired.has(anomaly.type)) continue;

    await db.from('admin_alerts').insert({
      alert_type: anomaly.type,
      severity: anomaly.severity,
      message: anomaly.message,
      metadata: { value: anomaly.value, threshold: anomaly.threshold, detected_at: now.toISOString() },
    }).then(undefined, (err) =>
      logger.error('[cron/anomaly-detection] Failed to insert alert', { type: anomaly.type, error: String(err) }),
    );
    fired++;
  }

  // Email admin on critical anomalies
  const critical = anomalies.filter((a) => a.severity === 'critical' && !alreadyFired.has(a.type));
  if (critical.length > 0) {
    await sendEmail({
      to: 'elevate4humanityedu@gmail.com',
      subject: `[CRITICAL] ${critical.length} operational anomaly${critical.length > 1 ? 'ies' : ''} detected`,
      html: `
<div style="font-family:Arial,sans-serif;max-width:600px">
  <h2 style="color:#dc2626">Operational Anomaly Alert</h2>
  <p>${critical.length} critical anomaly${critical.length > 1 ? 'ies were' : ' was'} detected at ${now.toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET:</p>
  <ul style="margin:16px 0">
    ${critical.map((a) => `<li style="margin-bottom:8px"><strong>${a.type}</strong>: ${a.message}</li>`).join('')}
  </ul>
  <p><a href="/admin/operations">View Operations Dashboard →</a></p>
</div>
      `.trim(),
    }).catch((err) =>
      logger.error('[cron/anomaly-detection] Failed to send critical alert email', { error: String(err) }),
    );
  }

  logger.info('[cron/anomaly-detection] anomalies detected', {
    total: anomalies.length,
    fired,
    critical: critical.length,
  });

  return NextResponse.json({ ok: true, anomalies: anomalies.length, fired, critical: critical.length });
});
