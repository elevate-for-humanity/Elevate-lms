import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// App pricing (monthly in cents)
const APP_PRICES: Record<string, Record<string, number>> = {
  'sam-gov': {
    starter: 4900,
    professional: 14900,
    enterprise: 39900,
  },
  'grants': {
    starter: 7900,
    professional: 19900,
    enterprise: 49900,
  },
  'website-builder': {
    starter: 2900,
    professional: 7900,
    enterprise: 19900,
  },
};

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appSlug, plan } = await request.json();

    if (!appSlug || !plan) {
      return NextResponse.json({ error: 'App slug and plan required' }, { status: 400 });
    }

    const prices = APP_PRICES[appSlug];
    if (!prices || !prices[plan]) {
      return NextResponse.json({ error: 'Invalid app or plan' }, { status: 400 });
    }

    const priceInCents = prices[plan];

    // Get or create Stripe customer
    let customerId: string;
    
    const { data: profile } = await db
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const stripe = getStripe();
    
    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await db
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'affirm', 'klarna', 'afterpay_clearpay'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${appSlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
              description: `Monthly subscription to ${appSlug} app`,
            },
            unit_amount: priceInCents,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/apps/${appSlug}?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/store/apps/${appSlug}?canceled=true`,
      metadata: {
        user_id: user.id,
        app_slug: appSlug,
        plan: plan,
      },
    });

    return NextResponse.json({ 
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error) {
    logger.error('Upgrade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/apps/upgrade', _POST);
