import { retiredStripeCheckout } from '@/lib/billing/retired-stripe-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredStripeCheckout({
    destination: '/programs',
    reason: 'External course purchases require the canonical enrollment flow.',
  });
}
