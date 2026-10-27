import { retiredLegacyCheckout } from '@/lib/billing/retired-legacy-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredLegacyCheckout({
    destination: '/lms/documents',
    reason:
      'legacy provider payment-method setup is retired. Apprentice subscriptions use PayPal automatic billing and QuickBooks accounting.',
  });
}
