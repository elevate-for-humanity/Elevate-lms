/**
 * Application Fee Checkout API
 *
 * Creates a Stripe checkout session for the $15 application fee.
 *
 * POST /api/application-fee/checkout
 * Body: { programSlug: string, applicationId?: string, userId?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APPLICATION_FEE_PRICE_ID = 'price_1TiEDyH4a2yrVOt5pYBCQc2D';
const APPLICATION_FEE_AMOUNT_CENTS = 1500;

interface CheckoutBody {
  programSlug?: string;
  applicationId?: string;
  userId?: string;
  userEmail?: string;
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

  const { programSlug, applicationId, userId, userEmail, successUrl, cancelUrl } = body;

  if (!programSlug) {
    return NextResponse.json({ error: 'programSlug is required' }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    logger.error('Application fee checkout: Stripe not configured');
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: APPLICATION_FEE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: userEmail || undefined,
      metadata: {
        type: 'application_fee',
        program_slug: programSlug,
        application_id: applicationId || '',
        user_id: userId || '',
        fee_amount: String(APPLICATION_FEE_AMOUNT_CENTS),
      },
      success_url: successUrl || `${siteUrl}/programs/${programSlug}/apply/fee-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${siteUrl}/programs/${programSlug}/apply?cancelled=true`,
      description: `Program Application Fee - ${programSlug}`,
      automatic_tax: { enabled: false },
      billing_address_collection: 'required',
    });

    logger.info('Application fee checkout session created', {
      sessionId: session.id,
      programSlug,
      applicationId,
      userId,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Application fee checkout failed', undefined, { error: msg, programSlug, userId });
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}