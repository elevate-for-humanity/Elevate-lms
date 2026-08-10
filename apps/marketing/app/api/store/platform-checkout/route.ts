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
  const tenantId = await resolveTenantIdForUser(user.id);
  if (!tenantId) {
    return NextResponse.json(
      {
        error: 'Start your organization trial first so the subscription can be attached to the correct workspace.',
        trialUrl: '/store/trial',
      },
      { status: 409 },
    );
  }

  const billingOrganizationId = await resolveBillingOrganizationId(tenantId, admin);
  if (!billingOrganizationId) {
    return NextResponse.json(
      {
        error: 'Your workspace is not linked to a billing organization yet.',
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

  const lineItems: Array<{ price: string; quantity: number }> = [
    { price: basePrice.id, quantity: 1 },
  ];

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
        productMetadata: {
          type: 'platform_addon',
          addon_code: addonCode,
          addon_slug: addon.slug,
        },
        priceMetadata: {
          checkout_type: 'platform_saas',
          addon_code: addonCode,
          addon_slug: addon.slug,
          billing_interval: interval,
        },
      });
      lineItems.push({ price: price.id, quantity: 1 });
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
      },
    });
  } catch {
    // Audit/event telemetry must not invalidate an otherwise valid Stripe checkout.
  }

  return NextResponse.json({ checkoutUrl: session.url });
}
