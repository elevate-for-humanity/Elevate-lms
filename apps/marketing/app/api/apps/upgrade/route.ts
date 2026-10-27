import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { getIndividualAppCatalog } from '@/lib/apps/individual-app-plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !user.email) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const appSlug = typeof body.appSlug === 'string' ? body.appSlug : '';
  const planId = typeof body.plan === 'string' ? body.plan : '';
  const catalog = getIndividualAppCatalog(appSlug);
  const plan = catalog?.plans.find((item) => item.id === planId);
  if (!catalog || !plan) return NextResponse.json({ error: 'Invalid app or plan' }, { status: 400 });

  const db = await requireAdminClient();
  const invoice = await createQuickBooksBillingProvider(db).createManualInvoice({
    idempotencyKey: `individual-app:${user.id}:${catalog.slug}:${plan.id}:${new Date().toISOString().slice(0, 7)}`,
    customer: {
      externalKey: `user:${user.id}`,
      displayName: String(user.user_metadata?.full_name || user.email),
      email: user.email,
    },
    lines: [{
      canonicalKey: `individual-app-${catalog.slug}-${plan.id}`,
      name: `${catalog.displayName} — ${plan.name} monthly subscription`,
      description: catalog.tagline,
      quantity: 1,
      unitAmountCents: Math.round(plan.priceMonthly * 100),
    }],
    dueDate: new Date().toISOString().slice(0, 10),
    memo: `Elevate ${catalog.displayName} subscription`,
    fulfillment: {
      type: 'individual_app_subscription',
      payload: {
        user_id: user.id,
        app_slug: catalog.slug,
        plan_id: plan.id,
        amount_cents: Math.round(plan.priceMonthly * 100),
      },
    },
  });

  const schedule = await db.from('billing_schedules').upsert({
    customer_external_key: `user:${user.id}`,
    customer_name: String(user.user_metadata?.full_name || user.email),
    customer_email: user.email,
    canonical_product_key: `individual-app-${catalog.slug}`,
    product_name: `${catalog.displayName} — ${plan.name}`,
    product_description: catalog.tagline,
    provider: 'quickbooks',
    amount_cents: Math.round(plan.priceMonthly * 100),
    cadence: 'monthly',
    next_invoice_date: new Date(new Date().setUTCMonth(new Date().getUTCMonth() + 1)).toISOString().slice(0, 10),
    status: 'active',
    fulfillment_type: 'individual_app_subscription',
    fulfillment_payload: { user_id: user.id, app_slug: catalog.slug, plan_id: plan.id, amount_cents: Math.round(plan.priceMonthly * 100) },
  }, { onConflict: 'provider,customer_external_key,canonical_product_key' });
  if (schedule.error) throw new Error(schedule.error.message);

  if (!invoice.paymentUrl) return NextResponse.json({ error: 'QuickBooks created the invoice but no Pay Now link was returned.', invoiceId: invoice.providerInvoiceId }, { status: 503 });
  return NextResponse.json({ checkoutUrl: invoice.paymentUrl, invoiceId: invoice.providerInvoiceId });
}
