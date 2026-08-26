// PUBLIC ROUTE: verifies a paid testing Checkout Session before scheduling unlocks.
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';
import { TESTING_CENTER } from '@/lib/testing/testing-config';

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
      .select('exam_type, exam_name, confirmation_code, payment_status, slot_id')
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

    const slotIds = bookings.map((booking) => booking.slot_id).filter(Boolean);
    const { data: slots } = slotIds.length
      ? await admin
          .from('testing_slots')
          .select('id, start_time, end_time, location')
          .in('id', slotIds)
      : { data: [] };
    const slotsById = new Map((slots ?? []).map((slot) => [slot.id, slot]));

    const buildGoogleCalendarUrl = (booking: (typeof bookings)[number]) => {
      const slot = booking.slot_id ? slotsById.get(booking.slot_id) : null;
      if (!slot?.start_time || !slot?.end_time) return null;
      const googleDate = (value: string) =>
        new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${booking.exam_name} — Elevate Testing Center`,
        dates: `${googleDate(slot.start_time)}/${googleDate(slot.end_time)}`,
        details: `Paid testing appointment. Confirmation code: ${booking.confirmation_code}. Call ${TESTING_CENTER.phone} after adding this appointment to confirm.`,
        location: slot.location || TESTING_CENTER.address,
      });
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    const bookingResults = bookings.map((booking) => ({
      examType: booking.exam_type,
      examName: booking.exam_name,
      confirmationCode: booking.confirmation_code,
      googleCalendarUrl: buildGoogleCalendarUrl(booking),
    }));

    return NextResponse.json({
      found: true,
      examName: bookings[0].exam_name,
      confirmationCode: bookings[0].confirmation_code,
      googleCalendarUrl: bookingResults[0]?.googleCalendarUrl ?? null,
      bookings: bookingResults,
    });
  } catch (error) {
    logger.warn('[testing/booking-status] Checkout verification failed', {
      sessionId,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ found: false }, { status: 404 });
  }
}
