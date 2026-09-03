// Stripe testing webhook endpoint registered in the live Stripe account.
import type Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  constructStripeEventWithAnySecret,
  getCanonicalStripeWebhookSecrets,
} from '@/lib/stripe/construct-webhook-event';
import { handleTestingCheckoutSession } from '@/lib/stripe/handlers/testing-checkout-completed';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const TESTING_TYPES = new Set(['testing_fee', 'testing_enforcement']);

export async function POST(request: NextRequest) {
  try {
    await hydrateProcessEnv();
    const stripe = getStripe();
    if (!stripe) {
      logger.error('[testing-webhook] Stripe client unavailable');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });

    const secrets = getCanonicalStripeWebhookSecrets();
    if (!secrets.length) {
      logger.error('[testing-webhook] No Stripe signing secret configured');
      return NextResponse.json({ error: 'Stripe webhook signing secret not configured' }, { status: 503 });
    }

    const rawBody = await request.text();
    let event: Stripe.Event;
    try {
      event = constructStripeEventWithAnySecret(stripe, rawBody, signature, secrets);
    } catch (error) {
      logger.error('[testing-webhook] Signature verification failed', error);
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
    }

    // A Checkout Session can complete before a delayed/BNPL payment settles.
    // Never provision an exam until Stripe reports payment_status=paid or emits
    // checkout.session.async_payment_succeeded.
    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.async_payment_succeeded' &&
      event.type !== 'checkout.session.async_payment_failed'
    ) {
      return NextResponse.json({ received: true, ignored: event.type });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (!TESTING_TYPES.has(session.metadata?.payment_type ?? '')) {
      return NextResponse.json({ received: true, ignored: 'non_testing_session' });
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      logger.warn('[testing-webhook] Delayed testing payment failed', {
        sessionId: session.id,
        paymentType: session.metadata?.payment_type,
      });
      return NextResponse.json({ received: true, payment_failed: true });
    }

    if (event.type === 'checkout.session.completed' && session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, awaiting_payment: true });
    }

    const db = await requireAdminClient();
    await handleTestingCheckoutSession(session, db);
    return NextResponse.json({ received: true, provisioned: true });
  } catch (error) {
    // Stripe should retry genuine processing and configuration failures.
    logger.error('[testing-webhook] Processing failed', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
