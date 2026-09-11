import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  HOST_SHOP_TIER_AMOUNTS,
  HOST_SHOP_TIER_LABELS,
  isHostShopTier,
} from '@/lib/platform/orchestration/host-shop-subscription';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  if (membershipError)
    return NextResponse.json({ error: 'Could not resolve host shop account' }, { status: 500 });

  const activeMemberships = (memberships ?? []).filter(
    (row) => !row.status || row.status === 'active',
  );
  if (activeMemberships.length !== 1) {
    return NextResponse.json(
      {
        error: activeMemberships.length
          ? 'Select exactly one host shop account'
          : 'No active host shop account is linked to this login',
      },
      { status: 409 },
    );
  }

  const partnerId = activeMemberships[0].partner_id as string;
  const { data: partner } = await admin
    .from('partners')
    .select(
      'id,name,dba,shop_name,owner_name,contact_name,contact_email,contact_phone,phone,status,approval_status',
    )
    .eq('id', partnerId)
    .maybeSingle();
  if (!partner)
    return NextResponse.json({ error: 'Host shop partner record not found' }, { status: 404 });
  if (partner.approval_status && partner.approval_status !== 'approved') {
    return NextResponse.json(
      { error: 'Host shop approval is required before subscribing' },
      { status: 403 },
    );
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
      return NextResponse.json(
        { error: 'Could not create host shop billing profile' },
        { status: 500 },
      );
    }
    partnership = created;
  }

  if (
    partnership.stripe_subscription_id &&
    ['active', 'trialing'].includes(partnership.subscription_status || '')
  ) {
    return NextResponse.json(
      {
        error:
          'This host shop still has an active Stripe subscription. QuickBooks billing was not started, preventing a duplicate charge.',
        cutoverRequired: true,
      },
      { status: 409 },
    );
  }

  const customerEmail = partner.contact_email || shop?.email || user.email;
  const customerName = partner.shop_name || partner.dba || partner.name || customerEmail;
  const amountCents = HOST_SHOP_TIER_AMOUNTS[tier];
  const invoice = await createQuickBooksBillingProvider(admin).createManualInvoice({
    idempotencyKey: `host-shop:${partnership.id}:${tier}:${new Date().toISOString().slice(0, 7)}`,
    customer: {
      externalKey: `partner:${partnerId}`,
      displayName: customerName,
      email: customerEmail,
    },
    lines: [
      {
        canonicalKey: `host-shop-${tier}`,
        name: HOST_SHOP_TIER_LABELS[tier],
        quantity: 1,
        unitAmountCents: amountCents,
      },
    ],
    dueDate: new Date().toISOString().slice(0, 10),
    memo: `Host shop partnership ${partnership.id}`,
    fulfillment: {
      type: 'host_shop_subscription',
      payload: {
        partnership_id: partnership.id,
        partner_id: partnerId,
        shop_id: shop?.id || null,
        tier,
        amount_cents: amountCents,
      },
    },
  });
  const next = new Date();
  next.setUTCMonth(next.getUTCMonth() + 1);
  const schedule = await admin
    .from('billing_schedules')
    .upsert(
      {
        customer_external_key: `partner:${partnerId}`,
        customer_name: customerName,
        customer_email: customerEmail,
        canonical_product_key: 'host-shop-subscription',
        product_name: HOST_SHOP_TIER_LABELS[tier],
        provider: 'quickbooks',
        amount_cents: amountCents,
        cadence: 'monthly',
        next_invoice_date: next.toISOString().slice(0, 10),
        status: 'active',
        legacy_stripe_subscription_id: partnership.stripe_subscription_id || null,
      },
      { onConflict: 'provider,customer_external_key,canonical_product_key' },
    );
  if (schedule.error)
    throw new Error(`Invoice created but schedule could not be saved: ${schedule.error.message}`);
  if (!invoice.paymentUrl)
    return NextResponse.json(
      {
        error: 'QuickBooks created the invoice, but no Pay Now link was returned.',
        invoiceId: invoice.providerInvoiceId,
      },
      { status: 503 },
    );
  return NextResponse.json({
    invoiceId: invoice.providerInvoiceId,
    url: invoice.paymentUrl,
    tierLabel: HOST_SHOP_TIER_LABELS[tier],
  });
}
