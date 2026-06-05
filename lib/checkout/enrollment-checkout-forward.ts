/**
 * Forward deprecated enrollment checkout routes to canonical endpoints.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const CANONICAL_PROGRAM_CHECKOUT = '/api/programs/enroll/checkout';
export const CANONICAL_GUEST_CHECKOUT = '/api/enroll/checkout';

export async function forwardEnrollmentCheckout(
  request: NextRequest,
  deprecatedPath: string,
  target: 'program' | 'guest' = 'program',
): Promise<NextResponse> {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  const canonicalPath =
    target === 'guest' ? CANONICAL_GUEST_CHECKOUT : CANONICAL_PROGRAM_CHECKOUT;
  logger.warn(`[${deprecatedPath}] Deprecated checkout — forwarding to ${canonicalPath}`);

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const normalized =
    target === 'program'
      ? {
          program_id: body.program_id ?? body.programId,
          funding_source: body.funding_source ?? body.fundingSource ?? 'self_pay',
        }
      : body;

  try {
    const res = await fetch(new URL(canonicalPath, request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(normalized),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    logger.error(`[${deprecatedPath}] Forward failed`, err as Error);
    return NextResponse.json(
      { error: 'Checkout temporarily unavailable', redirect: canonicalPath },
      { status: 503 },
    );
  }
}
