import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getIndividualAppCatalog } from '@/lib/apps/individual-app-plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.elevateforhumanity.org';

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id || !user.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const appSlug = typeof body.appSlug === 'string' ? body.appSlug : '';
  const planId = typeof body.plan === 'string' ? body.plan : '';

  const catalog = getIndividualAppCatalog(appSlug);
  if (!catalog) {
    return NextResponse.json({ error: 'Unknown app' }, { status: 400 });
  }

  const plan = catalog.plans.find((candidate) => candidate.id === planId);
  if (!plan) {
    return NextResponse.json({ error: 'Unknown subscription plan' }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const metadata = {
    checkout_type: 'individual_app',
    user_id: user.id,
    app_slug: catalog.slug,
    plan_id: plan.id,
  };

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    client_reference_id: user.id,
    allow_promotion_codes: true,
    metadata,
    subscription_data: { metadata },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${catalog.displayName} — ${plan.name}`,
            metadata: {
              app_slug: catalog.slug,
              plan_id: plan.id,
            },
          },
          unit_amount: Math.round(plan.priceMonthly * 100),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/store/apps/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/store/apps/${catalog.slug}?checkout=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: session.url });
}
