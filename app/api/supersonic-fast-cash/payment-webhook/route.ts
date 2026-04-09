import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import Stripe from 'stripe';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This is the ONLY place payment_status is set to 'paid'.
// Never trust the browser success redirect — only this webhook.
async function _POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_SUPERSONIC || process.env.STRIPE_WEBHOOK_SECRET_TAX || process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    logger.error('[payment-webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  let admin;
  try {
    admin = await getAdminClient();
  } catch (err) {
    logger.error('[payment-webhook] Admin client unavailable:', err);
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only process sessions that belong to SupersonicFastCash tax payments
    if (session.metadata?.payment_type !== 'deposit' && session.metadata?.payment_type !== 'full') {
      return NextResponse.json({ received: true });
    }

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

    // Mark payment as paid — source of truth
    const { error } = await admin
      .from('tax_payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_checkout_session_id', session.id);

    if (error) {
      logger.error('[payment-webhook] Failed to update tax_payments:', error);
      // Return 500 so Stripe retries
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    await admin
      .from('tax_payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('stripe_checkout_session_id', session.id)
      .eq('status', 'pending');
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;

    if (paymentIntentId) {
      await admin
        .from('tax_payments')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', paymentIntentId);
    }
  }

  return NextResponse.json({ received: true });
}

export const POST = withRuntime(withApiAudit('/api/supersonic-fast-cash/payment-webhook', _POST, { actor_type: 'webhook', skip_body: true }));
