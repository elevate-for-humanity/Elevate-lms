import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createDeprecatedCheckoutHandler } from '@/lib/checkout/deprecated';
import { apiAuthGuard } from '@/lib/authGuards';

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
