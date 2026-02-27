import { createDeprecatedCheckoutHandler } from '@/lib/checkout/deprecated';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEPRECATED: Use /api/checkout/learner with type: 'course'
 */
const _POST = createDeprecatedCheckoutHandler(
  '/api/courses/checkout',
  'learner',
  { type: 'course' }
);
export const POST = withApiAudit('/api/courses/checkout', _POST);
