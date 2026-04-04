/**
 * POST /api/booth-rental/checkout
 *
 * Creates a Stripe Checkout session for booth/suite rental signup.
 *
 * Billing flow:
 *   1. If discipline has a deposit: collect deposit as a one-time line item
 *      AND set up a weekly subscription starting next Friday.
 *   2. If no deposit (esthetician): collect first week's rent immediately
 *      AND set up weekly subscription starting the Friday after.
 *
 * After payment, Stripe redirects to /booth-rental/sign-mou?session_id=...
 * The renter signs the MOU before access is granted.
 *
 * Card is saved to the Stripe customer for automatic weekly billing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import {
  getBoothRentalTier,
  getBillingCycleAnchor,
  type BoothRentalDiscipline,
} from '@/lib/programs/pricing';
import { PRICES } from '@/lib/stripe/prices';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const {
      discipline,
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      licenseState,
      boothPreference,
      smsConsent,
    } = body;

    // Validate discipline
    const tier = getBoothRentalTier(discipline);
    if (!tier) return safeError('Invalid discipline', 400);

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !licenseNumber) {
      return safeError('Missing required fields', 400);
    }

    const stripe = getStripe();
    if (!stripe) return safeError('Payment system unavailable', 503);

    const supabase = await createClient();

    // Get or create Stripe customer
    const { data: { user } } = await supabase.auth.getUser();
    let stripeCustomerId: string | undefined;

    if (user) {
      // Check if profile already has a Stripe customer ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();
      stripeCustomerId = profile?.stripe_customer_id ?? undefined;
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`,
        phone,
        metadata: {
          discipline,
          license_number: licenseNumber,
          license_state: licenseState,
          booth_preference: boothPreference || '',
          sms_consent: smsConsent ? 'true' : 'false',
          source: 'booth-rental-signup',
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to profile if authenticated
      if (user) {
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', user.id);
      }
    }

    // Resolve Stripe price IDs
    const weeklyPriceId = PRICES[tier.stripePriceKey as keyof typeof PRICES];
    const depositPriceId = tier.stripeDepositKey
      ? PRICES[tier.stripeDepositKey as keyof typeof PRICES]
      : null;

    if (!weeklyPriceId) {
      logger.error('[booth-rental/checkout] Missing Stripe price ID', { discipline, key: tier.stripePriceKey });
      return safeError('Pricing not configured for this discipline. Please contact us.', 503);
    }

    // Build line items
    // - Deposit disciplines: deposit (one-time) + weekly subscription
    // - No-deposit disciplines (esthetician): first week (one-time) + weekly subscription
    const lineItems: { price_data?: object; price?: string; quantity: number }[] = [];

    if (tier.depositDollars > 0 && depositPriceId) {
      // Deposit as one-time line item
      lineItems.push({ price: depositPriceId, quantity: 1 });
    } else if (tier.depositDollars === 0) {
      // First week's rent collected upfront as one-time charge
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: tier.weeklyRateCents,
          product_data: {
            name: `${tier.label} ${tier.spaceType} — First Week`,
            description: `First week's rent at Elevate for Humanity`,
          },
        },
        quantity: 1,
      });
    }

    // Weekly subscription line item
    lineItems.push({ price: weeklyPriceId, quantity: 1 });

    // Subscription starts next Friday
    const billingAnchor = getBillingCycleAnchor();

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: lineItems as any,
      subscription_data: {
        billing_cycle_anchor: billingAnchor,
        prorate: false,
        metadata: {
          discipline,
          renter_name: `${firstName} ${lastName}`,
          renter_email: email,
          license_number: licenseNumber,
          license_state: licenseState,
          booth_preference: boothPreference || '',
          source: 'booth-rental-signup',
        },
      },
      customer_update: {
        address: 'auto',
      },
      payment_method_collection: 'always',
      success_url: `${SITE_URL}/booth-rental/sign-mou?session_id={CHECKOUT_SESSION_ID}&discipline=${discipline}`,
      cancel_url: `${SITE_URL}/booth-rental/apply?discipline=${discipline}`,
      metadata: {
        discipline,
        renter_name: `${firstName} ${lastName}`,
        renter_email: email,
        source: 'booth-rental-signup',
      },
    });

    logger.info('[booth-rental/checkout] Session created', {
      session_id: session.id,
      discipline,
      email,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return safeInternalError(err, 'Failed to create checkout session');
  }
}
