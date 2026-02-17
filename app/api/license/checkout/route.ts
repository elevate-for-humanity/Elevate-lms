import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PLANS, PlanId, TRIAL_DAYS } from '@/lib/license/types';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

/**
 * POST /api/license/checkout
 * 
 * Creates a Stripe Checkout session for license subscription.
 * - Card required upfront (payment_method_collection: 'always')
 * - 14-day trial, no charge until trial ends
 * - Auto-cancels if no payment method at trial end
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;


    const body = await request.json();
    const { 
      planId, 
      organizationName, 
      organizationType,
      contactName, 
      contactEmail,
      agreementsAccepted, // Required: must accept EULA, TOS, AUP, Disclosures, License Agreement
    } = body;

    // Verify agreements were accepted
    const requiredAgreements = ['eula', 'tos', 'aup', 'disclosures', 'license'];
    if (!agreementsAccepted || !Array.isArray(agreementsAccepted)) {
      return NextResponse.json(
        { error: 'You must accept all required agreements to proceed' },
        { status: 400 }
      );
    }
    
    const missingAgreements = requiredAgreements.filter(a => !agreementsAccepted.includes(a));
    if (missingAgreements.length > 0) {
      return NextResponse.json(
        { error: `Missing required agreements: ${missingAgreements.join(', ')}` },
        { status: 400 }
      );
    }

    // Check Stripe is configured
    if (!stripe) {
      logger.error('Stripe not configured: STRIPE_SECRET_KEY missing');
      return NextResponse.json(
        { error: 'Payment system is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Validate plan
    if (!planId || !PLANS[planId as PlanId]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!organizationName || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Block disposable email domains
    const disposableDomains = ['tempmail.com', 'throwaway.com', 'mailinator.com', '10minutemail.com'];
    const emailDomain = contactEmail.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(emailDomain)) {
      return NextResponse.json(
        { error: 'Please use a work email address' },
        { status: 400 }
      );
    }

    const plan = PLANS[planId as PlanId];
    const origin = request.nextUrl.origin;

    // Check if plan requires contact (enterprise)
    if (plan.requiresContact) {
      return NextResponse.json(
        { error: 'This plan requires contacting sales. Please use the request form.' },
        { status: 400 }
      );
    }

    // Check if plan has a Stripe price ID
    if (!plan.stripePriceId) {
      logger.error(`Missing Stripe price ID for plan: ${planId}. Set STRIPE_PRICE_* env vars.`);
      return NextResponse.json(
        { error: 'This plan is not yet configured for checkout. Please contact support.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      email: contactEmail,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      
      // Check if customer already has an active subscription (prevent trial abuse)
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
      });
      
      const hasActiveOrTrialing = subscriptions.data.some(
        sub => sub.status === 'active' || sub.status === 'trialing'
      );
      
      if (hasActiveOrTrialing) {
        return NextResponse.json(
          { error: 'You already have an active subscription. Please manage it from your account.' },
          { status: 400 }
        );
      }
    } else {
      const customer = await stripe.customers.create({
        email: contactEmail,
        name: contactName,
        metadata: {
          organization_name: organizationName,
          organization_type: organizationType || 'other',
        },
      });
      customerId = customer.id;
    }

    // Create Checkout Session with subscription + trial + card required
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      // Force card collection upfront
      payment_method_collection: 'always',
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        trial_settings: {
          end_behavior: {
            // Cancel subscription if no payment method at trial end
            missing_payment_method: 'cancel',
          },
        },
        metadata: {
          organization_name: organizationName,
          organization_type: organizationType || 'other',
          plan_id: planId,
        },
      },
      metadata: {
        organization_name: organizationName,
        organization_type: organizationType || 'other',
        contact_name: contactName,
        plan_id: planId,
        agreements_accepted: agreementsAccepted.join(','),
        agreements_accepted_at: new Date().toISOString(),
      },
      success_url: `${origin}/store/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store?canceled=true`,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      // Custom text
      custom_text: {
        submit: {
          message: `Your ${TRIAL_DAYS}-day free trial starts now. You won't be charged until the trial ends.`,
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error('Checkout error:', error);
    const message = 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
