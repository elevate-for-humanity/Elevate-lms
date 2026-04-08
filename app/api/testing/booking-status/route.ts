/**
 * GET /api/testing/booking-status?session_id=<stripe_session_id>
 *
 * Returns the exam booking created for a Stripe Checkout session.
 * Used by the success page to surface the Calendly scheduling link
 * immediately after payment without requiring the user to check email.
 *
 * Returns:
 *   { found: true, confirmationCode, examName, calendlySchedulingUrl }
 *   { found: false }
 *
 * Rate-limited at the 'public' tier — no auth required (session_id is
 * the access credential; it is unguessable and single-use from Stripe).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { CALENDLY_CONFIG } from '@/lib/testing/testing-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'public');
  if (rateLimited) return rateLimited;

  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) return safeError('session_id is required', 400);

  // Resolve the Stripe session to a payment_intent_id, then look up the booking.
  // We never store the raw session_id — only the payment_intent_id — so we need
  // to call Stripe to get the mapping.
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return safeError('Stripe not configured', 503);

  let paymentIntentId: string | null = null;
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [],
    });
    paymentIntentId = session.payment_intent as string ?? null;
  } catch {
    // Session not found or Stripe error — return not-found gracefully
    return NextResponse.json({ found: false });
  }

  if (!paymentIntentId) {
    return NextResponse.json({ found: false });
  }

  const db = createAdminClient();
  const { data: booking } = await db
    .from('exam_bookings')
    .select('confirmation_code, exam_name, calendly_scheduling_url')
    .eq('payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (!booking) {
    // Webhook may not have fired yet — return not-found; client will retry
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found:                  true,
    confirmationCode:       booking.confirmation_code,
    examName:               booking.exam_name,
    calendlySchedulingUrl:  booking.calendly_scheduling_url ?? CALENDLY_CONFIG.testingUrl,
  });
}
