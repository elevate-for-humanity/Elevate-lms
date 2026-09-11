import { retiredStripeCheckout } from '@/lib/billing/retired-stripe-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredStripeCheckout({
    destination: '/contact?topic=domain-purchase',
    reason:
      'Automatic domain purchasing is paused until paid-invoice fulfillment is registrar-safe.',
  });
}
