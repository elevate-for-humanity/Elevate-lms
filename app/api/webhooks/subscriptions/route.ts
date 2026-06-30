/**
 * Subscriptions Webhook Handler
 * Central handler for subscription-related Stripe events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { constructWebhookEvent } from '@/lib/stripe/construct-webhook-event';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
  const payload = Buffer.from(await request.arrayBuffer()).toString();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    logger.error('Subscriptions webhook: Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(stripe, payload, sig);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Subscriptions webhook: signature verification failed', undefined, { error: msg });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const adminDb = await requireAdminClient();
  logger.info('Subscriptions webhook received', { type: event.type, eventId: event.id });

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info('Subscription created', { subscriptionId: subscription.id, customerId: subscription.customer, status: subscription.status });
        if (adminDb) {
          // Get period from first subscription item (Stripe SDK v19+)
          const firstItem = subscription.items?.data?.[0];
          const periodStart = firstItem?.current_period_start;
          const periodEnd = firstItem?.current_period_end;
          await adminDb.from('subscriptions').upsert({
            stripe_subscription_id: subscription.id,
            customer_id: subscription.customer as string,
            status: subscription.status,
            current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            created_at: new Date(subscription.created * 1000).toISOString(),
            metadata: subscription.metadata,
          }, { onConflict: 'stripe_subscription_id' });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info('Subscription updated', { subscriptionId: subscription.id, status: subscription.status });
        if (adminDb) {
          const firstItem = subscription.items?.data?.[0];
          const periodStart = firstItem?.current_period_start;
          const periodEnd = firstItem?.current_period_end;
          await adminDb.from('subscriptions').update({
            status: subscription.status,
            current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            metadata: subscription.metadata,
          }).eq('stripe_subscription_id', subscription.id);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info('Subscription deleted', { subscriptionId: subscription.id });
        if (adminDb) {
          await adminDb.from('subscriptions').update({ status: 'canceled', canceled_at: new Date().toISOString() }).eq('stripe_subscription_id', subscription.id);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Handle subscription as object or string (Stripe SDK v19+)
        const subscriptionId = typeof invoice.subscription === 'object' ? invoice.subscription?.id : invoice.subscription;
        logger.info('Invoice payment succeeded', { invoiceId: invoice.id, subscriptionId });
        if (adminDb && subscriptionId) {
          const { error: insertError } = await adminDb.from('subscription_invoices').insert({
            stripe_invoice_id: invoice.id,
            subscription_id: subscriptionId as string,
            customer_id: invoice.customer as string,
            amount_paid: invoice.amount_paid,
            status: 'paid',
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            paid_at: new Date().toISOString(),
            invoice_url: invoice.hosted_invoice_url,
          });
          if (insertError) logger.error('Failed to insert subscription invoice', { error: insertError });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === 'object' ? invoice.subscription?.id : invoice.subscription;
        logger.warn('Invoice payment failed', { invoiceId: invoice.id, subscriptionId });
        if (adminDb && subscriptionId) {
          const { error: insertError } = await adminDb.from('subscription_invoices').insert({
            stripe_invoice_id: invoice.id,
            subscription_id: subscriptionId as string,
            customer_id: invoice.customer as string,
            amount_paid: 0,
            amount_due: invoice.amount_due,
            status: 'failed',
            failure_message: (invoice as any).last_payment_error?.message,
            attempt_count: invoice.attempt_count,
          });
          if (insertError) logger.error('Failed to insert failed invoice', { error: insertError });
        }
        break;
      }
      case 'invoice.paid': {
        logger.info('Invoice paid event', { invoiceId: (event.data.object as Stripe.Invoice).id });
        break;
      }
      default:
        logger.debug('Unhandled subscription event type', { type: event.type });
    }
  } catch (err) {
    logger.error('Error processing subscription webhook', err as Error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export const POST = withApiAudit('/api/webhooks/subscriptions', _POST, { actor_type: 'webhook', skip_body: true });
