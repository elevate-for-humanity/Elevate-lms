import { retiredStripeCheckout } from '@/lib/billing/retired-stripe-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredStripeCheckout({
    destination: '/lms/documents',
    reason:
      'Stripe payment-method setup is retired. Apprentice subscriptions use PayPal automatic billing and QuickBooks accounting.',
  });
}
