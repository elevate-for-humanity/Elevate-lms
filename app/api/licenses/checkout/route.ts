import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { getCatalogProduct } from '@/lib/store/db';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';

/**
 * POST /api/licenses/checkout
 * 
 * Creates a Stripe Checkout session for license purchase.
 * After successful payment, the webhook at /api/licenses/webhook
 * will activate the license.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      plan_id,
      organization_name,
      organization_type = 'training_provider',
      billing_email,
    } = body;

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    // Find the license product from DB (with hardcoded fallback)
    let license: Awaited<ReturnType<typeof getCatalogProduct>> = null;
    try { license = await getCatalogProduct(plan_id); } catch { /* DB unavailable */ }
    if (!license) {
      const { ALL_PRODUCTS } = await import('@/app/data/store-products');
      const legacy = ALL_PRODUCTS.find(l => l.slug === plan_id || l.id === plan_id);
      if (legacy) {
        license = {
          id: legacy.id,
          slug: legacy.slug,
          name: legacy.name,
          description: legacy.description,
          price: legacy.price,
          billingType: legacy.billingType as any || 'one_time',
          licenseType: legacy.licenseType as any,
          features: legacy.features || [],
          appsIncluded: legacy.appsIncluded,
          stripePriceId: legacy.stripePriceId,
          stripeProductId: undefined,
          isActive: true,
        };
      }
    }
    if (!license) {
      return NextResponse.json({ error: 'Invalid plan_id' }, { status: 400 });
    }

    const stripe = getStripe();

    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    const { data: profile } = await db
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: billing_email || user.email || profile?.email,
        name: organization_name || profile?.full_name,
        metadata: {
          user_id: user.id,
          organization_name: organization_name || '',
          organization_type,
        },
      });
      stripeCustomerId = customer.id;

      await db
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // Get or create organization
    let organizationId: string;
    
    const { data: existingOrg } = await db
      .from('organizations')
      .select('id')
      .eq('contact_email', billing_email || user.email)
      .single();

    if (existingOrg) {
      organizationId = existingOrg.id;
    } else {
      const { data: newOrg } = await db
        .from('organizations')
        .insert({
          name: organization_name || `${profile?.full_name}'s Organization`,
          type: organization_type,
          contact_name: profile?.full_name || 'Account Owner',
          contact_email: billing_email || user.email,
        })
        .select('id')
        .single();
      
      organizationId = newOrg?.id;

      // Link user to organization
      await db
        .from('profiles')
        .update({ organization_id: organizationId })
        .eq('id', user.id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: license.billingType === 'subscription' ? 'subscription' : 'payment',
      payment_method_types: ['card', 'affirm', 'klarna', 'afterpay_clearpay'],
      line_items: [
        {
          price: license.stripePriceId || undefined,
          price_data: !license.stripePriceId ? {
            currency: 'usd',
            product_data: {
              name: license.name,
              description: license.description,
            },
            unit_amount: license.price, // already in cents
            ...(license.billingType === 'subscription' ? {
              recurring: {
                interval: 'year',
              },
            } : {}),
          } : undefined,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        organization_id: organizationId,
        plan_id: license.slug,
        license_type: license.licenseType || 'single',
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/store/licenses/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/store/licenses/${license.slug}?canceled=true`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error('License checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/licenses/checkout
 * 
 * Get checkout session status
 */
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      plan_id: session.metadata?.plan_id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
