import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRODUCT = {
  name: 'Meri-Gold-Round Multi-Zone Essential Oil',
  description: '10 mL essential-oil roller for hair, scalp, skin, body, massage, and daily wellness.',
  unitAmount: 2499,
};

export async function POST(request: NextRequest) {
  const originHeader = request.headers.get('origin');
  const allowedOrigins = new Set([
    'https://www.elevateforhumanity.org',
    'https://elevateforhumanity.org',
  ]);
  if (originHeader && !allowedOrigins.has(originHeader)) {
    return NextResponse.json({ error: 'Invalid checkout origin.' }, { status: 403 });
  }

  let payload: { quantity?: unknown; email?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 });
  }

  const quantity = Number(payload.quantity);
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 6) {
    return NextResponse.json({ error: 'Choose a quantity from 1 to 6.' }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Payment is temporarily unavailable.' }, { status: 503 });
  }

  const origin = originHeader && allowedOrigins.has(originHeader)
    ? originHeader
    : 'https://www.elevateforhumanity.org';
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: PRODUCT.name,
            description: PRODUCT.description,
            images: [`${origin}/images/meri-gold-round/product-lineup.webp`],
          },
          unit_amount: PRODUCT.unitAmount,
        },
        quantity,
      }],
      customer_email: email || undefined,
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ['US'] },
      allow_promotion_codes: true,
      metadata: {
        kind: 'meri_gold_round_purchase',
        product_slug: 'meri-gold-round-multi-zone-oil',
        quantity: String(quantity),
      },
      success_url: `${origin}/meri-gold-round/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/meri-gold-round?checkout=cancelled#shop`,
    });
    if (!session.url) throw new Error('Stripe did not return a checkout URL.');
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    logger.error('[meri-gold-round/checkout] session creation failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Unable to start secure checkout. Please try again.' }, { status: 500 });
  }
}
