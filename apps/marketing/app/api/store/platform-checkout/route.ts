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
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';
import { resolveBillingOrganizationId } from '@/lib/platform/organization-features';
import { normalizeAddonCode } from '@/lib/platform/feature-catalog';
import {
  platformAddonPriceLookupKey,
  platformPlanPriceLookupKey,
} from '@/lib/platform/orchestration/commerce';
import {
  ensureCanonicalStripePrice,
  resolveCanonicalStripePrice,
} from '@/lib/stripe/resolve-canonical-price';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';
import { syncPlatformSubscriptionLifecycle } from '@/lib/platform/subscription-lifecycle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function storeOrigin(request: NextRequest): string {
  const requestedOrigin = request.nextUrl.origin.replace(/\/$/, '');
  const configured =
    process.env.STORE_URL?.trim() ||
    process.env.NEXT_PUBLIC_STORE_URL?.trim();
  if (!configured) return requestedOrigin;

  try {
    const configuredUrl = new URL(configured);
    if (configuredUrl.hostname.toLowerCase() === request.nextUrl.hostname.toLowerCase()) {
      return configuredUrl.origin;
    }
  } catch {
    // Invalid configuration must never break checkout; stay on the active host.
  }

  // This is important while the isolated Northflank runtime is live before a
  // branded store DNS alias is connected. Stripe must return the buyer to the
  // host that actually served checkout instead of redirecting to an unavailable
  // configured hostname.
  return requestedOrigin;
}

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
  if (!plan) return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });

  const addons = addonSlugs.map(getAddOn);
  if (addons.some((addon) => !addon)) {
    return NextResponse.json({ error: 'One or more add-ons are invalid' }, { status: 400 });
  }
  if (addons.some((addon) => addon?.hiddenFromMarketplace)) {
    return NextResponse.json(
      { error: 'One or more legacy add-ons are no longer available for new purchase or self-service activation' },
      { status: 400 },
    );
  }

  const redundantAddons = addons.filter(
    (addon) => addon && addon.features.length > 0 && addon.features.every((feature) => plan.features.includes(feature)),
  );
  if (redundantAddons.length) {
    return NextResponse.json(
      {
        error: `The selected ${redundantAddons.map((addon) => addon?.name).filter(Boolean).join(', ')} add-on is already included in the ${plan.name} plan.`,
      },
      { status: 400 },
    );
  }

  const admin = await requireAdminClient();
  const tenantId = await resolveTenantIdForUser(user.id);
  if (!tenantId) {
    return NextResponse.json(
      { error: 'Start your organization trial first so the subscription can be attached to the correct workspace.', trialUrl: '/store/trial' },
      { status: 409 },
    );
  }

  const billingOrganizationId = await resolveBillingOrganizationId(tenantId, admin);
  if (!billingOrganizationId) {
    return NextResponse.json(
      { error: 'Your workspace is not linked to a billing organization yet.', trialUrl: '/store/trial' },
      { status: 409 },
    );
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });

  const recurringInterval = interval === 'annual' ? 'year' : 'month';
  const baseLookupKey = platformPlanPriceLookupKey(plan.id, interval);

  let basePrice;
  try {
    basePrice = await resolveCanonicalStripePrice(stripe, {
      lookupKey: baseLookupKey,
      unitAmount: priceCents(plan, interval),
      recurringInterval,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Platform subscription catalog is temporarily unavailable',
        detail: error instanceof Error ? error.message : 'Base plan price could not be resolved',
      },
      { status: 503 },
    );
  }

  const resolvedAddonPrices: Array<{ slug: string; code: string; priceId: string }> = [];
  for (const addon of addons) {
    if (!addon) continue;
    const addonCode = normalizeAddonCode(addon.slug);
    const amount = interval === 'annual' ? addonPriceCents(addon) * 12 : addonPriceCents(addon);
    const lookupKey = platformAddonPriceLookupKey(addonCode, interval);
    try {
      const price = await ensureCanonicalStripePrice(stripe, {
        lookupKey,
        unitAmount: amount,
        recurringInterval,
        productName: `Elevate Add-on — ${addon.name} (${interval === 'annual' ? 'Annual' : 'Monthly'})`,
        nickname: `${addon.name} ${interval}`,
        productMetadata: { type: 'platform_addon', addon_code: addonCode, addon_slug: addon.slug },
        priceMetadata: {
          checkout_type: 'platform_saas',
          addon_code: addonCode,
          addon_slug: addon.slug,
          billing_interval: interval,
        },
      });
      resolvedAddonPrices.push({ slug: addon.slug, code: addonCode, priceId: price.id });
    } catch (error) {
      return NextResponse.json(
        {
          error: `The ${addon.name} billing option is temporarily unavailable`,
          detail: error instanceof Error ? error.message : 'Add-on price could not be resolved',
        },
        { status: 503 },
      );
    }
  }

  const metadata = {
    checkout_type: 'platform_saas',
    user_id: user.id,
    tenant_id: tenantId,
    billing_organization_id: billingOrganizationId,
    plan_id: plan.id,
    billing_interval: interval,
    addon_slugs: addonSlugs.join(','),
    base_price_lookup_key: baseLookupKey,
  };

  const { data: existing } = await admin
    .from('organization_subscriptions')
    .select('status,stripe_subscription_id,plan_type')
    .eq('organization_id', billingOrganizationId)
    .maybeSingle();

  if (existing?.stripe_subscription_id && ['active', 'trialing'].includes(existing.status || '')) {
    try {
      const current = await stripe.subscriptions.retrieve(existing.stripe_subscription_id);
      if (['active', 'trialing'].includes(current.status)) {
        const currentItems = current.items.data;
        if (!currentItems.length) {
          return NextResponse.json({ error: 'The existing Stripe subscription has no billable items.' }, { status: 409 });
        }

        const itemUpdates: any[] = [
          { id: currentItems[0].id, price: basePrice.id, quantity: 1 },
          ...currentItems.slice(1).map((item) => ({ id: item.id, deleted: true })),
          ...resolvedAddonPrices.map((addon) => ({ price: addon.priceId, quantity: 1 })),
        ];

        const updated = await stripe.subscriptions.update(current.id, {
          items: itemUpdates,
          metadata: { ...current.metadata, ...metadata },
          proration_behavior: 'create_prorations',
          payment_behavior: 'error_if_incomplete',
        });

        await syncPlatformSubscriptionLifecycle(admin, updated);
        await emitPlatformEvent(admin, {
          eventType: PlatformEventType.BILLING_SUBSCRIPTION_UPDATED,
          category: 'billing',
          source: 'marketing.api.store.platform-checkout',
          actorId: user.id,
          actorType: 'user',
          tenantId,
          subjectType: 'organization_subscription',
          subjectId: updated.id,
          correlationId: updated.id,
          idempotencyKey: `platform-plan-change:${updated.id}:${plan.id}:${interval}:${addonSlugs.join(',')}`,
          dispatch: false,
          payload: {
            previous_plan: existing.plan_type,
            plan_id: plan.id,
            billing_interval: interval,
            addon_slugs: addonSlugs,
            base_price_id: basePrice.id,
            addon_price_ids: resolvedAddonPrices.map((item) => item.priceId),
          },
        });

        return NextResponse.json({
          checkoutUrl: `/store/plans?subscription=updated&plan=${encodeURIComponent(plan.id)}`,
          updated: true,
        });
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'We could not change the current subscription without creating a duplicate.',
          detail: error instanceof Error ? error.message : 'Existing subscription update failed',
        },
        { status: 409 },
      );
    }
  }

  const origin = storeOrigin(request);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      { price: basePrice.id, quantity: 1 },
      ...resolvedAddonPrices.map((addon) => ({ price: addon.priceId, quantity: 1 })),
    ],
    customer_email: user.email,
    allow_promotion_codes: true,
    client_reference_id: user.id,
    metadata,
    subscription_data: { metadata },
    success_url: `${origin}/store/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/store/plans?checkout=cancelled`,
  });

  if (!session.url) return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });

  try {
    await emitPlatformEvent(admin, {
      eventType: PlatformEventType.COMMERCE_CHECKOUT_CREATED,
      category: 'commerce',
      source: 'marketing.api.store.platform-checkout',
      actorId: user.id,
      actorType: 'user',
      tenantId,
      subjectType: 'platform_subscription_checkout',
      subjectId: session.id,
      correlationId: session.id,
      idempotencyKey: `platform-checkout-created:${session.id}`,
      dispatch: false,
      payload: {
        plan_id: plan.id,
        billing_interval: interval,
        addon_slugs: addonSlugs,
        base_price_id: basePrice.id,
        base_price_lookup_key: baseLookupKey,
        addon_price_ids: resolvedAddonPrices.map((item) => item.priceId),
      },
    });
  } catch {
    // Audit/event telemetry must not invalidate an otherwise valid Stripe checkout.
  }

  return NextResponse.json({ checkoutUrl: session.url });
}
