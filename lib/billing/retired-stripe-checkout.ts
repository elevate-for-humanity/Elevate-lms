import { NextResponse } from 'next/server';

type Replacement = {
  destination: string;
  reason: string;
};

/**
 * Permanent fail-closed response for URLs that previously created Stripe charges.
 * Historical Stripe reads and signed webhook reconciliation remain separate.
 */
export function retiredStripeCheckout({ destination, reason }: Replacement) {
  return NextResponse.json(
    {
      error: 'This legacy Stripe checkout has been retired.',
      code: 'STRIPE_CHECKOUT_RETIRED',
      billingProvider: 'quickbooks',
      destination,
      reason,
    },
    {
      status: 410,
      headers: {
        'Cache-Control': 'no-store',
        'X-Elevate-Billing-Provider': 'quickbooks',
      },
    },
  );
}
