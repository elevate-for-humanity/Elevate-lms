/**
 * Application Fee Checkout API
 *
 * Creates a Stripe checkout session for the $15 application fee.
 * 
 * Fee Policy:
 * - Programs: $15 fee required
 * - Host Shops: $15 fee required
 * - Apprenticeships: $0 NO FEE
 *
 * POST /api/application-fee/checkout
 * Body: { programSlug: string, applicationId?: string, userId?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import { 
  APPLICATION_FEE_PRICE_ID, 
  APPLICATION_FEE_AMOUNT_CENTS,
  requiresApplicationFee,
  isHostShopApplication,
  getApplicationFeeAmount
} from '@/lib/config/application-fee-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CheckoutBody {
  programSlug?: string;
  applicationId?: string;
  userId?: string;
  userEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  programType?: 'program' | 'host-shop' | 'apprenticeship';
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

  // Check if application fee is required
  const feeRequired = requiresApplicationFee(programSlug);
  const feeAmount = getApplicationFeeAmount(programSlug);
  const isHostShop = isHostShopApplication(programSlug);

  // Apprenticeships and similar programs with no fee
  if (!feeRequired || feeAmount === 0) {
    logger.info('Application fee waived', { programSlug, reason: 'apprenticeship_or_no_fee_program' });
    return NextResponse.json({
      sessionId: null,
      url: null,
      feeRequired: false,
      feeAmount: 0,
      message: 'No application fee required for this program type',
    });
  }

  const stripe = getStripe();
  if (!stripe) {
    logger.error('Application fee checkout: Stripe not configured');
    return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

  // Determine success/cancel URLs based on program type
  const successPath = isHostShop 
    ? '/partners/barber-host-shop/confirmation' 
    : `/programs/${programSlug}/apply/fee-success`;
  const cancelPath = isHostShop 
    ? '/partners/barber-host-shop/apply?cancelled=true' 
    : `/programs/${programSlug}/apply?cancelled=true`;

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
        is_host_shop: String(isHostShop),
        fee_required: String(feeRequired),
      },
      success_url: successUrl || `${siteUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${siteUrl}${cancelPath}`,
      description: `${isHostShop ? 'Host Shop' : 'Program'} Application Fee - ${programSlug}`,
      automatic_tax: { enabled: false },
      billing_address_collection: 'required',
    });

    logger.info('Application fee checkout session created', {
      sessionId: session.id,
      programSlug,
      applicationId,
      userId,
      feeAmount,
      isHostShop,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      feeRequired: true,
      feeAmount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('Application fee checkout failed', undefined, { error: msg, programSlug, userId });
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}