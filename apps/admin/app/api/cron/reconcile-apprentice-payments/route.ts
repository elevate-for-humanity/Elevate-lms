import { NextRequest, NextResponse } from 'next/server';
import {
  syncPayPalPaymentToQuickBooks,
  syncPayPalSubscriptionState,
} from '@/lib/billing/paypal-payment-sync';
import {
  getPayPalSubscription,
  listPayPalSubscriptionTransactions,
} from '@/lib/billing/providers/paypal-subscriptions';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = await requireAdminClient();
  const { data: schedules, error } = await db
    .from('billing_schedules')
    .select('id,provider_subscription_id')
    .eq('collection_mode', 'automatic')
    .eq('collection_provider', 'paypal')
    .not('provider_subscription_id', 'is', null)
    .in('status', ['active', 'paused'])
    .limit(250);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const end = new Date();
  const start = new Date(end.getTime() - 35 * 24 * 60 * 60 * 1000);
  const results: Array<{
    scheduleId: string;
    ok: boolean;
    payments?: number;
    /** Payments applied to the week's existing invoice instead of creating a new one. */
    appliedToExisting?: number;
    /** Payments for weeks whose invoice was already paid (double payment — needs human refund review). */
    duplicatesSkipped?: number;
    error?: string;
  }> = [];
  for (const schedule of schedules || []) {
    try {
      const subscription = await getPayPalSubscription(schedule.provider_subscription_id);
      await syncPayPalSubscriptionState(db, {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
      const transactionResult = await listPayPalSubscriptionTransactions(
        subscription.id,
        start.toISOString(),
        end.toISOString(),
      );
      let payments = 0;
      let appliedToExisting = 0;
      let duplicatesSkipped = 0;
      for (const transaction of transactionResult.transactions || []) {
        if (transaction.status !== 'COMPLETED') continue;
        const gross = transaction.amount_with_breakdown?.gross_amount;
        const amountCents = Math.round(Number(gross?.value || 0) * 100);
        if (!gross?.currency_code || !Number.isSafeInteger(amountCents) || amountCents <= 0) continue;
        const synced = await syncPayPalPaymentToQuickBooks(db, {
          paymentId: transaction.id,
          subscriptionId: subscription.id,
          paidAt: transaction.time,
          amountCents,
          currency: gross.currency_code,
        });
        if (synced.duplicateSkipped) {
          duplicatesSkipped += 1;
          logger.warn('[apprentice-payment-reconciliation] duplicate PayPal payment skipped', {
            scheduleId: schedule.id,
            paymentId: transaction.id,
          });
        } else if (!synced.alreadyProcessed) {
          payments += 1;
          if (synced.appliedToInvoiceId) appliedToExisting += 1;
        }
      }
      results.push({ scheduleId: schedule.id, ok: true, payments, appliedToExisting, duplicatesSkipped });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unknown reconciliation error';
      logger.error('[apprentice-payment-reconciliation] failed', cause, { scheduleId: schedule.id });
      results.push({ scheduleId: schedule.id, ok: false, error: message });
    }
  }
  const failed = results.filter((result) => !result.ok).length;
  return NextResponse.json(
    {
      ok: failed === 0,
      processed: results.length,
      failed,
      payments: results.reduce((sum, result) => sum + (result.payments || 0), 0),
      appliedToExisting: results.reduce((sum, result) => sum + (result.appliedToExisting || 0), 0),
      duplicatesSkipped: results.reduce((sum, result) => sum + (result.duplicatesSkipped || 0), 0),
      results,
    },
    { status: failed ? 207 : 200 },
  );
}
