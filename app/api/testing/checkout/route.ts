/**
 * POST /api/testing/checkout
 *
 * Creates a Stripe Checkout session for an exam booking fee.
 * Called before the booking form submits — user must pay first.
 *
 * Body: {
 *   examType: string        — provider key (e.g. 'workkeys', 'nha')
 *   examName: string        — display name (e.g. 'Applied Math')
 *   feeCents: number        — amount in cents
 *   bookingType: string     — 'individual' | 'organization'
 *   participantCount: number
 *   email?: string          — prefill Stripe checkout
 *   name?: string
 * }
 *
 * Returns: { url: string } — Stripe hosted checkout URL
 *
 * On success, Stripe fires checkout.session.completed →
 * /api/testing/webhook sets payment_status='paid' on the pending booking.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { CERT_PROVIDERS } from '@/lib/testing/proctoring-capabilities';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return safeError('Stripe not configured', 500);

  const rateLimited = await applyRateLimit(req, 'payment');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;

  let body: {
    examType: string;
    examName?: string;
    feeCents: number;
    bookingType?: string;
    participantCount?: number;
    email?: string;
    name?: string;
    pendingBookingId?: string; // set if booking row already created
  };

  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { examType, examName, bookingType, participantCount, email, name, pendingBookingId, addOn, slotId } = body;

  if (!examType) {
    return safeError('examType is required', 400);
  }

  // Fee comes from server-side CERT_PROVIDERS — never trust client-supplied feeCents
  const provider = CERT_PROVIDERS[examType as keyof typeof CERT_PROVIDERS];
  if (!provider) return safeError('Unknown exam type', 400);

  // Use the lowest published fee as the canonical amount
  const feeCents = provider.fees && provider.fees.length > 0
    ? Math.min(...provider.fees.map(f => f.amount * 100))
    : 0;

  if (feeCents <= 0) {
    return safeError('No fee configured for this exam type', 400);
  }

  const stripe = new Stripe(stripeKey);
  const qty = bookingType === 'organization' ? (participantCount ?? 1) : 1;
  const displayName = examName ?? provider.name;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // automatic_payment_methods lets Stripe show card + BNPL (Klarna, Afterpay,
      // CashApp) based on what's enabled in the Stripe Dashboard — no extra
      // redirect pages, no hardcoded list to maintain.
      automatic_payment_methods: { enabled: true },
      customer_email: email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: feeCents,
            product_data: {
              name: `${displayName} — Exam Fee`,
              description: `Proctored at Elevate for Humanity Testing Center, Indianapolis IN`,
            },
          },
          quantity: qty,
        },
      ],
      metadata: {
        payment_type: 'testing_fee',
        exam_type: examType,
        exam_name: displayName,
        booking_type: bookingType ?? 'individual',
        participant_count: String(qty),
        pending_booking_id: pendingBookingId ?? '',
        add_on: addOn === true ? 'true' : 'false',
        slot_id: slotId ?? '',
      },

      success_url: `${SITE_URL}/testing/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/certification-testing?cancelled=1`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    return safeInternalError(err, 'Failed to create checkout session');
  }
}
