import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// No server endpoint may collect or save a card for the retired checkout.
// Invoice payments and recurring authorizations begin on the billing page.
export async function POST() {
  return NextResponse.json(
    { error: 'Use your QuickBooks invoice or authorize the PayPal agreement in your billing dashboard.', url: '/account/payment-methods' },
    { status: 410 },
  );
}
