import { retiredLegacyCheckout } from '@/lib/billing/retired-legacy-checkout';
import { apiAuthGuard } from '@/lib/admin/guards';

export async function POST(request: Request) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  return retiredLegacyCheckout({
    destination: '/lms/documents',
    reason: 'Legacy payment-split writes are retired; PayPal automatic payments are recorded in QuickBooks.',
  });
}
