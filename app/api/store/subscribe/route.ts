import { createDeprecatedCheckoutHandler } from '@/lib/checkout/deprecated';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEPRECATED: Use /api/license/checkout for org licensing
 */
const _POST = createDeprecatedCheckoutHandler(
  '/api/store/subscribe',
  'license',
  { planId: 'professional' }
);
export const POST = withApiAudit('/api/store/subscribe', _POST);
