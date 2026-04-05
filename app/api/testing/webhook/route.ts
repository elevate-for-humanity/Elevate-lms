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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FROM = 'Elevate Testing Center <testing@elevateforhumanity.org>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_TESTING_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = new Stripe(stripeKey).webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const meta = session.metadata ?? {};
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });

  // ── Exam booking fee paid ────────────────────────────────────────────────
  if (meta.payment_type === 'testing_fee') {
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

    const { error: insertErr } = await db.from('exam_bookings').insert({
      exam_type:          meta.exam_type,
      exam_name:          meta.exam_name,
      booking_type:       meta.booking_type ?? 'individual',
      first_name:         firstName || 'Customer',
      last_name:          lastName,
      email:              customerEmail,
      participant_count:  parseInt(meta.participant_count ?? '1', 10),
      status:             'pending',
      payment_status:     'paid',
      payment_intent_id:  paymentIntentId,
      fee_cents:          session.amount_total,
      confirmation_code:  confirmationCode,
      add_on:             hasAddOn,
      add_on_paid:        hasAddOn, // payment confirmed — flip immediately
    });

    if (insertErr) {
      logger.error('[testing/webhook] Failed to create booking after payment', { insertErr });
      return NextResponse.json({ received: true }); // don't 500 — Stripe will retry
    }

    logger.info('[testing/webhook] Booking created after payment', { confirmationCode, hasAddOn });

    if (customerEmail) {
      const emailJobs: Promise<unknown>[] = [];

      // Booking confirmation
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
    <p>Our testing coordinator will contact you within 1 business day to confirm your date and time.</p>
    <p><strong>Exam Day:</strong> Bring a valid government-issued photo ID. Arrive 15 minutes early.<br>
    <strong>Location:</strong> 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>
    <p>Questions? Call <strong>(317) 314-3757</strong>.</p>
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
      <tr><td style="padding:8px 0;color:#64748b">Email support</td><td style="padding:8px 0"><a href="mailto:testing@elevateforhumanity.org" style="color:#1E3A5F;font-weight:600">testing@elevateforhumanity.org</a></td></tr>
    </table>
    <p>Don't have an LMS account yet? Reply to this email and we'll get you set up before your exam date.</p>
    <p>Good luck,<br><strong>Alberta Davis</strong><br>Testing Center Coordinator</p>
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
  <p style="color:#64748b;font-size:13px">Questions? Call (317) 314-3757 or reply to this email.</p>
</body></html>`,
      }).catch(err => logger.warn('[testing/webhook] Email send failed', { err }));
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
