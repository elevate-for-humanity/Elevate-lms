import { retiredStripeCheckout } from '@/lib/billing/retired-stripe-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredStripeCheckout({
    destination: '/contact?topic=meri-gold-round',
    reason: 'This event purchase needs a QuickBooks invoice from Elevate.',
  });
}
