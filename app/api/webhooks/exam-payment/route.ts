/**
 * Stripe webhook handler for exam fee payments.
 *
 * Listens for checkout.session.completed events where metadata.payment_type = 'exam_fee'.
 * On success: marks exam_funding_authorizations as paid, then sends the learner
 * an email with exam scheduling instructions.
 *
 * Idempotent — safe to replay. Uses stripe_webhook_events for deduplication.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { markPaymentSucceeded } from '@/lib/services/credential-pipeline';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = createAdminClient();
  if (!db) {
    logger.error('exam-payment webhook: database unavailable');
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Idempotency check — applies to all event types
  const { data: existing } = await db
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, skipped: true });
  }

  await db.from('stripe_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    processed_at: new Date().toISOString(),
  });

  // ── payment_intent.succeeded — certification pipeline (Elevate pays exam fee) ──
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;

    // Only process intents created by the certification pipeline
    if (intent.metadata?.payer !== 'elevate' || !intent.metadata?.certification_request_id) {
      return NextResponse.json({ received: true, skipped: true });
    }

    const { confirmPaymentAndAuthorize } = await import('@/lib/services/exam-authorization');
    const result = await confirmPaymentAndAuthorize(intent.id);

    if (!result.ok) {
      logger.error('exam-payment webhook: confirmPaymentAndAuthorize failed', undefined, {
        intentId: intent.id,
        error: result.error,
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  // ── payment_intent.payment_failed — mark request as payment_failed ────────────
  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;

    if (intent.metadata?.payer === 'elevate' && intent.metadata?.certification_request_id) {
      await db
        .from('certification_requests')
        .update({ status: 'payment_failed', updated_at: new Date().toISOString() })
        .eq('id', intent.metadata.certification_request_id);

      await db.from('exam_fee_payments')
        .update({ status: 'failed', failure_reason: intent.last_payment_error?.message ?? 'Payment failed' })
        .eq('stripe_payment_intent', intent.id);
    }

    return NextResponse.json({ received: true });
  }

  // ── checkout.session.completed — legacy exam fee flow ─────────────────────────
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true, skipped: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.payment_type !== 'exam_fee') {
    return NextResponse.json({ received: true, skipped: true });
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? '';

  const result = await markPaymentSucceeded(session.id, paymentIntentId);

  if (!result.ok) {
    logger.error('exam-payment webhook: markPaymentSucceeded failed', undefined, { sessionId: session.id });
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Send exam scheduling email if learner_id and credential_id are in metadata
  const learnerId = session.metadata?.learner_id;
  const credentialId = session.metadata?.credential_id;

  if (learnerId && credentialId) {
    try {
      const { data: profile } = await db
        .from('profiles')
        .select('email, full_name')
        .eq('id', learnerId)
        .single();

      const { data: credential } = await db
        .from('credentials')
        .select('name, issuing_authority')
        .eq('id', credentialId)
        .single();

      if (profile?.email && credential) {
        const { resend } = await import('@/lib/resend');
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'Elevate for Humanity <noreply@elevateforhumanity.org>',
          to: profile.email,
          subject: `Exam fee confirmed — schedule your ${credential.name} exam`,
          html: `
            <p>Hi ${profile.full_name ?? 'there'},</p>
            <p>Your exam fee for the <strong>${credential.name}</strong> credential has been confirmed.</p>
            <p>You can now schedule your exam. Log in to your dashboard and visit
            <strong>My Credentials</strong> to see your scheduling options.</p>
            <p>Issued by: ${credential.issuing_authority}</p>
            <p>Questions? Call (317) 314-3757 or reply to this email.</p>
            <p>— Elevate for Humanity</p>
          `,
        });
      }
    } catch (emailErr) {
      logger.error('exam-payment webhook: email send failed', emailErr instanceof Error ? emailErr : undefined);
    }
  }

  return NextResponse.json({ received: true });
}
