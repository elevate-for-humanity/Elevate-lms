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
  const results: Array<{ scheduleId: string; ok: boolean; payments?: number; error?: string }> = [];
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
        if (!synced.alreadyProcessed) payments += 1;
      }
      results.push({ scheduleId: schedule.id, ok: true, payments });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unknown reconciliation error';
      logger.error('[apprentice-payment-reconciliation] failed', cause, { scheduleId: schedule.id });
      results.push({ scheduleId: schedule.id, ok: false, error: message });
    }
  }
  const failed = results.filter((result) => !result.ok).length;
  return NextResponse.json(
    { ok: failed === 0, processed: results.length, failed, results },
    { status: failed ? 207 : 200 },
  );
}
