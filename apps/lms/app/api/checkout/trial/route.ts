import { retiredStripeCheckout } from '@/lib/billing/retired-stripe-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredStripeCheckout({
    destination: '/store/plans',
    reason: 'Stripe trials are retired; use the current plan onboarding flow.',
  });
}
