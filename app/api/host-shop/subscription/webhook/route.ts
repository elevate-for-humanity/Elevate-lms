/**
 * Host Shop Subscription Webhook Handler
 * 
 * Handles subscription lifecycle events for host shop partnerships.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { constructWebhookEvent } from '@/lib/stripe/construct-webhook-event';
import { getStripeServer } from '@/lib/stripe/get-stripe-server';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Partner tier mapping
const TIER_PRICES: Record<string, string> = {
  'prod_UheRmlUSQYffCZ': 'bronze',
  'prod_UheRoGkZRPQ8ly': 'silver',
  'prod_UheRf9woxCZqw5': 'gold',
  'prod_UheRY80SOIjRJr': 'platinum',
};

async function _POST(request: NextRequest) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ received: true, warning: 'no_signature' }, { status: 200 });
  }

  let event: Stripe.Event;
  try {
    const stripe = await getStripeServer();
    event = constructWebhookEvent(stripe, payload, sig);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Host shop subscription webhook: signature verification failed', undefined, { error: msg });
    return NextResponse.json({ received: true, warning: 'invalid_signature' }, { status: 200 });
  }

  logger.info('Host shop subscription webhook received', { type: event.type, eventId: event.id });

  const adminDb = await requireAdminClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subData = subscription as unknown as {
          id: string;
          customer: string;
          status: string;
          items: { data: Array<{ price: { product: string } }> };
          billing_cycle_anchor: number;
          current_period_end?: number;
        };
        
        logger.info('Subscription update', {
          subscriptionId: subData.id,
          customerId: subData.customer,
          status: subData.status,
          tier: subData.items.data[0]?.price?.product,
        });

        const productId = subData.items.data[0]?.price?.product as string;
        const tier = TIER_PRICES[productId] || 'free';

        if (adminDb) {
          await adminDb
            .from('host_shop_partnerships')
            .update({
              stripe_subscription_id: subData.id,
              partner_tier: tier,
              subscription_status: subData.status,
              subscription_start_date: new Date(subData.billing_cycle_anchor * 1000).toISOString(),
              current_period_end: subData.current_period_end ? new Date(subData.current_period_end * 1000).toISOString() : null,
              status: subData.status === 'active' ? 'active' : 'suspended',
            })
            .eq('stripe_subscription_id', subData.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        logger.info('Subscription cancelled', { subscriptionId: subscription.id });

        if (adminDb) {
          await adminDb
            .from('host_shop_partnerships')
            .update({
              subscription_status: 'canceled',
              partner_tier: 'free',
              status: 'expired',
              subscription_end_date: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceData = invoice as unknown as { id: string; subscription?: string | { id?: string } };
        // Stripe SDK v19+ returns subscription as object or string
        const subscriptionId = typeof invoiceData.subscription === 'object' 
          ? (invoiceData.subscription as { id?: string })?.id 
          : invoiceData.subscription;
        
        logger.info('Subscription payment succeeded', {
          invoiceId: invoiceData.id,
          subscriptionId,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceData = invoice as unknown as { id: string; subscription?: string | { id?: string } };
        // Stripe SDK v19+ returns subscription as object or string
        const subscriptionId = typeof invoiceData.subscription === 'object' 
          ? (invoiceData.subscription as { id?: string })?.id 
          : invoiceData.subscription;
        
        logger.warn('Subscription payment failed', {
          invoiceId: invoiceData.id,
          subscriptionId,
        });

        if (adminDb && subscriptionId) {
          await adminDb
            .from('host_shop_partnerships')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      default:
        logger.debug('Unhandled subscription event', { type: event.type });
    }
  } catch (err) {
    logger.error('Error processing subscription webhook', err as Error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export const POST = _POST;
