import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  syncPayPalPaymentToQuickBooks,
  syncPayPalSubscriptionState,
} from '@/lib/billing/paypal-payment-sync';
import { verifyPayPalBillingWebhook } from '@/lib/integrations/paypal-client';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PayPalEvent = {
  id?: string;
  event_type?: string;
  resource?: Record<string, any>;
};

function paymentFromEvent(event: PayPalEvent) {
  const resource = event.resource || {};
  const subscriptionId =
    resource.billing_agreement_id ||
    resource.supplementary_data?.related_ids?.billing_agreement_id ||
    resource.custom_id;
  const amount = resource.amount?.total || resource.amount?.value;
  const currency = resource.amount?.currency || resource.amount?.currency_code;
  if (!resource.id || !subscriptionId || !amount || !currency) return null;
  const amountCents = Math.round(Number(amount) * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return null;
  return {
    paymentId: String(resource.id),
    subscriptionId: String(subscriptionId),
    paidAt: String(resource.create_time || resource.update_time || new Date().toISOString()),
    amountCents,
    currency: String(currency),
  };
}

function subscriptionStatusFromEvent(event: PayPalEvent): string {
  if (event.resource?.status) return String(event.resource.status);
  if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') return 'ACTIVE';
  if (event.event_type === 'BILLING.SUBSCRIPTION.SUSPENDED') return 'SUSPENDED';
  if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') return 'CANCELLED';
  if (event.event_type === 'BILLING.SUBSCRIPTION.EXPIRED') return 'EXPIRED';
  return 'APPROVAL_PENDING';
}

export async function POST(request: NextRequest) {
  const event = (await request.json().catch(() => null)) as PayPalEvent | null;
  if (!event?.id || !event.event_type || !event.resource) {
    return NextResponse.json({ error: 'Invalid PayPal event.' }, { status: 400 });
  }
  if (!(await verifyPayPalBillingWebhook(request.headers, event as Record<string, unknown>))) {
    return NextResponse.json({ error: 'Invalid PayPal signature.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const reservation = await db
    .from('billing_provider_events')
    .insert({
      provider: 'paypal',
      provider_event_id: event.id,
      event_type: event.event_type,
      resource_id: String(event.resource.id || ''),
      status: 'processing',
      payload: event,
    })
    .select('id')
    .single();
  if (reservation.error?.code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (reservation.error) {
    return NextResponse.json({ error: 'PayPal event could not be reserved.' }, { status: 500 });
  }

  try {
    if (event.event_type.startsWith('BILLING.SUBSCRIPTION.')) {
      await syncPayPalSubscriptionState(db, {
        subscriptionId: String(event.resource.id),
        status: subscriptionStatusFromEvent(event),
      });
    } else if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
      const payment = paymentFromEvent(event);
      if (!payment) throw new Error('PayPal payment event is missing subscription or amount data.');
      await syncPayPalPaymentToQuickBooks(db, payment);
    }
    await db
      .from('billing_provider_events')
      .update({ status: 'completed', processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', reservation.data.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PayPal billing synchronization failed.';
    logger.error('[paypal-billing-webhook] processing failed', error);
    await db
      .from('billing_provider_events')
      .update({ status: 'failed', error_message: message.slice(0, 1000), updated_at: new Date().toISOString() })
      .eq('id', reservation.data.id);
    return NextResponse.json({ error: 'PayPal billing synchronization failed.' }, { status: 500 });
  }
}
