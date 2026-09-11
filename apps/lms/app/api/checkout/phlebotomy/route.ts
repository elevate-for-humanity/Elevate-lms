import { retiredStripeCheckout } from '@/lib/billing/retired-stripe-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredStripeCheckout({
    destination: '/programs/phlebotomy',
    reason: 'Use the canonical QuickBooks program enrollment checkout.',
  });
}
