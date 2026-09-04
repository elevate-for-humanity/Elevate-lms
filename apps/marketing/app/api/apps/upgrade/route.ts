import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getIndividualAppCatalog } from '@/lib/apps/individual-app-plans';
import { individualAppPriceLookupKey } from '@/lib/platform/orchestration/commerce';
import { resolveCanonicalStripePrice } from '@/lib/stripe/resolve-canonical-price';
import { requireAdminClient } from '@/lib/supabase/admin';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';
import { syncIndividualAppLifecycle } from '@/lib/platform/subscription-lifecycle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STORE_URL = 'https://store.elevateforhumanity.org';

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
  if (!catalog) return NextResponse.json({ error: 'Unknown app' }, { status: 400 });

  const plan = catalog.plans.find((candidate) => candidate.id === planId);
  if (!plan) return NextResponse.json({ error: 'Unknown subscription plan' }, { status: 400 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });

  const lookupKey = individualAppPriceLookupKey(catalog.slug, plan.id);
  let stripePrice;
  try {
    stripePrice = await resolveCanonicalStripePrice(stripe, {
      lookupKey,
      unitAmount: Math.round(plan.priceMonthly * 100),
      recurringInterval: 'month',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Subscription catalog is temporarily unavailable',
        detail: error instanceof Error ? error.message : 'Stripe catalog is not configured',
      },
      { status: 503 },
    );
  }

  const metadata = {
    checkout_type: 'individual_app',
    user_id: user.id,
    app_slug: catalog.slug,
    plan_id: plan.id,
    price_lookup_key: lookupKey,
  };

  const admin = await requireAdminClient();
  const { data: existing } = await admin
    .from('user_app_subscriptions')
    .select('id,status,plan,stripe_subscription_id')
    .eq('user_id', user.id)
    .eq('app_slug', catalog.slug)
    .maybeSingle();

  if (existing?.stripe_subscription_id && ['active', 'trial'].includes(existing.status || '')) {
    try {
      const current = await stripe.subscriptions.retrieve(existing.stripe_subscription_id);
      if (['active', 'trialing'].includes(current.status)) {
        const item = current.items.data[0];
        if (!item) {
          return NextResponse.json({ error: 'The existing Stripe subscription has no billable item.' }, { status: 409 });
        }

        const updated = item.price.id === stripePrice.id
          ? current
          : await stripe.subscriptions.update(current.id, {
              items: [{ id: item.id, price: stripePrice.id, quantity: 1 }],
              metadata: { ...current.metadata, ...metadata },
              proration_behavior: 'create_prorations',
              payment_behavior: 'error_if_incomplete',
            });

        if (item.price.id === stripePrice.id && current.metadata?.plan_id !== plan.id) {
          await stripe.subscriptions.update(current.id, {
            metadata: { ...current.metadata, ...metadata },
          });
        }

        const synchronized = await stripe.subscriptions.retrieve(current.id);
        await syncIndividualAppLifecycle(admin, synchronized);

        await emitPlatformEvent(admin, {
          eventType: PlatformEventType.BILLING_SUBSCRIPTION_UPDATED,
          category: 'billing',
          source: 'marketing.api.apps.upgrade',
          actorId: user.id,
          actorType: 'user',
          subjectType: 'individual_app_subscription',
          subjectId: current.id,
          correlationId: current.id,
          idempotencyKey: `app-plan-change:${current.id}:${plan.id}:${stripePrice.id}`,
          dispatch: false,
          payload: {
            app_slug: catalog.slug,
            previous_plan: existing.plan,
            plan_id: plan.id,
            stripe_price_id: stripePrice.id,
          },
        });

        return NextResponse.json({
          checkoutUrl: `/apps/${catalog.slug}?subscription=updated&plan=${encodeURIComponent(plan.id)}`,
          updated: true,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Existing subscription could not be updated';
      return NextResponse.json(
        { error: 'We could not change the current subscription without creating a duplicate.', detail: message },
        { status: 409 },
      );
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    client_reference_id: user.id,
    allow_promotion_codes: true,
    metadata,
    subscription_data: { metadata },
    line_items: [{ price: stripePrice.id, quantity: 1 }],
    success_url: `${STORE_URL}/store/apps/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${STORE_URL}/store/apps/${catalog.slug}?checkout=cancelled`,
  });

  if (!session.url) return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });

  try {
    await emitPlatformEvent(admin, {
      eventType: PlatformEventType.COMMERCE_CHECKOUT_CREATED,
      category: 'commerce',
      source: 'marketing.api.apps.upgrade',
      actorId: user.id,
      actorType: 'user',
      subjectType: 'individual_app_subscription',
      subjectId: session.id,
      correlationId: session.id,
      idempotencyKey: `stripe-checkout-created:${session.id}`,
      dispatch: false,
      payload: {
        app_slug: catalog.slug,
        plan_id: plan.id,
        stripe_price_id: stripePrice.id,
        price_lookup_key: lookupKey,
      },
    });
  } catch {
    // Checkout must not fail because audit/event telemetry is unavailable.
  }

  return NextResponse.json({ checkoutUrl: session.url });
}
