/**
 * POST /api/testing/webhook
 *
 * Stripe webhook for testing center payments.
 * Register this URL in Stripe Dashboard alongside /api/webhooks/stripe.
 *
 * Handles:
 *   checkout.session.completed
 *     payment_type=testing_fee        → marks exam_bookings.payment_status='paid'
 *     payment_type=testing_enforcement → clears testing_enforcement hold, unlocks booking
 *
 * Idempotent — safe to replay.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { TESTING_CENTER, TESTING_EMAIL, CALENDLY_CONFIG } from '@/lib/testing/testing-config';
import { createSchedulingLink, getEventTypes } from '@/lib/testing/calendly';
import { withRuntime } from '@/lib/api/withRuntime';
import { ENV } from '@/lib/api/env-groups';
import { TestingSessionMeta, parseWebhookMeta } from '@/lib/stripe/webhook-schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FROM = TESTING_EMAIL.from;

export const POST = withRuntime(
  { secrets: [...ENV.STRIPE_TESTING_WEBHOOK] },
  async (req, ctx) => {
  const stripeKey = ctx.env.STRIPE_SECRET_KEY;
  const webhookSecret = ctx.env.STRIPE_TESTING_WEBHOOK_SECRET;
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    logger.warn('[testing/webhook] Missing stripe-signature header', {
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    });
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = new Stripe(stripeKey).webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    logger.warn('[testing/webhook] Signature verification failed', {
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });

  // ── Exam booking fee paid ────────────────────────────────────────────────
  if (session.metadata?.payment_type === 'testing_fee') {
    // Validate metadata contract before any business logic
    const meta = parseWebhookMeta(TestingSessionMeta, session.metadata, event.id, logger);
    if (!meta) return NextResponse.json({ received: true }); // ack, skip malformed
    const paymentIntentId = session.payment_intent as string ?? null;

    // Idempotency — skip if already processed for this payment intent
    if (paymentIntentId) {
      const { data: existing } = await db
        .from('exam_bookings')
        .select('id')
        .eq('payment_intent_id', paymentIntentId)
        .maybeSingle();
      if (existing) {
        logger.info('[testing/webhook] Already processed', { paymentIntentId });
        return NextResponse.json({ received: true });
      }
    }

    // Retrieve full session to get customer details (not in metadata for security)
    const stripe = new Stripe(stripeKey);
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['customer_details'],
    });
    const customerEmail = fullSession.customer_details?.email ?? meta.email ?? '';
    const customerName  = fullSession.customer_details?.name ?? '';
    const [firstName, ...rest] = customerName.trim().split(' ');
    const lastName = rest.join(' ') || '';

    // Create the booking row now that payment is confirmed
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const confirmationCode = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    const hasAddOn = meta.add_on === 'true';

    // Generate a single-use Calendly scheduling link so the test-taker can
    // self-schedule immediately after payment without waiting for a coordinator.
    // Falls back to the public testing URL if the Calendly API is unavailable.
    let calendlySchedulingUrl = CALENDLY_CONFIG.testingUrl;
    try {
      const eventTypes = await getEventTypes();
      // Prefer the dedicated "testing" event type; fall back to the first active one
      const testingEvent = eventTypes.find(e => e.slug === 'testing' || e.slug === '60min')
        ?? eventTypes[0];
      if (testingEvent) {
        calendlySchedulingUrl = await createSchedulingLink({ eventTypeUri: testingEvent.uri });
      }
    } catch (err) {
      logger.warn('[testing/webhook] Could not generate Calendly link — using public URL', { err });
    }

    const { error: insertErr } = await db.from('exam_bookings').insert({
      exam_type:               meta.exam_type,
      exam_name:               meta.exam_name,
      booking_type:            meta.booking_type,
      first_name:              firstName || 'Customer',
      last_name:               lastName,
      email:                   customerEmail,
      participant_count:       meta.participant_count,
      status:                  'pending',
      payment_status:          'paid',
      payment_intent_id:       paymentIntentId,
      fee_cents:               session.amount_total,
      confirmation_code:       confirmationCode,
      add_on:                  hasAddOn,
      add_on_paid:             hasAddOn, // payment confirmed — flip immediately
      calendly_scheduling_url: calendlySchedulingUrl,
    });

    if (insertErr) {
      logger.error('[testing/webhook] Failed to create booking after payment', { insertErr });
      return NextResponse.json({ received: true }); // don't 500 — Stripe will retry
    }

    logger.info('[testing/webhook] Booking created after payment', { confirmationCode, hasAddOn, calendlySchedulingUrl });

    if (customerEmail) {
      const emailJobs: Promise<unknown>[] = [];

      // Booking confirmation — includes the Calendly self-scheduling link
      emailJobs.push(
        sendEmail({
          to: customerEmail,
          from: FROM,
          subject: `Exam Booking Confirmed — ${confirmationCode} | Elevate Testing Center`,
          html: `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;padding:24px;color:#1E293B;max-width:600px;margin:0 auto">
  <div style="background:#1E3A5F;padding:24px;border-radius:8px 8px 0 0;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px">Exam Booking Confirmed</h1>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p>Hi ${firstName || 'there'},</p>
    <p>Your payment was received. Your confirmation code is:</p>
    <p style="font-size:28px;font-weight:900;letter-spacing:4px;color:#1E3A5F;text-align:center;margin:16px 0">${confirmationCode}</p>
    <p>Exam: <strong>${meta.exam_name}</strong></p>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
      <p style="margin:0 0 12px;font-weight:bold;color:#0c4a6e">Next Step: Schedule Your Exam Date</p>
      <p style="margin:0 0 16px;font-size:14px;color:#0369a1">Use the link below to pick a date and time that works for you.</p>
      <a href="${calendlySchedulingUrl}" style="background:#1E3A5F;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">Schedule Your Exam →</a>
      <p style="margin:12px 0 0;font-size:12px;color:#64748b">This is a single-use link — do not share it.</p>
    </div>
    <p><strong>Exam Day:</strong> Bring a valid government-issued photo ID. Arrive 15 minutes early.<br>
    <strong>Location:</strong> ${TESTING_CENTER.address}</p>
    <p>Questions? Call <strong>${TESTING_CENTER.phone}</strong>.</p>
  </div>
</body></html>`,
        }).catch(err => logger.warn('[testing/webhook] Confirmation email failed', { err }))
      );

      // Add-on delivery — only when purchased and paid
      if (hasAddOn) {
        emailJobs.push(
          sendEmail({
            to: customerEmail,
            from: FROM,
            subject: `Your Certification Success Package — ${meta.exam_name} | Elevate Testing Center`,
            html: `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;padding:24px;color:#1E293B;max-width:600px;margin:0 auto">
  <div style="background:#1E3A5F;padding:24px;border-radius:8px 8px 0 0;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px">Your Prep Materials Are Ready</h1>
  </div>
  <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p>Hi ${firstName || 'there'},</p>
    <p>You added the <strong>Certification Success Package</strong> to your booking. Here's what's included:</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;width:200px">Full-length practice test</td><td style="padding:8px 0"><a href="${SITE_URL}/lms" style="color:#1E3A5F;font-weight:600">Access in your LMS account →</a></td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b">Study guide</td><td style="padding:8px 0"><a href="${SITE_URL}/lms" style="color:#1E3A5F;font-weight:600">Access in your LMS account →</a></td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b">Retake strategy</td><td style="padding:8px 0">Included in your study guide</td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Email support</td><td style="padding:8px 0"><a href="mailto:${TESTING_CENTER.email}" style="color:#1E3A5F;font-weight:600">${TESTING_CENTER.email}</a></td></tr>
    </table>
    <p>Don't have an LMS account yet? Reply to this email and we'll get you set up before your exam date.</p>
    <p>Good luck,<br><strong>${TESTING_CENTER.coordinator.name}</strong><br>${TESTING_CENTER.coordinator.title}</p>
  </div>
</body></html>`,
          }).catch(err => logger.warn('[testing/webhook] Add-on email failed', { err }))
        );
      }

      await Promise.allSettled(emailJobs);
    }

    return NextResponse.json({ received: true });
  }

  // ── Enforcement fee paid (no-show / retake / reschedule) ─────────────────
  if (meta.payment_type === 'testing_enforcement') {
    const enforcementId = meta.enforcement_id;
    const email = meta.email;

    if (!enforcementId) {
      logger.warn('[testing/webhook] enforcement_id missing in metadata');
      return NextResponse.json({ received: true });
    }

    const { error } = await db
      .from('testing_enforcement')
      .update({
        fee_paid: true,
        payment_intent_id: session.payment_intent as string ?? null,
        paid_at: new Date().toISOString(),
        unlocked_at: new Date().toISOString(),
      })
      .eq('id', enforcementId);

    if (error) {
      logger.error('[testing/webhook] Failed to clear enforcement hold', { enforcementId, error });
      return NextResponse.json({ received: true });
    }

    logger.info('[testing/webhook] Enforcement fee cleared', { enforcementId, type: meta.enforcement_type });

    // Notify candidate that they can now rebook
    if (email) {
      const label = meta.enforcement_type === 'no_show' ? 'no-show rescheduling fee'
        : meta.enforcement_type === 'retake' ? 'retake fee'
        : 'reschedule fee';

      await sendEmail({
        to: email,
        from: FROM,
        subject: 'Fee Paid — You Can Now Rebook Your Exam | Elevate Testing Center',
        html: `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;padding:24px;color:#1E293B">
  <h2 style="color:#1E3A5F">Your ${label} has been received.</h2>
  <p>You can now schedule your exam at Elevate for Humanity Testing Center.</p>
  <p><a href="${SITE_URL}/testing/book" style="background:#1E3A5F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Book Your Exam →</a></p>
  <p style="color:#64748b;font-size:13px">Questions? Call ${TESTING_CENTER.phone} or reply to this email.</p>
</body></html>`,
      }).catch(err => logger.warn('[testing/webhook] Email send failed', { err }));
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
  }
);
