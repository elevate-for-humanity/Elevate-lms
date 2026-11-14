import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  customerName: z.string().trim().min(1).max(160),
  checkoutAttemptId: z.string().uuid(),
});

function cadence(interval: string | null): 'weekly' | 'monthly' | 'annual' {
  if (interval === 'week') return 'weekly';
  if (interval === 'year') return 'annual';
  return 'monthly';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Name, invoice email, and checkout attempt ID are required.' },
      { status: 400 },
    );
  const { offerId } = await params;
  const db = await requireAdminClient();
  const { data: offer, error } = await db
    .from('tenant_offers')
    .select('*')
    .eq('id', offerId)
    .eq('active', true)
    .maybeSingle();
  if (error || !offer) return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });
  if (String(offer.currency || 'usd').toLowerCase() !== 'usd')
    return NextResponse.json(
      { error: 'QuickBooks checkout currently supports USD offers.' },
      { status: 409 },
    );
  const { data: existing } = await db
    .from('tenant_orders')
    .select('id,offer_id')
    .eq('checkout_attempt_id', parsed.data.checkoutAttemptId)
    .maybeSingle();
  if (existing && existing.offer_id !== offer.id)
    return NextResponse.json(
      { error: 'This checkout attempt belongs to another offer.' },
      { status: 409 },
    );
  const orderId = existing?.id || crypto.randomUUID();
  if (!existing) {
    const inserted = await db.from('tenant_orders').insert({
      id: orderId,
      tenant_id: offer.tenant_id,
      offer_id: offer.id,
      customer_email: parsed.data.email,
      amount_total: offer.amount_cents,
      currency: 'usd',
      status: 'pending',
      billing_provider: 'quickbooks',
      checkout_attempt_id: parsed.data.checkoutAttemptId,
      metadata: {
        pricing_type: offer.pricing_type,
        billing_interval: offer.billing_interval,
        merchant_of_record: 'elevate',
      },
    });
    if (inserted.error)
      return NextResponse.json({ error: 'Unable to prepare this order.' }, { status: 500 });
  }
  const fulfillment = {
    type: 'tenant_offer',
    payload: {
      tenant_order_id: orderId,
      tenant_id: offer.tenant_id,
      offer_id: offer.id,
      provider_id: offer.tenant_id,
      customer_email: parsed.data.email,
      amount_cents: offer.amount_cents,
      platform_fee_bps: offer.platform_fee_bps || 0,
    },
  };
  try {
    const invoice = await createQuickBooksBillingProvider(db).createManualInvoice({
      idempotencyKey: `tenant-offer:${orderId}`,
      customer: {
        externalKey: `tenant-offer-buyer:${parsed.data.email}`,
        displayName: parsed.data.customerName,
        email: parsed.data.email,
      },
      lines: [
        {
          canonicalKey: `tenant-offer-${offer.id}`,
          name: offer.name,
          description: offer.description || undefined,
          quantity: 1,
          unitAmountCents: offer.amount_cents,
        },
      ],
      dueDate: new Date().toISOString().slice(0, 10),
      memo: `Elevate marketplace order ${orderId}`,
      fulfillment,
    });
    if (!invoice.paymentUrl) throw new Error('QuickBooks online payment link is unavailable.');
    await db
      .from('tenant_orders')
      .update({
        provider_invoice_id: invoice.providerInvoiceId,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    if (offer.pricing_type === 'subscription') {
      const next = new Date();
      if (offer.billing_interval === 'week') next.setUTCDate(next.getUTCDate() + 7);
      else if (offer.billing_interval === 'year') next.setUTCFullYear(next.getUTCFullYear() + 1);
      else next.setUTCMonth(next.getUTCMonth() + 1);
      const scheduled = await db.from('billing_schedules').upsert(
        {
          customer_external_key: `tenant-offer-buyer:${parsed.data.email}`,
          customer_name: parsed.data.customerName,
          customer_email: parsed.data.email,
          canonical_product_key: `tenant-offer-${offer.id}`,
          product_name: offer.name,
          product_description: offer.description,
          provider: 'quickbooks',
          amount_cents: offer.amount_cents,
          cadence: cadence(offer.billing_interval),
          next_invoice_date: next.toISOString().slice(0, 10),
          status: 'active',
          fulfillment_type: fulfillment.type,
          fulfillment_payload: fulfillment.payload,
        },
        { onConflict: 'provider,customer_external_key,canonical_product_key' },
      );
      if (scheduled.error)
        throw new Error(
          `Invoice created but subscription schedule failed: ${scheduled.error.message}`,
        );
    }
    return NextResponse.json({
      checkoutUrl: invoice.paymentUrl,
      invoiceId: invoice.providerInvoiceId,
      orderId,
    });
  } catch (cause) {
    await db
      .from('tenant_orders')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'pending');
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : 'Could not create checkout.' },
      { status: 502 },
    );
  }
}
