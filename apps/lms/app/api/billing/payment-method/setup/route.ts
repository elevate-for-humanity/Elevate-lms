import { retiredStripeCheckout } from '@/lib/billing/retired-stripe-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredStripeCheckout({
    destination: '/lms/documents',
    reason:
      'QuickBooks invoices accept card or ACH; students must upload the new recurring-payment authorization.',
  });
}
