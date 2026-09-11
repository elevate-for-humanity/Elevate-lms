import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'payment');
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  const recurring = Boolean(body.recurring);
  const name = String(body.donor_name || '').trim();
  const email = String(body.donor_email || '')
    .trim()
    .toLowerCase();
  const attempt = String(body.checkoutAttemptId || '');
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000)
    return NextResponse.json({ error: 'Invalid donation amount.' }, { status: 400 });
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !attempt.match(/^[0-9a-f-]{36}$/i))
    return NextResponse.json(
      { error: 'Name, invoice email, and checkout attempt ID are required.' },
      { status: 400 },
    );
  const cents = Math.round(amount * 100);
  const db = await requireAdminClient();
  const fulfillment = {
    type: 'donation_receipt',
    payload: {
      donor_name: name,
      donor_email: email,
      amount_cents: cents,
      recurring,
      dedication: body.dedication,
      in_honor_of: body.in_honor_of,
    },
  };
  try {
    const invoice = await createQuickBooksBillingProvider(db).createManualInvoice({
      idempotencyKey: `donation:${attempt}`,
      customer: { externalKey: `donor:${email}`, displayName: name, email },
      lines: [
        {
          canonicalKey: recurring ? 'monthly-donation' : 'one-time-donation',
          name: recurring ? 'Monthly Donation' : 'Donation',
          quantity: 1,
          unitAmountCents: cents,
        },
      ],
      dueDate: new Date().toISOString().slice(0, 10),
      memo: 'Elevate charitable donation',
      fulfillment,
    });
    if (!invoice.paymentUrl) throw new Error('QuickBooks online payment link is unavailable.');
    if (recurring) {
      const next = new Date();
      next.setUTCMonth(next.getUTCMonth() + 1);
      const saved = await db
        .from('billing_schedules')
        .upsert(
          {
            customer_external_key: `donor:${email}`,
            customer_name: name,
            customer_email: email,
            canonical_product_key: `monthly-donation-${cents}`,
            product_name: 'Monthly Donation',
            provider: 'quickbooks',
            amount_cents: cents,
            cadence: 'monthly',
            next_invoice_date: next.toISOString().slice(0, 10),
            status: 'active',
            fulfillment_type: fulfillment.type,
            fulfillment_payload: fulfillment.payload,
          },
          { onConflict: 'provider,customer_external_key,canonical_product_key' },
        );
      if (saved.error) throw new Error(saved.error.message);
    }
    return NextResponse.json({
      url: invoice.paymentUrl,
      checkoutUrl: invoice.paymentUrl,
      invoiceId: invoice.providerInvoiceId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Donation invoice could not be created.' },
      { status: 502 },
    );
  }
}
