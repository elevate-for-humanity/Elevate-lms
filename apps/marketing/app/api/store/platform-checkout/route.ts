import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  getBasePlan,
  getAddOn,
  priceCents,
  addonPriceCents,
  type BillingInterval,
} from '@/lib/store/platform-pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.elevateforhumanity.org';

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user?.id || !user.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const planId = typeof body.planId === 'string' ? body.planId : '';
  const interval: BillingInterval = body.interval === 'annual' ? 'annual' : 'monthly';
  const addonSlugs = Array.isArray(body.addonSlugs)
    ? [...new Set(body.addonSlugs.filter((v: unknown): v is string => typeof v === 'string'))]
    : [];

  const plan = getBasePlan(planId);
  if (!plan) {
    return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
  }

  const addons = addonSlugs.map(getAddOn);
  if (addons.some((addon) => !addon)) {
    return NextResponse.json({ error: 'One or more add-ons are invalid' }, { status: 400 });
  }

  const admin = await requireAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Billing service unavailable' }, { status: 503 });
  }

  const { data: organization, error: orgError } = await admin
    .from('organizations')
    .select('id, name, contact_email')
    .eq('contact_email', user.email.toLowerCase())
    .maybeSingle();

  if (orgError) {
    return NextResponse.json({ error: 'Could not resolve your organization' }, { status: 500 });
  }

  if (!organization?.id) {
    return NextResponse.json(
      {
        error: 'Start your organization trial first so the subscription can be attached to the correct workspace.',
        trialUrl: '/store/trial',
      },
      { status: 409 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const recurringInterval = interval === 'annual' ? 'year' : 'month';
  const lineItems: any[] = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Elevate Platform — ${plan.name}`,
          metadata: { plan_id: plan.id },
        },
        unit_amount: priceCents(plan, interval),
        recurring: { interval: recurringInterval },
      },
      quantity: 1,
    },
  ];

  for (const addon of addons) {
    if (!addon) continue;
    const amount = interval === 'annual' ? addonPriceCents(addon) * 12 : addonPriceCents(addon);
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Elevate Add-on — ${addon.name}`,
          metadata: { addon_slug: addon.slug },
        },
        unit_amount: amount,
        recurring: { interval: recurringInterval },
      },
      quantity: 1,
    });
  }

  const metadata = {
    checkout_type: 'platform_saas',
    user_id: user.id,
    tenant_id: organization.id,
    plan_id: plan.id,
    billing_interval: interval,
    addon_slugs: addonSlugs.join(','),
  };

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: lineItems,
    customer_email: user.email,
    allow_promotion_codes: true,
    client_reference_id: user.id,
    metadata,
    subscription_data: { metadata },
    success_url: `${SITE_URL}/store/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/store/plans?checkout=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: session.url });
}
