import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function connectWebhookSecret(): string | null {
  const value = process.env.STRIPE_CONNECT_WEBHOOK_SECRET?.trim();
  return value && value.startsWith('whsec_') ? value : null;
}

async function syncConnectedAccount(account: Stripe.Account) {
  const db = await requireAdminClient();
  const status = account.charges_enabled && account.payouts_enabled
    ? 'active'
    : account.details_submitted ? 'restricted' : 'onboarding';
  await db.from('organization_payment_accounts').update({
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    status,
    requirements: account.requirements ?? {},
    updated_at: new Date().toISOString(),
  }).eq('stripe_account_id', account.id);
}

async function syncCheckout(session: Stripe.Checkout.Session, accountId: string | null) {
  const db = await requireAdminClient();
  const orderStatus = session.payment_status === 'paid'
    ? 'paid'
    : session.status === 'expired' ? 'expired' : 'open';

  const updates = {
    stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
    customer_email: session.customer_details?.email ?? session.customer_email ?? null,
    amount_total: session.amount_total ?? null,
    currency: session.currency ?? null,
    status: orderStatus,
    updated_at: new Date().toISOString(),
  };

  let query = db.from('tenant_orders').update(updates).eq('stripe_checkout_session_id', session.id);
  if (accountId) query = query.eq('stripe_account_id', accountId);
  const { data: order } = await query.select('tenant_id,offer_id').maybeSingle();

  if (orderStatus !== 'paid' || !order?.tenant_id || !order.offer_id) return;

  const { data: offer } = await db
    .from('tenant_offers')
    .select('access_config,pricing_type')
    .eq('id', order.offer_id)
    .maybeSingle();
  const accessConfig = offer?.access_config && typeof offer.access_config === 'object'
    ? offer.access_config as Record<string, unknown>
    : {};
  const communityPlanId = typeof accessConfig.community_plan_id === 'string'
    ? accessConfig.community_plan_id
    : null;
  if (!communityPlanId || !session.customer_details?.email) return;

  const { data: user } = await db
    .from('profiles')
    .select('id')
    .ilike('email', session.customer_details.email)
    .maybeSingle();

  let memberId: string | null = null;
  if (user?.id) {
    const { data: existingMember } = await db
      .from('community_members')
      .select('id')
      .eq('tenant_id', order.tenant_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (existingMember?.id) memberId = existingMember.id;
    else {
      const { data: createdMember } = await db.from('community_members').insert({
        tenant_id: order.tenant_id,
        user_id: user.id,
        role: 'member',
        status: 'active',
      }).select('id').maybeSingle();
      memberId = createdMember?.id ?? null;
    }
  }

  const accessRow = {
    tenant_id: order.tenant_id,
    member_id: memberId,
    user_id: user?.id ?? null,
    plan_id: communityPlanId,
    status: 'active',
    stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
    metadata: {
      checkout_session_id: session.id,
      customer_email: session.customer_details.email,
    },
    updated_at: new Date().toISOString(),
  };

  if (user?.id) {
    const { data: existingAccess } = await db
      .from('community_member_access')
      .select('id')
      .eq('tenant_id', order.tenant_id)
      .eq('user_id', user.id)
      .eq('plan_id', communityPlanId)
      .maybeSingle();
    if (existingAccess?.id) {
      await db.from('community_member_access').update(accessRow).eq('id', existingAccess.id);
    } else {
      await db.from('community_member_access').insert(accessRow);
    }
  }
}

export async function POST(request: NextRequest) {
  await hydrateProcessEnv().catch(() => undefined);
  const stripe = getStripe();
  const secret = connectWebhookSecret();
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Connect webhook is not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  const accountId = typeof event.account === 'string' ? event.account : null;
  try {
    switch (event.type) {
      case 'account.updated':
        await syncConnectedAccount(event.data.object as Stripe.Account);
        break;
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.expired':
        await syncCheckout(event.data.object as Stripe.Checkout.Session, accountId);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error('[tenant-commerce-webhook] processing failed', { eventId: event.id, type: event.type, error });
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
