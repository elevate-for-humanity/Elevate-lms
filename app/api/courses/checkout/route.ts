import { createDeprecatedCheckoutHandler } from '@/lib/checkout/deprecated';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEPRECATED: Use /api/checkout/learner with type: 'course'
 */
export const POST = createDeprecatedCheckoutHandler(
  '/api/courses/checkout',
  'learner',
  { type: 'course' }
);
