// PUBLIC ROUTE: deprecated tombstone — always returns 410, no data access
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEPRECATED — superseded by /api/affirm/checkout + /api/affirm/capture.
 *
 * This route used process.env.AFFIRM_PRIVATE_API_KEY directly (empty on
 * key is in app_secrets), called the non-existent /api/v2/charges
 * endpoint (correct path is /api/v1/transactions), and wrote to the
 * non-existent `enrollments` table.
 *
 * Redirect any callers to the canonical flow.
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;
  return NextResponse.json(
    {
      error:
        'This endpoint is deprecated. Use /api/affirm/checkout to initiate Affirm checkout.',
      redirect: '/api/affirm/checkout',
    },
    { status: 410 },
  );
}
