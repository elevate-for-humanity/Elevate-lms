import { createDeprecatedCheckoutHandler } from '@/lib/checkout/deprecated';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEPRECATED: Use /api/checkout/learner with type: 'program'
 */
const _POST = createDeprecatedCheckoutHandler(
  '/api/programs/checkout',
  'learner',
  { type: 'program' }
);
export const POST = withApiAudit('/api/programs/checkout', _POST);
