import { createDeprecatedCheckoutHandler } from '@/lib/checkout/deprecated';
import { requireAuth } from '@/lib/api/requireAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEPRECATED: Use /api/checkout/learner with type: 'program'
 */
export const POST = createDeprecatedCheckoutHandler(
  '/api/programs/checkout',
  'learner',
  { type: 'program' }
);
