/**
 * GET /api/cron/payment-monitoring
 * Monitor for failed/stuck payments and alert operations team.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { emitEvent } from '@/lib/platform/events';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const STUCK_MINUTES = 30;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const stuckCutoff = new Date(Date.now() - STUCK_MINUTES * 60000).toISOString();

  // Recent payment failures in admin_alerts
  const { data: failures, error } = await db
    .from('admin_alerts')
    .select('id, message, metadata, created_at')
    .eq('alert_type', 'payment_failure')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    logger.error('[cron/payment-monitoring] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Payout schedules past due
  const { data: overduePayouts } = await db
    .from('payout_schedules')
    .select('id, amount_cents, scheduled_date, recipient_id')
    .eq('status', 'pending')
    .lt('scheduled_date', new Date().toISOString().split('T')[0])
    .limit(20);

  const failureCount = failures?.length ?? 0;
  const overdueCount = overduePayouts?.length ?? 0;

  if (failureCount > 0 || overdueCount > 0) {
    await emitEvent('payment.monitoring_alert', 'payments', {
      severity: failureCount > 5 ? 'error' : 'warning',
      actor_type: 'cron',
      payload: { unresolved_failures: failureCount, overdue_payouts: overdueCount },
      message: `Payment monitoring: ${failureCount} unresolved failures, ${overdueCount} overdue payouts`,
    }).catch(() => {});

    if (failureCount > 0) {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Payments] ${failureCount} unresolved payment failure${failureCount !== 1 ? 's' : ''}`,
        html: `<p>${failureCount} payment failure${failureCount !== 1 ? 's' : ''} require attention.</p><p><a href="https://www.elevateforhumanity.org/admin/payments">Review →</a></p>`,
      }).catch((e: unknown) => logger.warn('[cron/payment-monitoring] Email failed', { error: String(e) }));
    }
  }

  logger.info('[cron/payment-monitoring] Done', { unresolved_failures: failureCount, overdue_payouts: overdueCount });
  return NextResponse.json({ ok: true, unresolved_failures: failureCount, overdue_payouts: overdueCount });
});
