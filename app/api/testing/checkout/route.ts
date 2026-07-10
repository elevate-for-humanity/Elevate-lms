// PUBLIC ROUTE: testing checkout
/**
 * POST /api/testing/checkout
 *
 * Creates a Stripe Checkout session for an exam booking fee.
 * Called before the booking form submits — user must pay first.
 *
 * Body: {
 *   examType: string        — provider key (e.g. 'workkeys', 'nha')
 *   examName: string        — display name (e.g. 'Applied Math')
 *   feeCents?: number       — ignored; amount is always resolved server-side
 *   bookingType: string     — 'individual' | 'organization'
 *   participantCount: number
 *   email?: string          — prefill Stripe checkout
 *   name?: string
 *   cartItems?: CartItem[]  — multi-exam cart; total is sum of per-exam amountCents
 * }
 *
 * Returns: { url: string } — Stripe hosted checkout URL
 *
 * On success, Stripe fires checkout.session.completed →
 * /api/testing/webhook sets payment_status='paid' on the pending booking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { CERT_PROVIDERS, type ExamDefinition } from '@/lib/testing/proctoring-capabilities';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface CartItem {
  examType: string;
  examName: string;
  amountCents: number;
}

/**
 * Resolve the server-authoritative price for a single exam.
 * Looks up the exam by name in CERT_PROVIDERS[examType].exams.
 * Falls back to the provider's minimum published fee if no per-exam price is set.
 */
function resolveExamAmountCents(examType: string, examName?: string): number {
  const provider = CERT_PROVIDERS[examType];
  if (!provider) return 0;

  // Try to find a matching exam with amountCents
  if (examName && provider.exams) {
    const match = provider.exams.find(
      (e): e is ExamDefinition =>
        typeof e === 'object' && e.name === examName && typeof e.amountCents === 'number',
    );
    if (match?.amountCents) return match.amountCents;
  }

  // Fall back to provider minimum fee
  if (provider.fees && provider.fees.length > 0) {
    return Math.min(...provider.fees.map((f) => f.amount * 100));
  }

  return 0;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();

  const stripe = getStripe();
  if (!stripe) return safeError('Stripe not configured', 503);

  // Use 'public' tier — fails open if Redis is unavailable so checkout is never blocked
  // by infrastructure issues. Stripe's own fraud detection is the primary abuse layer.
  const rateLimited = await applyRateLimit(req, 'public');
  if (rateLimited) return rateLimited;

  let body: {
    examType: string;
    examName?: string;
    feeCents?: number; // ignored — amount always resolved server-side
    bookingType?: string;
    participantCount?: number;
    email?: string;
    name?: string;
    pendingBookingId?: string;
    addOn?: boolean;
    slotId?: string;
    cartItems?: CartItem[];
  };

  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const {
    examType,
    examName,
    bookingType,
    participantCount,
    email,
    name,
    pendingBookingId,
    addOn,
    slotId,
    cartItems,
  } = body;

  if (!examType) {
    return safeError('examType is required', 400);
  }

  const provider = CERT_PROVIDERS[examType as keyof typeof CERT_PROVIDERS];
  if (!provider) return safeError('Unknown exam type', 400);

  // Multi-exam cart: sum server-resolved prices for each item.
  // Single exam: resolve by examName, fall back to provider minimum.
  let feeCents: number;
  let displayName: string;

  if (cartItems && cartItems.length > 0) {
    // Validate every item belongs to a known provider, then sum server-side prices.
    feeCents = cartItems.reduce((sum, item) => {
      const cents = resolveExamAmountCents(item.examType, item.examName);
      return sum + cents;
    }, 0);
    displayName =
      cartItems.length === 1
        ? cartItems[0].examName
        : `${cartItems.length} Exams — ${cartItems.map((i) => i.examName).join(', ')}`;
  } else {
    feeCents = resolveExamAmountCents(examType, examName);
    displayName = examName ?? provider.name;
  }

  if (feeCents <= 0) {
    return safeError('No fee configured for this exam type', 400);
  }

  const qty = bookingType === 'organization' ? (participantCount ?? 1) : 1;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: feeCents,
            product_data: {
              name: `${displayName} — Exam Fee`,
              description: `Proctored at ${PLATFORM_DEFAULTS.orgName} Testing Center, Indianapolis IN`,
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
        // Cart items stored as JSON for the webhook to record all exams on the booking.
        // Stripe metadata values are strings, max 500 chars each.
        cart_items:
          cartItems && cartItems.length > 1
            ? JSON.stringify(cartItems.map((i) => ({ t: i.examType, n: i.examName }))).slice(0, 500)
            : '',
      },

      success_url: `${SITE_URL}/testing/book?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/testing/book?cancelled=1`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    return safeInternalError(err, 'Failed to create checkout session');
  }
}
