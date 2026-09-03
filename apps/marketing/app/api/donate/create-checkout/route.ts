// PUBLIC ROUTE: public donation checkout
// AUTH: Intentionally public — no authentication required
import { NextRequest, NextResponse } from 'next/server';

import { getStripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { amount } = await request.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid donation amount' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Payment processing is not configured' }, { status: 503 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Donation to ' + PLATFORM_DEFAULTS.orgName + '',
              description: 'Support free career training for underserved communities',
              images: ['https://www.elevateforhumanity.org/logo.jpg'],
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL}/donate/success?amount=${amount}`,
      cancel_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL}/donate?canceled=true`,
      metadata: {
        type: 'donation',
        amount: amount.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/donate/create-checkout', _POST);
