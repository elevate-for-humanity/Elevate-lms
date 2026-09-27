import { NextResponse } from 'next/server';

type CompatibilityCheckout = {
  destination: string;
  reason: string;
};

/**
 * Compatibility response for legacy checkout URLs.
 * All active billing is Elevate billing: QuickBooks invoices/accounting and
 * PayPal recurring collection.
 */
export function retiredStripeCheckout({ destination, reason }: CompatibilityCheckout) {
  return NextResponse.json(
    {
      code: 'PAYMENT_ROUTE_MOVED',
      billingProvider: 'quickbooks',
      recurringProvider: 'paypal',
      destination,
      reason,
    },
    {
      status: 307,
      headers: {
        'Cache-Control': 'no-store',
        'X-Elevate-Billing-Provider': 'quickbooks',
        Location: destination,
      },
    },
  );
}
