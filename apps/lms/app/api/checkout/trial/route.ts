import { retiredLegacyCheckout } from '@/lib/billing/retired-legacy-checkout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return retiredLegacyCheckout({
    destination: '/store/plans',
    reason: 'legacy provider trials are retired; use the current plan onboarding flow.',
  });
}
