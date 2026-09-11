import { NextRequest, NextResponse } from 'next/server';
import { getImplementationPackage } from '@/lib/store/implementation-packages';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PaymentChoice = 'deposit' | 'full';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const packageId = typeof body.packageId === 'string' ? body.packageId : '';
  const paymentChoice: PaymentChoice = body.paymentChoice === 'full' ? 'full' : 'deposit';
  const selectedPackage = getImplementationPackage(packageId);
  if (!selectedPackage) {
    return NextResponse.json({ error: 'Invalid standalone platform package.' }, { status: 400 });
  }
  const buyerName = typeof body.buyerName === 'string' ? body.buyerName.trim() : '';
  const buyerEmail =
    typeof body.buyerEmail === 'string' ? body.buyerEmail.trim().toLowerCase() : '';
  const checkoutAttemptId =
    typeof body.checkoutAttemptId === 'string' && /^[0-9a-f-]{36}$/i.test(body.checkoutAttemptId)
      ? body.checkoutAttemptId
      : null;
  if (!buyerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail))
    return NextResponse.json(
      { error: 'Name and a valid invoice email are required.' },
      { status: 400 },
    );
  if (!checkoutAttemptId)
    return NextResponse.json(
      { error: 'A valid checkout attempt ID is required.' },
      { status: 400 },
    );

  const amountCents =
    paymentChoice === 'full' ? selectedPackage.totalCents : selectedPackage.depositCents;
  let db;
  try {
    db = await requireAdminClient();
  } catch {
    return NextResponse.json(
      { error: 'Order service is temporarily unavailable.' },
      { status: 503 },
    );
  }

  const priorOrder = await db
    .from('implementation_orders')
    .select('id,package_id,payment_choice,customer_email')
    .eq('checkout_attempt_id', checkoutAttemptId)
    .maybeSingle();
  if (priorOrder.error)
    return NextResponse.json({ error: 'Unable to verify this checkout attempt.' }, { status: 500 });
  if (
    priorOrder.data &&
    (priorOrder.data.package_id !== selectedPackage.id ||
      priorOrder.data.payment_choice !== paymentChoice ||
      (priorOrder.data.customer_email && priorOrder.data.customer_email !== buyerEmail))
  )
    return NextResponse.json(
      { error: 'This checkout attempt belongs to a different purchase.' },
      { status: 409 },
    );
  const orderResult = priorOrder.data
    ? { data: { id: priorOrder.data.id }, error: null }
    : await db
        .from('implementation_orders')
        .insert({
          package_id: selectedPackage.id,
          package_name: selectedPackage.name,
          payment_choice: paymentChoice,
          status: 'pending',
          package_total_cents: selectedPackage.totalCents,
          checkout_amount_cents: amountCents,
          amount_paid_cents: 0,
          balance_due_cents: selectedPackage.totalCents,
          installment_count: paymentChoice === 'deposit' ? selectedPackage.installmentCount : 0,
          installment_amount_cents:
            paymentChoice === 'deposit' ? selectedPackage.installmentCents : 0,
          installments_paid: 0,
          metadata: { source: 'elevate_store', delivery_window: selectedPackage.deliveryWindow },
          checkout_attempt_id: checkoutAttemptId,
        })
        .select('id')
        .single();
  const { data: pendingOrder, error: pendingOrderError } = orderResult;
  if (priorOrder.data)
    await db
      .from('implementation_orders')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', priorOrder.data.id)
      .eq('status', 'payment_failed');
  if (pendingOrderError || !pendingOrder?.id) {
    logger.error(
      '[implementation/checkout] pending order insert failed',
      pendingOrderError ?? undefined,
      { packageId: selectedPackage.id, paymentChoice },
    );
    return NextResponse.json({ error: 'Unable to prepare your order.' }, { status: 500 });
  }

  try {
    const invoice = await createQuickBooksBillingProvider(db).createManualInvoice({
      idempotencyKey: `implementation:${pendingOrder.id}:${paymentChoice}`,
      customer: {
        externalKey: `implementation:${buyerEmail}`,
        displayName: buyerName,
        email: buyerEmail,
      },
      lines: [
        {
          canonicalKey: `implementation-${selectedPackage.id}-${paymentChoice}`,
          name: `${selectedPackage.name} — ${paymentChoice === 'full' ? 'Full Payment' : 'Deposit'}`,
          quantity: 1,
          unitAmountCents: amountCents,
        },
      ],
      dueDate: new Date().toISOString().slice(0, 10),
      memo: `Implementation order ${pendingOrder.id}`,
      fulfillment: {
        type: 'implementation_package',
        payload: {
          implementation_order_id: pendingOrder.id,
          payment_choice: paymentChoice,
          package_total_cents: selectedPackage.totalCents,
          amount_cents: amountCents,
          buyer_name: buyerName,
          buyer_email: buyerEmail,
        },
      },
    });
    if (!invoice.paymentUrl)
      throw new Error('QuickBooks created the invoice but online payment links are not enabled.');
    const { error: sessionLinkError } = await db
      .from('implementation_orders')
      .update({
        billing_provider: 'quickbooks',
        provider_invoice_id: invoice.providerInvoiceId,
        customer_name: buyerName,
        customer_email: buyerEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingOrder.id)
      .eq('status', 'pending');
    if (sessionLinkError) {
      logger.warn(
        '[implementation/checkout] QuickBooks invoice link will be reconciled by webhook',
        {
          orderId: pendingOrder.id,
          providerInvoiceId: invoice.providerInvoiceId,
          error: sessionLinkError.message,
        },
      );
    }
    if (paymentChoice === 'deposit') {
      const next = new Date();
      next.setUTCMonth(next.getUTCMonth() + 1);
      const schedule = await db.from('billing_schedules').upsert(
        {
          customer_external_key: `implementation:${buyerEmail}`,
          customer_name: buyerName,
          customer_email: buyerEmail,
          canonical_product_key: `implementation-balance-${pendingOrder.id}`,
          product_name: `${selectedPackage.name} installment`,
          provider: 'quickbooks',
          amount_cents: selectedPackage.installmentCents,
          cadence: 'monthly',
          next_invoice_date: next.toISOString().slice(0, 10),
          remaining_invoices: selectedPackage.installmentCount,
          status: 'active',
        },
        { onConflict: 'provider,customer_external_key,canonical_product_key' },
      );
      if (schedule.error)
        throw new Error(
          `Invoice created but installment schedule failed: ${schedule.error.message}`,
        );
    }
    return NextResponse.json({
      checkoutUrl: invoice.paymentUrl,
      invoiceId: invoice.providerInvoiceId,
    });
  } catch (error) {
    await db
      .from('implementation_orders')
      .update({ status: 'payment_failed', updated_at: new Date().toISOString() })
      .eq('id', pendingOrder.id)
      .eq('status', 'pending');
    logger.error('[implementation/checkout] QuickBooks invoice creation failed', error, {
      orderId: pendingOrder.id,
    });
    return NextResponse.json(
      { error: 'Unable to start secure checkout. Please try again.' },
      { status: 500 },
    );
  }
}
