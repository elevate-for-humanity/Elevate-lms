import { retiredLegacyCheckout } from '@/lib/billing/retired-legacy-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredLegacyCheckout({
    destination: '/programs',
    reason: 'Partner course payment requires the canonical enrollment flow.',
  });
}
