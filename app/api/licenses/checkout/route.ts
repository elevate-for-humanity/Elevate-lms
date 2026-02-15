import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { CLONE_LICENSES } from '@/app/data/store-products';
import { applyRateLimit } from '@/lib/api/withRateLimit';

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

    // Find the license product
    const license = CLONE_LICENSES.find(l => l.slug === plan_id || l.id === plan_id);
    if (!license) {
      return NextResponse.json({ error: 'Invalid plan_id' }, { status: 400 });
    }

    const stripe = getStripe();

    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    const { data: profile } = await supabase
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

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // Get or create organization
    let organizationId: string;
    
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('contact_email', billing_email || user.email)
      .single();

    if (existingOrg) {
      organizationId = existingOrg.id;
    } else {
      const { data: newOrg } = await supabase
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
      await supabase
        .from('profiles')
        .update({ organization_id: organizationId })
        .eq('id', user.id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: license.billingType === 'subscription' ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: license.stripePriceId || undefined,
          price_data: !license.stripePriceId ? {
            currency: 'usd',
            product_data: {
              name: license.name,
              description: license.description,
            },
            unit_amount: license.price * 100,
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
      { error: error instanceof Error ? error.message : 'Checkout failed' },
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
