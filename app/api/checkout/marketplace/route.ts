import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { stripe } from '@/lib/stripe/client';
import {
  rateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RateLimitPresets,
} from '@/lib/rateLimit';
import { toError, toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;


  // Rate limiting: 10 checkouts per minute per IP
  const identifier = getClientIdentifier(req.headers);
  const rateLimitResult = rateLimit(identifier, RateLimitPresets.STRICT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    );
  }

  try {
    const { productId, creatorId, priceCents, productTitle } = await req.json();

    if (!productId || !creatorId || !priceCents) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: priceCents,
            product_data: {
              name: productTitle || 'Digital Product',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'marketplace',
        product_id: productId,
        creator_id: creatorId,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/marketplace/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/marketplace/product/${productId}`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    const error = toError(err);
    return NextResponse.json(
      { error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/checkout/marketplace', _POST);
