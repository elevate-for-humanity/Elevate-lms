/**
 * Host Shop Subscription Checkout API
 * 
 * Creates a Stripe checkout session for host shop partnership subscriptions.
 * 
 * POST /api/host-shop/subscription/checkout
 * Body: {
 *   tier: 'bronze' | 'silver' | 'gold' | 'platinum',
 *   businessId?: string (for upgrades)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Tier price IDs
const TIER_PRICES: Record<string, string> = {
  bronze: 'price_1TiF8dH4a2yrVOt5fy0CXhzU',
  silver: 'price_1TiF8dH4a2yrVOt5s94Yahuz',
  gold: 'price_1TiF8eH4a2yrVOt5ZGOabbXr',
  platinum: 'price_1TiF8eH4a2yrVOt5G7vFM0Q4',
};

const TIER_NAMES: Record<string, string> = {
  bronze: 'Bronze Host Partner',
  silver: 'Silver Growth Partner',
  gold: 'Gold Business Accelerator',
  platinum: 'Platinum Elite Partner',
};

interface CheckoutBody {
  tier?: string;
  businessId?: string;
  email?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export async function POST(request: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { tier, businessId, email, successUrl, cancelUrl } = body;

  if (!tier || !TIER_PRICES[tier]) {
    return NextResponse.json({ 
      error: 'Invalid tier. Must be: bronze, silver, gold, or platinum' 
    }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    logger.error('Host shop subscription checkout: Stripe not configured');
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: TIER_PRICES[tier],
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        type: 'host_shop_subscription',
        tier,
        business_id: businessId || '',
      },
      success_url: successUrl || `${siteUrl}/host-shop/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${siteUrl}/host-shop/partnership?cancelled=true`,
      description: `Elevate Host Shop Partnership - ${TIER_NAMES[tier]}`,
      billing_address_collection: 'required',
      automatic_tax: { enabled: false },
    });

    logger.info('Host shop subscription checkout created', {
      sessionId: session.id,
      tier,
      email,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Host shop subscription checkout failed', undefined, { error: msg, tier, email });
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}