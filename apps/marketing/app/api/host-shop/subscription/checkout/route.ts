import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { resolveCanonicalStripePrice } from '@/lib/stripe/resolve-canonical-price';
import { HOST_SHOP_PRICE_LOOKUP_KEYS } from '@/lib/platform/orchestration/commerce';
import {
  HOST_SHOP_TIER_AMOUNTS,
  HOST_SHOP_TIER_LABELS,
  isHostShopTier,
  syncHostShopSubscriptionLifecycle,
} from '@/lib/platform/orchestration/host-shop-subscription';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.elevateforhumanity.org';
const HOST_SHOP_DASHBOARD_URL = 'https://app.elevateforhumanity.org/host-shop/dashboard';

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tier = body.tier;
  const requestedPartnerId = typeof body.partnerId === 'string' ? body.partnerId : '';
  if (!isHostShopTier(tier)) {
    return NextResponse.json({ error: 'Invalid host shop tier' }, { status: 400 });
  }

  const admin = await requireAdminClient();
  let membershipQuery = admin
    .from('partner_users')
    .select('partner_id,role,status')
    .eq('user_id', user.id);
  if (requestedPartnerId) membershipQuery = membershipQuery.eq('partner_id', requestedPartnerId);
  const { data: memberships, error: membershipError } = await membershipQuery;
  if (membershipError) return NextResponse.json({ error: 'Could not resolve host shop account' }, { status: 500 });

  const activeMemberships = (memberships ?? []).filter((row) => !row.status || row.status === 'active');
  if (activeMemberships.length !== 1) {
    return NextResponse.json(
      { error: activeMemberships.length ? 'Select exactly one host shop account' : 'No active host shop account is linked to this login' },
      { status: 409 },
    );
  }

  const partnerId = activeMemberships[0].partner_id as string;
  const { data: partner } = await admin
    .from('partners')
    .select('id,name,dba,shop_name,owner_name,contact_name,contact_email,contact_phone,phone,status,approval_status')
    .eq('id', partnerId)
    .maybeSingle();
  if (!partner) return NextResponse.json({ error: 'Host shop partner record not found' }, { status: 404 });
  if (partner.approval_status && partner.approval_status !== 'approved') {
    return NextResponse.json({ error: 'Host shop approval is required before subscribing' }, { status: 403 });
  }

  const { data: shop } = await admin
    .from('shops')
    .select('id,name,email,phone,active')
    .eq('partner_id', partnerId)
    .eq('active', true)
    .maybeSingle();

  let { data: partnership } = await admin
    .from('host_shop_partnerships')
    .select('id,partner_tier,subscription_status,stripe_subscription_id')
    .eq('partner_id', partnerId)
    .maybeSingle();

  if (!partnership) {
    const { data: created, error: createError } = await admin
      .from('host_shop_partnerships')
      .insert({
        partner_id: partnerId,
        shop_id: shop?.id ?? null,
        owner_id: user.id,
        business_name: partner.shop_name || partner.dba || partner.name,
        contact_name: partner.contact_name || partner.owner_name,
        contact_email: partner.contact_email || user.email,
        contact_phone: partner.contact_phone || partner.phone || shop?.phone || null,
        status: 'pending',
        partner_tier: 'free',
        subscription_status: 'inactive',
        portal_access_enabled: false,
      })
      .select('id,partner_tier,subscription_status,stripe_subscription_id')
      .single();
    if (createError || !created) {
      return NextResponse.json({ error: 'Could not create host shop billing profile' }, { status: 500 });
    }
    partnership = created;
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });

  const lookupKey = HOST_SHOP_PRICE_LOOKUP_KEYS[`${tier}_monthly` as keyof typeof HOST_SHOP_PRICE_LOOKUP_KEYS];
  let price;
  try {
    price = await resolveCanonicalStripePrice(stripe, {
      lookupKey,
      unitAmount: HOST_SHOP_TIER_AMOUNTS[tier],
      recurringInterval: 'month',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Host shop subscription catalog is temporarily unavailable', detail: error instanceof Error ? error.message : 'Price not found' },
      { status: 503 },
    );
  }

  const metadata = {
    type: 'host_shop_subscription',
    checkout_type: 'host_shop_subscription',
    tier,
    user_id: user.id,
    partnership_id: partnership.id,
    partner_id: partnerId,
    shop_id: shop?.id ?? '',
    price_lookup_key: lookupKey,
  };

  if (partnership.stripe_subscription_id && ['active', 'trialing'].includes(partnership.subscription_status || '')) {
    try {
      const current = await stripe.subscriptions.retrieve(partnership.stripe_subscription_id);
      const item = current.items.data[0];
      if (!item) return NextResponse.json({ error: 'Existing subscription has no billable item' }, { status: 409 });
      const updated = await stripe.subscriptions.update(current.id, {
        items: [{ id: item.id, price: price.id, quantity: 1 }],
        metadata: { ...current.metadata, ...metadata },
        proration_behavior: 'create_prorations',
        payment_behavior: 'error_if_incomplete',
      });
      await syncHostShopSubscriptionLifecycle(admin, updated);
      return NextResponse.json({
        url: `${HOST_SHOP_DASHBOARD_URL}?subscription=updated`,
        sessionId: null,
        updated: true,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Could not change the existing host shop subscription without creating a duplicate', detail: error instanceof Error ? error.message : 'Update failed' },
        { status: 409 },
      );
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    allow_promotion_codes: true,
    metadata,
    subscription_data: { metadata },
    success_url: `${SITE_URL}/host-shop/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${HOST_SHOP_DASHBOARD_URL}?checkout=cancelled`,
    billing_address_collection: 'required',
  });

  await emitPlatformEvent(admin, {
    eventType: PlatformEventType.COMMERCE_CHECKOUT_CREATED,
    category: 'commerce',
    source: 'marketing.api.host-shop.subscription.checkout',
    actorId: user.id,
    actorType: 'user',
    subjectType: 'host_shop_partnership',
    subjectId: partnership.id,
    correlationId: session.id,
    idempotencyKey: `host-shop-checkout-created:${session.id}`,
    dispatch: false,
    payload: { partner_id: partnerId, shop_id: shop?.id ?? null, tier, stripe_price_id: price.id, price_lookup_key: lookupKey },
  });

  return NextResponse.json({ sessionId: session.id, url: session.url, tierLabel: HOST_SHOP_TIER_LABELS[tier] });
}
