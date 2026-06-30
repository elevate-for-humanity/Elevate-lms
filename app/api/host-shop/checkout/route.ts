/**
 * Host Shop Application Fee Checkout API
 * 
 * Creates a Stripe checkout session for the \$50 host shop application fee.
 * 
 * POST /api/host-shop/checkout
 * Body: {
 *   businessName: string,
 *   businessType: 'salon' | 'barbershop' | 'spa' | 'nail_studio' | 'other',
 *   contactName: string,
 *   contactEmail: string,
 *   contactPhone: string,
 *   licenseNumber?: string,
 *   address?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOST_SHOP_FEE_PRICE_ID = 'price_1TiF5rH4a2yrVOt55GqwSgJW';
const HOST_SHOP_FEE_AMOUNT_CENTS = 5000;

interface CheckoutBody {
  businessName?: string;
  businessType?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  licenseNumber?: string;
  address?: string;
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

  const {
    businessName,
    businessType,
    contactName,
    contactEmail,
    contactPhone,
    licenseNumber,
    address,
    successUrl,
    cancelUrl,
  } = body;

  if (!contactEmail) {
    return NextResponse.json({ error: 'contactEmail is required' }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    logger.error('Host shop checkout: Stripe not configured');
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: HOST_SHOP_FEE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: contactEmail,
      metadata: {
        type: 'host_shop_application',
        business_name: businessName || '',
        business_type: businessType || '',
        contact_name: contactName || '',
        email: contactEmail,
        phone: contactPhone || '',
        license_number: licenseNumber || '',
        address: address || '',
        fee_amount: String(HOST_SHOP_FEE_AMOUNT_CENTS),
      },
      success_url: successUrl || `${siteUrl}/host-shop/apply/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${siteUrl}/host-shop/apply?cancelled=true`,
      description: 'Elevate Host Shop Application Fee - Non-Refundable',
      billing_address_collection: 'required',
      automatic_tax: { enabled: false },
    });

    logger.info('Host shop checkout session created', {
      sessionId: session.id,
      businessName,
      contactEmail,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Host shop checkout failed', undefined, { error: msg, contactEmail });
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}