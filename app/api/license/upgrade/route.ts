import { logger } from '@/lib/logger';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';

/**
 * Subscription tiers available for upgrade
 * Prices should be configured in Stripe and env vars
 */
const SUBSCRIPTION_TIERS = {
  // Schools / Training Providers
  school_monthly: {
    name: 'School Plan (Monthly)',
    priceEnvVar: 'STRIPE_PRICE_SCHOOL_MONTHLY',
    tier: 'school_monthly',
    interval: 'month',
    features: ['Up to 100 learners', 'Core LMS features', 'Email support'],
  },
  school_annual: {
    name: 'School Plan (Annual)',
    priceEnvVar: 'STRIPE_PRICE_SCHOOL_ANNUAL',
    tier: 'school_annual',
    interval: 'year',
    features: ['Up to 100 learners', 'Core LMS features', 'Email support', 'Save 20%'],
  },
  // Organizations / Managed Licenses
  managed_monthly: {
    name: 'Managed License (Monthly)',
    priceEnvVar: 'STRIPE_PRICE_MANAGED_MONTHLY',
    tier: 'managed_monthly',
    interval: 'month',
    features: ['Up to 50 users', 'Role-based access', 'Domain isolation', 'Priority support'],
  },
  managed_annual: {
    name: 'Managed License (Annual)',
    priceEnvVar: 'STRIPE_PRICE_MANAGED_ANNUAL',
    tier: 'managed_annual',
    interval: 'year',
    features: ['Up to 50 users', 'Role-based access', 'Domain isolation', 'Priority support', 'Save 20%'],
  },
} as const;

type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;

/**
 * POST /api/license/upgrade
 * 
 * Creates a Stripe Checkout session for upgrading from trial to paid subscription.
 * Preserves tenant_id and previous_license_id for webhook processing.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { 
      tierId,
      licenseId,      // Current trial license being upgraded
      tenantId,       // Tenant to attach subscription to
    } = body;

    // Validate tier
    if (!tierId || !SUBSCRIPTION_TIERS[tierId as SubscriptionTierId]) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    const tierConfig = SUBSCRIPTION_TIERS[tierId as SubscriptionTierId];
    const priceId = process.env[tierConfig.priceEnvVar];

    if (!priceId) {
      logger.error(`Missing price ID for tier ${tierId}: ${tierConfig.priceEnvVar}`);
      return NextResponse.json(
        { error: 'Subscription tier not configured' },
        { status: 503 }
      );
    }

    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify license exists and belongs to tenant
    const adminSupabase = createAdminClient();
    const { data: license, error: licenseError } = await adminSupabase
      .from('licenses')
      .select('id, tenant_id, tier, status, stripe_customer_id')
      .eq('id', licenseId)
      .single();

    if (licenseError || !license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    if (tenantId && license.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'License does not belong to specified tenant' },
        { status: 403 }
      );
    }

    // Get or create Stripe customer
    const stripe = getStripe();
    let customerId = license.stripe_customer_id;

    if (!customerId) {
      // Get user profile for customer creation
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || undefined,
        metadata: {
          user_id: user.id,
          tenant_id: license.tenant_id,
          license_id: licenseId,
        },
      });
      customerId = customer.id;

      // Store customer ID on license
      await adminSupabase
        .from('licenses')
        .update({ stripe_customer_id: customerId })
        .eq('id', licenseId);
    }

    // Create Checkout Session for subscription
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'affirm', 'klarna', 'afterpay_clearpay'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        // Critical: webhook uses these to link subscription to tenant
        tenant_id: license.tenant_id,
        previous_license_id: licenseId,
        previous_tier: license.tier,
        new_tier: tierConfig.tier,
        upgrade_from: 'trial',
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          tenant_id: license.tenant_id,
          license_id: licenseId, // Will be updated to new license after creation
          tier: tierConfig.tier,
        },
      },
      success_url: `${baseUrl}/store/checkout/success?session_id={CHECKOUT_SESSION_ID}&upgraded_from=trial`,
      cancel_url: `${baseUrl}/store/licenses/managed?canceled=true&license_id=${licenseId}`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    logger.error('[license/upgrade] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/license/upgrade
 * 
 * Returns available subscription tiers for upgrade
 */
export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const tiers = Object.entries(SUBSCRIPTION_TIERS).map(([id, config]) => ({
    id,
    name: config.name,
    tier: config.tier,
    interval: config.interval,
    features: config.features,
    available: !!process.env[config.priceEnvVar],
  }));

  return NextResponse.json({ tiers });
}
