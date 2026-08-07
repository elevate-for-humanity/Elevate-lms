import type Stripe from 'stripe';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { constructWebhookEvent } from '@/lib/stripe/construct-webhook-event';
import {
  syncIndividualAppLifecycle,
  syncPlatformSubscriptionLifecycle,
} from '@/lib/platform/subscription-lifecycle';

function subscriptionPeriod(subscription: Stripe.Subscription) {
  const firstItem = subscription.items?.data?.[0];
  return {
    start: firstItem?.current_period_start
      ? new Date(firstItem.current_period_start * 1000).toISOString()
      : null,
    end: firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000).toISOString()
      : null,
  };
}

async function persistGenericSubscription(db: any, subscription: Stripe.Subscription) {
  const period = subscriptionPeriod(subscription);
  await db.from('subscriptions').upsert(
    {
      stripe_subscription_id: subscription.id,
      customer_id:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id,
      status: subscription.status,
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      created_at: new Date(subscription.created * 1000).toISOString(),
      metadata: subscription.metadata,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' },
  );
}

async function syncAllSubscriptionState(db: any, subscription: Stripe.Subscription) {
  await persistGenericSubscription(db, subscription);
  await syncPlatformSubscriptionLifecycle(db, subscription);
  await syncIndividualAppLifecycle(db, subscription);
}

async function persistInvoice(db: any, invoice: Stripe.Invoice, status: 'paid' | 'failed') {
  const data = invoice as unknown as {
    id: string;
    customer: string | { id?: string } | null;
    subscription?: string | { id?: string };
    amount_paid?: number;
    amount_due?: number;
    period_start?: number;
    period_end?: number;
    hosted_invoice_url?: string | null;
    attempt_count?: number;
    last_payment_error?: { message?: string };
  };
  const subscriptionId =
    typeof data.subscription === 'object' ? data.subscription?.id : data.subscription;
  if (!subscriptionId) return;
  const customerId =
    typeof data.customer === 'object' ? data.customer?.id : data.customer;

  await db.from('subscription_invoices').upsert(
    {
      stripe_invoice_id: data.id,
      subscription_id: subscriptionId,
      customer_id: customerId,
      amount_paid: status === 'paid' ? data.amount_paid ?? 0 : 0,
      amount_due: data.amount_due ?? 0,
      status,
      period_start: data.period_start
        ? new Date(data.period_start * 1000).toISOString()
        : null,
      period_end: data.period_end
        ? new Date(data.period_end * 1000).toISOString()
        : null,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      invoice_url: data.hosted_invoice_url ?? null,
      failure_message: status === 'failed' ? data.last_payment_error?.message ?? null : null,
      attempt_count: data.attempt_count ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_invoice_id' },
  );
}

/**
 * Canonical subscription webhook processor used by Marketing and LMS.
 * Stripe should still point to one public endpoint, but duplicate app routes now
 * execute exactly the same lifecycle logic and cannot drift independently.
 */
export async function handleSubscriptionWebhook(request: NextRequest) {
  const payload = Buffer.from(await request.arrayBuffer()).toString();
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const stripe = getStripe();
  if (!stripe) {
    logger.error('Subscriptions webhook: Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(stripe, payload, signature);
  } catch (error) {
    logger.error(
      'Subscriptions webhook: signature verification failed',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncAllSubscriptionState(db, subscription);
        logger.info('Canonical subscription lifecycle synchronized', {
          eventType: event.type,
          subscriptionId: subscription.id,
          status: subscription.status,
          checkoutType: subscription.metadata?.checkout_type,
        });
        break;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await persistInvoice(db, invoice, 'paid');

        const invoiceData = invoice as unknown as { subscription?: string | { id?: string } };
        const subscriptionId =
          typeof invoiceData.subscription === 'object'
            ? invoiceData.subscription?.id
            : invoiceData.subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncAllSubscriptionState(db, subscription);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await persistInvoice(db, invoice, 'failed');

        const invoiceData = invoice as unknown as { subscription?: string | { id?: string } };
        const subscriptionId =
          typeof invoiceData.subscription === 'object'
            ? invoiceData.subscription?.id
            : invoiceData.subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncAllSubscriptionState(db, subscription);
        }
        break;
      }
      default:
        logger.debug('Canonical subscription webhook ignored event', { type: event.type });
    }
  } catch (error) {
    logger.error(
      'Canonical subscription webhook processing failed',
      error instanceof Error ? error : new Error(String(error)),
      { eventId: event.id, eventType: event.type },
    );
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
