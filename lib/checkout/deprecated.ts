import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * CHECKOUT CONSOLIDATION
 * 
 * Canonical endpoints:
 * - /api/checkout/learner - All individual learner payments
 * - /api/license/checkout - All organization licensing
 * 
 * All other checkout handlers are deprecated and should forward here.
 */

export const CANONICAL_LEARNER_CHECKOUT = '/api/checkout/learner';
export const CANONICAL_LICENSE_CHECKOUT = '/api/license/checkout';

/**
 * Create a deprecation response that logs and forwards
 */
export function createDeprecatedCheckoutHandler(
  deprecatedPath: string,
  forwardTo: 'learner' | 'license',
  defaultBody: Record<string, unknown>
) {
  return async function handler(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const canonicalPath = forwardTo === 'learner' 
      ? CANONICAL_LEARNER_CHECKOUT 
      : CANONICAL_LICENSE_CHECKOUT;

    logger.warn('Deprecated checkout endpoint called', { 
      deprecatedPath,
      canonicalPath,
    });

    try {
      // Get original body if present
      let body = defaultBody;
      try {
        const originalBody = await request.json();
        body = { ...defaultBody, ...originalBody };
      } catch {
        // No body or invalid JSON, use defaults
      }

      const response = await fetch(new URL(canonicalPath, request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      logger.error('Deprecated checkout forward failed', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Checkout temporarily unavailable', redirect: canonicalPath },
        { status: 503 }
      );
    }
  };
}
