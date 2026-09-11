import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function nextPeriod(interval: BillingInterval): string {
  const now = new Date();
  if (interval === 'annual') now.setUTCFullYear(now.getUTCFullYear() + 1);
  else now.setUTCMonth(now.getUTCMonth() + 1);
  return now.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;
  if (authError || !user?.id || !user.email)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const planId = typeof body.planId === 'string' ? body.planId : '';
  const interval: BillingInterval = body.interval === 'annual' ? 'annual' : 'monthly';
  const addonSlugs = [
    ...new Set(
      (Array.isArray(body.addonSlugs) ? body.addonSlugs : []).filter(
        (value: unknown): value is string => typeof value === 'string',
      ),
    ),
  ];
  const plan = getBasePlan(planId);
  if (!plan) return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
  const addons = addonSlugs.map(getAddOn);
  if (addons.some((addon) => !addon || addon.hiddenFromMarketplace))
    return NextResponse.json({ error: 'One or more add-ons are unavailable' }, { status: 400 });
  const redundant = addons.filter(
    (addon) =>
      addon &&
      addon.features.length &&
      addon.features.every((feature) => plan.features.includes(feature)),
  );
  if (redundant.length)
    return NextResponse.json(
      {
        error: `The selected ${redundant.map((addon) => addon?.name).join(', ')} add-on is already included in ${plan.name}.`,
      },
      { status: 400 },
    );

  const admin = await requireAdminClient();
  const tenantId = await resolveTenantIdForUser(user.id);
  if (!tenantId)
    return NextResponse.json(
      { error: 'Set up the organization workspace before purchasing a subscription.' },
      { status: 409 },
    );
  const billingOrganizationId = await resolveBillingOrganizationId(tenantId, admin);
  if (!billingOrganizationId)
    return NextResponse.json(
      { error: 'Complete organization billing setup before payment.' },
      { status: 409 },
    );

  const { data: existing } = await admin
    .from('organization_subscriptions')
    .select(
      'status,stripe_subscription_id,billing_provider,provider_subscription_id,current_period_end',
    )
    .eq('organization_id', billingOrganizationId)
    .maybeSingle();
  if (
    existing?.stripe_subscription_id &&
    ['active', 'trialing'].includes(existing.status || '') &&
    existing.billing_provider !== 'quickbooks'
  ) {
    return NextResponse.json(
      {
        error:
          'This organization still has an active Stripe subscription. Its QuickBooks schedule was not started, preventing duplicate billing.',
        cutoverRequired: true,
        currentPeriodEnd: existing.current_period_end,
      },
      { status: 409 },
    );
  }

  const baseAmount = priceCents(plan, interval);
  const addonLines = addons.filter(Boolean).map((addon) => ({
    canonicalKey: `platform-addon-${normalizeAddonCode(addon!.slug)}-${interval}`,
    name: `${addon!.name} — ${interval}`,
    description: addon!.description,
    quantity: 1,
    unitAmountCents: interval === 'annual' ? addonPriceCents(addon!) * 12 : addonPriceCents(addon!),
  }));
  const totalCents = baseAmount + addonLines.reduce((sum, line) => sum + line.unitAmountCents, 0);
  const invoiceKey = `platform:${billingOrganizationId}:${plan.id}:${interval}:${new Date().toISOString().slice(0, 7)}`;
  const invoice = await createQuickBooksBillingProvider(admin).createManualInvoice({
    idempotencyKey: invoiceKey,
    customer: {
      externalKey: `organization:${billingOrganizationId}`,
      displayName: String(user.user_metadata?.full_name || user.email),
      email: user.email,
    },
    lines: [
      {
        canonicalKey: `platform-plan-${plan.id}-${interval}`,
        name: `${plan.name} platform subscription — ${interval}`,
        quantity: 1,
        unitAmountCents: baseAmount,
      },
      ...addonLines,
    ],
    dueDate: new Date().toISOString().slice(0, 10),
    memo: `Elevate platform subscription for organization ${billingOrganizationId}`,
    fulfillment: {
      type: 'platform_subscription',
      payload: {
        organization_id: billingOrganizationId,
        tenant_id: tenantId,
        plan_id: plan.id,
        billing_interval: interval,
        addon_codes: addonSlugs.map(normalizeAddonCode),
        amount_cents: totalCents,
      },
    },
  });

  const schedule = await admin.from('billing_schedules').upsert(
    {
      customer_external_key: `organization:${billingOrganizationId}`,
      customer_name: String(user.user_metadata?.full_name || user.email),
      customer_email: user.email,
      canonical_product_key: 'platform-subscription',
      product_name: `${plan.name} platform subscription`,
      product_description: `Includes selected add-ons: ${addonSlugs.join(', ') || 'none'}`,
      provider: 'quickbooks',
      amount_cents: totalCents,
      cadence: interval === 'annual' ? 'annual' : 'monthly',
      next_invoice_date: nextPeriod(interval),
      status: 'active',
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
    checkoutUrl: invoice.paymentUrl,
    invoiceId: invoice.providerInvoiceId,
  });
}
