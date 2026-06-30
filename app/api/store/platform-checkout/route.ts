import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
import {
  ADD_ON_MARKETPLACE,
  BASE_PLANS,
  addonPriceCents,
  getAddOn,
  licenseTierForPlan,
  priceCents,
  type BasePlanId,
  type BillingInterval,
} from '@/lib/store/platform-pricing';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'payment');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const planId = body.planId as BasePlanId;
    const interval = (body.interval || 'monthly') as BillingInterval;
    const addonSlugs: string[] = Array.isArray(body.addonSlugs) ? body.addonSlugs : [];

    const plan = BASE_PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (interval !== 'monthly' && interval !== 'annual') {
      return NextResponse.json({ error: 'Invalid billing interval' }, { status: 400 });
    }

    for (const slug of addonSlugs) {
      if (!getAddOn(slug)) {
        return NextResponse.json({ error: `Unknown add-on: ${slug}` }, { status: 400 });
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 });
    }

    let customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const lineItems: { price_data: object; quantity: number }[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Elevate ${plan.name} (${interval})`,
            description: plan.featureBullets.slice(0, 3).join(' · '),
          },
          unit_amount: priceCents(plan, interval),
          recurring: {
            interval: interval === 'annual' ? 'year' : 'month',
          },
        },
        quantity: 1,
      },
    ];

    for (const slug of addonSlugs) {
      const addon = ADD_ON_MARKETPLACE.find((a) => a.slug === slug);
      if (!addon) continue;
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Add-on: ${addon.name}`,
            description: addon.description,
          },
          unit_amount: addonPriceCents(addon),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${siteUrl}/store/plans?success=1`,
      cancel_url: `${siteUrl}/store/plans?canceled=1`,
      metadata: {
        checkout_type: 'platform_saas',
        user_id: user.id,
        tenant_id: profile?.tenant_id || '',
        plan_id: planId,
        billing_interval: interval,
        addon_slugs: addonSlugs.join(','),
        license_tier: licenseTierForPlan(planId, interval),
      },
      subscription_data: {
        metadata: {
          checkout_type: 'platform_saas',
          plan_id: planId,
          tenant_id: profile?.tenant_id || '',
        },
      },
    });

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    logger.error('platform-checkout error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/store/platform-checkout', _POST);
