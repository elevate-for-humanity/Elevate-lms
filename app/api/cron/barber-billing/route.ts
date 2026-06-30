/**
 * GET /api/cron/barber-billing
 * Process monthly barber program subscription billing cycles.
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

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Subscriptions due for billing today
  const { data: due, error } = await db
    .from('barber_subscriptions')
    .select('id, student_id, amount_cents, billing_day, status, next_billing_date, profiles!barber_subscriptions_student_id_fkey(full_name, email)')
    .eq('status', 'active')
    .lte('next_billing_date', today)
    .limit(100);

  if (error) {
    logger.error('[cron/barber-billing] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!due?.length) return NextResponse.json({ ok: true, processed: 0 });

  let processed = 0;
  let failed = 0;

  for (const sub of due) {
    const profile = (sub as any).profiles;

    // Advance next billing date by 30 days
    const nextDate = new Date(sub.next_billing_date ?? today);
    nextDate.setDate(nextDate.getDate() + 30);

    const { error: updateErr } = await db
      .from('barber_subscriptions')
      .update({
        next_billing_date: nextDate.toISOString().split('T')[0],
        last_billed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id);

    if (updateErr) {
      logger.error('[cron/barber-billing] Update failed', updateErr, { sub_id: sub.id });
      failed++;
      continue;
    }

    // Notify student
    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        subject: `Billing processed — Barber Program`,
        html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>Your monthly barber program payment of <strong>$${((sub.amount_cents ?? 0) / 100).toFixed(2)}</strong> has been processed. Next billing date: ${nextDate.toLocaleDateString('en-US')}.</p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/barber-billing] Email failed', { sub_id: sub.id, error: String(e) }));
    }

    await emitEvent('payment.barber_cycle_processed', 'payment', {
      actor_type: 'cron',
      subject_id: sub.student_id,
      subject_type: 'student',
      payload: { subscription_id: sub.id, amount_cents: sub.amount_cents, next_billing_date: nextDate.toISOString().split('T')[0] },
      message: `Barber billing cycle processed for ${profile?.full_name ?? sub.student_id}`,
    }).catch(() => {});

    processed++;
  }

  if (failed > 0) {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Barber Billing] ${failed} billing failure${failed !== 1 ? 's' : ''}`,
      html: `<p>${failed} barber subscription billing${failed !== 1 ? 's' : ''} failed to process. Review in admin.</p><p><a href="https://www.elevateforhumanity.org/admin/billing">Review →</a></p>`,
    }).catch((e: unknown) => logger.warn('[cron/barber-billing] Admin email failed', { error: String(e) }));
  }

  logger.info('[cron/barber-billing] Done', { processed, failed });
  return NextResponse.json({ ok: true, processed, failed });
});
