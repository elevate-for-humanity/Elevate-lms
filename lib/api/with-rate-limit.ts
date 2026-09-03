import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  authRateLimit,
  paymentRateLimit,
  contactRateLimit,
  apiRateLimit,
  strictRateLimit,
  publicRateLimit,
  pageLoadRateLimit,
  getIdentifier,
  createRateLimitHeaders,
  getRetryAfterSeconds,
  type RateLimiterLike,
} from '@/lib/rate-limit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

type RateLimiterGetter = { get: () => RateLimiterLike | null };
type CanonicalTier = 'strict' | 'contact' | 'api' | 'auth' | 'payment' | 'public' | 'pageLoad';

function canonicalTierFor(limiter: RateLimiterLike | null | RateLimiterGetter): CanonicalTier | null {
  if (limiter === strictRateLimit) return 'strict';
  if (limiter === contactRateLimit) return 'contact';
  if (limiter === apiRateLimit) return 'api';
  if (limiter === authRateLimit) return 'auth';
  if (limiter === paymentRateLimit) return 'payment';
  if (limiter === publicRateLimit) return 'public';
  if (limiter === pageLoadRateLimit) return 'pageLoad';
  return null;
}

/**
 * Compatibility wrapper for older routes.
 * Shared Elevate limiters are delegated to the canonical applyRateLimit()
 * implementation so Redis failures, IP resolution, reset timestamps, and local
 * fallback behavior are identical across both historical import paths.
 */
export function withRateLimit<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    limiter: RateLimiterLike | null | RateLimiterGetter;
    skipOnMissing?: boolean;
  },
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const canonicalTier = canonicalTierFor(options.limiter);

    if (canonicalTier) {
      const rateLimited = await applyRateLimit(request, canonicalTier);
      if (rateLimited) return rateLimited;
      return handler(request, context);
    }

    const { skipOnMissing = true } = options;
    const limiter =
      typeof (options.limiter as any)?.get === 'function'
        ? (options.limiter as RateLimiterGetter).get()
        : (options.limiter as RateLimiterLike | null);

    if (!limiter) {
      if (skipOnMissing) {
        logger.warn('[rate-limit] Custom limiter not configured; request allowed');
        return handler(request, context);
      }
      return NextResponse.json({ error: 'Rate limiting not configured' }, { status: 503 });
    }

    const identifier = getIdentifier(request);

    try {
      const result = await limiter.limit(identifier);
      const headers = createRateLimitHeaders(result);

      if (!result.success) {
        const retryAfter = getRetryAfterSeconds(result.reset);
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter,
          },
          {
            status: 429,
            headers: {
              ...headers,
              'Retry-After': retryAfter.toString(),
            },
          },
        );
      }

      const response = await handler(request, context);
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    } catch (error) {
      logger.error('Custom rate limit error:', error);
      if (skipOnMissing) return handler(request, context);
      return NextResponse.json({ error: 'Rate limiting error' }, { status: 500 });
    }
  };
}

export function withRateLimitAndAuth<T = any>(
  handler: (request: NextRequest, context: any, user: any) => Promise<NextResponse>,
  options: {
    limiter: RateLimiterLike | null | RateLimiterGetter;
    roles?: string[];
    skipOnMissing?: boolean;
  },
) {
  return withRateLimit(
    async (request: NextRequest, context: any) => {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (options.roles && options.roles.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile?.role || !options.roles.includes(profile.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      return handler(request, context, user);
    },
    {
      limiter: options.limiter,
      skipOnMissing: options.skipOnMissing,
    },
  );
}
