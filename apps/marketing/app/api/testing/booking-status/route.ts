// PUBLIC ROUTE: verifies a paid testing Checkout Session before scheduling unlocks.
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  const sessionId = request.nextUrl.searchParams.get('session_id')?.trim() || '';
  if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
    return NextResponse.json({ found: false, error: 'Invalid checkout session.' }, { status: 400 });
  }

  await hydrateProcessEnv();
  const stripe = getStripe();
  const admin = await getAdminClient();
  if (!stripe || !admin) {
    return NextResponse.json({ found: false, error: 'Verification is temporarily unavailable.' }, { status: 503 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentType = session.metadata?.payment_type;
    const isPaidTestingSession =
      session.payment_status === 'paid' &&
      session.status === 'complete' &&
      (paymentType === 'testing_fee' || paymentType === 'testing_cart');

    if (!isPaidTestingSession) {
      return NextResponse.json({ found: false }, { status: 402 });
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

    if (!paymentIntentId) {
      return NextResponse.json({ found: false }, { status: 409 });
    }

    const { data: bookings, error } = await admin
      .from('exam_bookings')
      .select('exam_type, exam_name, confirmation_code, calendly_scheduling_url, payment_status')
      .eq('payment_intent_id', paymentIntentId)
      .eq('payment_status', 'paid');

    if (error) {
      logger.error('[testing/booking-status] Booking lookup failed', new Error(error.message), {
        sessionId,
        paymentIntentId,
      });
      return NextResponse.json({ found: false }, { status: 500 });
    }

    if (!bookings?.length) {
      // Stripe is paid but the webhook is still creating the booking records. The
      // client retries briefly and never exposes scheduling until they exist.
      return NextResponse.json({ found: false }, { status: 202 });
    }

    return NextResponse.json({
      found: true,
      examName: bookings[0].exam_name,
      confirmationCode: bookings[0].confirmation_code,
      calendlySchedulingUrl: bookings[0].calendly_scheduling_url,
      bookings: bookings.map((booking) => ({
        examType: booking.exam_type,
        examName: booking.exam_name,
        confirmationCode: booking.confirmation_code,
        schedulingUrl: booking.calendly_scheduling_url,
      })),
    });
  } catch (error) {
    logger.warn('[testing/booking-status] Checkout verification failed', {
      sessionId,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ found: false }, { status: 404 });
  }
}
