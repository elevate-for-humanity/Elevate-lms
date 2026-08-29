import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { ensureCanonicalStripePrice } from '@/lib/stripe/resolve-canonical-price';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getImplementationPackage } from '@/lib/store/implementation-packages';

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
    return NextResponse.json({ checkoutUrl: session.url });
  } catch {
    return NextResponse.json(
      { error: 'Unable to start secure checkout. Please try again.' },
      { status: 500 },
    );
  }
}
