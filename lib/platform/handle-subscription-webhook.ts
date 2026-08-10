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
import { syncHostShopSubscriptionLifecycle } from '@/lib/platform/orchestration/host-shop-subscription';

async function syncAllSubscriptionState(db: any, subscription: Stripe.Subscription) {
  // Domain tables are authoritative. Do not mirror into the legacy generic
  // `subscriptions` table: that creates a competing source of truth.
  await syncPlatformSubscriptionLifecycle(db, subscription);
  await syncIndividualAppLifecycle(db, subscription);
  await syncHostShopSubscriptionLifecycle(db, subscription);
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
 *
 * All recurring product families flow through this one handler. Individual
 * lifecycle helpers ignore subscriptions outside their metadata namespace, so
 * each Stripe event has exactly one domain owner while sharing verification,
 * invoice auditing, retries, and logging.
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
          type: subscription.metadata?.type,
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
