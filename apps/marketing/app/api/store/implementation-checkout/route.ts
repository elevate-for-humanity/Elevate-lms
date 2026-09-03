import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { ensureCanonicalStripePrice } from '@/lib/stripe/resolve-canonical-price';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getImplementationPackage } from '@/lib/store/implementation-packages';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PaymentChoice = 'deposit' | 'full';

function checkoutOrigin(request: NextRequest): string {
  const configured = process.env.STORE_URL?.trim() || process.env.NEXT_PUBLIC_STORE_URL?.trim();
  if (!configured) return request.nextUrl.origin;
  try {
    const url = new URL(configured);
    if (url.hostname.toLowerCase() === request.nextUrl.hostname.toLowerCase()) return url.origin;
  } catch {
    // Stay on the request origin when the configured URL is invalid.
  }
  return request.nextUrl.origin;
}

function integrationIdentifier(): string {
  return `elevate_impl_${randomBytes(4).toString('hex')}`;
}

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();

  const body = await request.json().catch(() => ({}));
  const packageId = typeof body.packageId === 'string' ? body.packageId : '';
  const paymentChoice: PaymentChoice = body.paymentChoice === 'full' ? 'full' : 'deposit';
  const selectedPackage = getImplementationPackage(packageId);
  if (!selectedPackage) {
    return NextResponse.json({ error: 'Invalid standalone platform package.' }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment system is temporarily unavailable.' },
      { status: 503 },
    );
  }

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

  const { data: pendingOrder, error: pendingOrderError } = await db
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
      installment_amount_cents: paymentChoice === 'deposit' ? selectedPackage.installmentCents : 0,
      installments_paid: 0,
      metadata: { source: 'elevate_store', delivery_window: selectedPackage.deliveryWindow },
    })
    .select('id')
    .single();
  if (pendingOrderError || !pendingOrder?.id) {
    logger.error(
      '[implementation/checkout] pending order insert failed',
      pendingOrderError ?? undefined,
      { packageId: selectedPackage.id, paymentChoice },
    );
    return NextResponse.json({ error: 'Unable to prepare your order.' }, { status: 500 });
  }

  const origin = checkoutOrigin(request);
  const metadata = {
    kind: 'implementation_package',
    checkout_type: 'standalone_platform_build',
    implementation_package_id: selectedPackage.id,
    implementation_package_name: selectedPackage.name,
    payment_choice: paymentChoice,
    package_total_cents: String(selectedPackage.totalCents),
    deposit_cents: String(selectedPackage.depositCents),
    installment_count: String(selectedPackage.installmentCount),
    installment_cents: String(selectedPackage.installmentCents),
    implementation_order_id: pendingOrder.id,
  };

  let price: Stripe.Price;
  try {
    price = await ensureCanonicalStripePrice(stripe, {
      lookupKey: `implementation_${selectedPackage.id.replace(/-/g, '_')}_${paymentChoice}_usd`,
      unitAmount: amountCents,
      productName: `${selectedPackage.name} — ${paymentChoice === 'full' ? 'Full Payment' : 'Deposit'}`,
      nickname: `${selectedPackage.name} ${paymentChoice}`,
      productMetadata: {
        type: 'implementation_package',
        implementation_package_id: selectedPackage.id,
      },
      priceMetadata: {
        checkout_type: 'standalone_platform_build',
        implementation_package_id: selectedPackage.id,
        payment_choice: paymentChoice,
      },
    });
  } catch {
    await db
      .from('implementation_orders')
      .delete()
      .eq('id', pendingOrder.id)
      .eq('status', 'pending');
    return NextResponse.json(
      { error: 'The selected package checkout is temporarily unavailable.' },
      { status: 503 },
    );
  }

  const params: Stripe.Checkout.SessionCreateParams & { integration_identifier?: string } = {
    mode: 'payment',
    line_items: [{ price: price.id, quantity: 1 }],
    customer_creation: 'always',
    billing_address_collection: 'required',
    allow_promotion_codes: false,
    metadata,
    payment_intent_data: { metadata },
    custom_text: {
      submit: {
        message:
          paymentChoice === 'deposit'
            ? `The remaining balance will be manually invoiced as ${selectedPackage.installmentCount} monthly payments of $${(selectedPackage.installmentCents / 100).toLocaleString('en-US')}.`
            : 'This payment covers the selected package total. Third-party usage and services outside the written scope remain separate.',
      },
    },
    success_url: `${origin}/store/implementation-packages/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/store/implementation-packages?checkout=cancelled`,
    integration_identifier: integrationIdentifier(),
  };

  try {
    const session = await stripe.checkout.sessions.create(params);
    if (!session.url) throw new Error('Stripe did not return a checkout URL.');
    const { error: sessionLinkError } = await db
      .from('implementation_orders')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', pendingOrder.id)
      .eq('status', 'pending');
    if (sessionLinkError) {
      logger.warn('[implementation/checkout] Stripe session link will be reconciled by webhook', {
        orderId: pendingOrder.id,
        stripeSessionId: session.id,
        error: sessionLinkError.message,
      });
    }
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    await db
      .from('implementation_orders')
      .delete()
      .eq('id', pendingOrder.id)
      .eq('status', 'pending');
    logger.error('[implementation/checkout] Stripe session creation failed', error, {
      orderId: pendingOrder.id,
    });
    return NextResponse.json(
      { error: 'Unable to start secure checkout. Please try again.' },
      { status: 500 },
    );
  }
}
