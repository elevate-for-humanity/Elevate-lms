import { retiredLegacyCheckout } from '@/lib/billing/retired-legacy-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredLegacyCheckout({
    destination: '/store/cart',
    reason: 'Use the canonical QuickBooks store cart checkout.',
  });
}
