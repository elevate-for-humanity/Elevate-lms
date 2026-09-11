import { retiredStripeCheckout } from '@/lib/billing/retired-stripe-checkout';

export async function POST() {
  return retiredStripeCheckout({
    destination: '/lms/documents',
    reason: 'Unverified legacy payment-split writes are retired; paid QuickBooks invoices drive fulfillment.',
  });
}
