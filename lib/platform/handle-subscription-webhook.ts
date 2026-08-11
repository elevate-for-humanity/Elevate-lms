import type Stripe from 'stripe';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { constructWebhookEvent } from '@/lib/stripe/construct-webhook-event';
import { processSubscriptionEvent } from '@/lib/platform/process-subscription-event';

/**
 * Compatibility webhook processor for recurring subscriptions.
 *
 * /api/webhooks/stripe remains the canonical Stripe endpoint. This handler is
 * retained only for compatibility while all recurring lifecycle logic lives in
 * processSubscriptionEvent().
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
    const handled = await processSubscriptionEvent(db, stripe, event);
    logger.info('Subscription compatibility webhook processed', {
      eventId: event.id,
      eventType: event.type,
      handled,
    });
    return NextResponse.json({ received: true, handled });
  } catch (error) {
    logger.error(
      'Canonical subscription webhook processing failed',
      error instanceof Error ? error : new Error(String(error)),
      { eventId: event.id, eventType: event.type },
    );
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
