import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
// AUTH: Intentionally public — no authentication required
  handleCheckoutCompleted,
  handleInvoicePaid,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentFailed,
} from '@/lib/license/linkStripeToLicense';
function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET_LICENSES || process.env.STRIPE_WEBHOOK_SECRET || '';
}

/**
 * POST /api/licenses/webhook
 * 
 * Handles Stripe webhook events for license purchases.
 * Uses shared linking logic from lib/license/linkStripeToLicense.ts
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  const webhookSecret = getWebhookSecret();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error('[/api/licenses/webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await handleCheckoutCompleted(event, session);
        logger.info(`[/api/licenses/webhook] checkout.session.completed:`, result);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const result = await handleSubscriptionUpdated(event, subscription);
        logger.info(`[/api/licenses/webhook] subscription.updated:`, result);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const result = await handleSubscriptionDeleted(event, subscription);
        logger.info(`[/api/licenses/webhook] subscription.deleted:`, result);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const result = await handleInvoicePaid(event, invoice);
        logger.info(`[/api/licenses/webhook] invoice.paid:`, result);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const result = await handlePaymentFailed(event, invoice);
        logger.info(`[/api/licenses/webhook] invoice.payment_failed:`, result);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('[/api/licenses/webhook] Processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
