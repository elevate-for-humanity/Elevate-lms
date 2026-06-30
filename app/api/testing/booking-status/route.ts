import { getStripeServer } from '@/lib/stripe/get-stripe-server';
// PUBLIC ROUTE: testing booking status by token
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
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import { CALENDLY_CONFIG } from '@/lib/testing/testing-config';
import { getEventTypes, createSchedulingLink } from '@/lib/testing/calendly';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withRuntime(
  { secrets: ['STRIPE_SECRET_KEY'], rateLimit: 'public' },
  async (req, ctx) => {
    const sessionId = req.nextUrl.searchParams.get('session_id');
    if (!sessionId) return safeError('session_id is required', 400);

    // Resolve the Stripe session to a payment_intent_id, then look up the booking.
    // We never store the raw session_id — only the payment_intent_id — so we need
    // to call Stripe to get the mapping.
    const stripeKey = ctx.env.STRIPE_SECRET_KEY;

    let paymentIntentId: string | null = null;
    try {
      const stripe = await getStripeServer();
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: [],
      });
      paymentIntentId = (session.payment_intent as string) ?? null;
    } catch {
      // Session not found or Stripe error — return not-found gracefully
      return NextResponse.json({ found: false });
    }

    if (!paymentIntentId) {
      return NextResponse.json({ found: false });
    }

    const db = await requireAdminClient();
    const { data: booking } = await db
      .from('exam_bookings')
      .select('confirmation_code, exam_name, calendly_scheduling_url')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (!booking) {
      // Webhook may not have fired yet — return not-found; client will retry
      return NextResponse.json({ found: false });
    }

    // If the webhook already stored a single-use link, use it directly.
    // If it stored the general/testing URL (webhook Calendly call failed) or null,
    // try to generate a fresh single-use link now so the user gets a scoped link.
    const storedUrl = booking.calendly_scheduling_url;
    const isGenericUrl =
      !storedUrl ||
      storedUrl === 'https://calendly.com/elevate4humanityedu' ||
      storedUrl === 'https://calendly.com/elevate4humanityedu/testing';

    let calendlySchedulingUrl = storedUrl ?? CALENDLY_CONFIG.testingUrl;

    if (isGenericUrl) {
      try {
        const eventTypes = await getEventTypes();
        const testingEvent =
          eventTypes.find((e) => e.slug === 'testing' || e.slug === '60min') ?? eventTypes[0];
        if (testingEvent) {
          const singleUseUrl = await createSchedulingLink({ eventTypeUri: testingEvent.uri });
          calendlySchedulingUrl = singleUseUrl;
          // Backfill the booking row so subsequent calls don't regenerate
          await db
            .from('exam_bookings')
            .update({ calendly_scheduling_url: singleUseUrl })
            .eq('payment_intent_id', paymentIntentId)
            .catch((err) =>
              logger.warn('[booking-status] Failed to backfill calendly_scheduling_url', { err }),
            );
        }
      } catch (err) {
        // Non-fatal — fall back to the testing-specific event type URL
        logger.warn('[booking-status] Could not generate single-use Calendly link', { err });
        calendlySchedulingUrl = CALENDLY_CONFIG.testingUrl;
      }
    }

    return NextResponse.json({
      found: true,
      confirmationCode: booking.confirmation_code,
      examName: booking.exam_name,
      calendlySchedulingUrl,
    });
  },
);
