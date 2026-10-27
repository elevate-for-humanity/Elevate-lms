import { retiredLegacyCheckout } from '@/lib/billing/retired-legacy-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredLegacyCheckout({
    destination: '/programs',
    reason: 'External course purchases require the canonical enrollment flow.',
  });
}
