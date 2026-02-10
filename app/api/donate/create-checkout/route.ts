import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { stripe } from '@/lib/stripe/client';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { createHash } from 'crypto';

const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000; // 5-minute window

const MAX_DONATION_CENTS = 25_000_00; // $25,000
const MIN_DONATION_CENTS = 1_00; // $1
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

// Public endpoint — anonymous donations, rate-limited with amount bounds
export async function POST(request: NextRequest) {
  try {
    const ip = getIdentifier(request);
    const { ok } = await checkRateLimit({
      key: `donate:${ip}`,
      limit: 5,
      windowSeconds: 300,
    });
    if (!ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const rawAmount = Number(body?.amount);

    if (!Number.isFinite(rawAmount) || rawAmount < 1) {
      return NextResponse.json(
        { error: 'Invalid donation amount' },
        { status: 400 }
      );
    }

    const unitAmount = Math.round(rawAmount * 100);

    if (unitAmount < MIN_DONATION_CENTS || unitAmount > MAX_DONATION_CENTS) {
      return NextResponse.json(
        { error: 'Donation must be between $1 and $25,000' },
        { status: 400 }
      );
    }

    // Stable idempotency key: same IP + amount + time window = same Stripe session.
    // Prevents duplicate charges on client retries within the window.
    const timeWindow = Math.floor(Date.now() / IDEMPOTENCY_WINDOW_MS);
    const idempotencyKey = createHash('sha256')
      .update(`donate:${ip}:${unitAmount}:${timeWindow}`)
      .digest('hex');

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Donation to Elevate for Humanity',
                description:
                  'Support free career training for underserved communities',
                images: ['https://www.elevateforhumanity.org/images/logo.png'],
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${SITE_URL}/donate/success?amount=${rawAmount}`,
        cancel_url: `${SITE_URL}/donate?canceled=true`,
        metadata: {
          type: 'donation',
          amount: rawAmount.toString(),
        },
      },
      { idempotencyKey }
    );

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
