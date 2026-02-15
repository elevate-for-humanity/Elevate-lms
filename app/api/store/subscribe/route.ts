import { createDeprecatedCheckoutHandler } from '@/lib/checkout/deprecated';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEPRECATED: Use /api/license/checkout for org licensing
 */
export const POST = createDeprecatedCheckoutHandler(
  '/api/store/subscribe',
  'license',
  { planId: 'professional' }
);
