import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit';

type RateLimiterGetter = { get: () => Ratelimit | null };

/**
 * Rate limit middleware for API routes
 * 
 * Usage:
 * export const POST = withRateLimit(handler, { limiter: authRateLimit });
 */
export function withRateLimit<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  options: {
    limiter: Ratelimit | null | RateLimiterGetter;
    skipOnMissing?: boolean; // Skip rate limiting if Redis not configured
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const { skipOnMissing = true } = options;
    
    // Get limiter (support both direct and getter patterns)
    const limiter = typeof (options.limiter as any)?.get === 'function' 
      ? (options.limiter as RateLimiterGetter).get() 
      : options.limiter as Ratelimit | null;

    // Skip if rate limiter not configured
    if (!limiter) {
      if (skipOnMissing) {
        logger.warn('⚠️ Rate limiting skipped - Redis not configured');
        return handler(request, context);
      } else {
        return NextResponse.json(
          { error: 'Rate limiting not configured' },
          { status: 503 }
        );
      }
    }

    // Get identifier (IP address)
    const identifier = getIdentifier(request);

    try {
      // Check rate limit
      const result = await limiter.limit(identifier);

      // Add rate limit headers
      const headers = createRateLimitHeaders(result);

      // If rate limit exceeded
      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              ...headers,
              'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      // Execute handler
      const response = await handler(request, context);

      // Add rate limit headers to successful response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      logger.error('Rate limit error:', error);
      
      // On error, allow request but log
      if (skipOnMissing) {
        return handler(request, context);
      } else {
        return NextResponse.json(
          { error: 'Rate limiting error' },
          { status: 500 }
        );
      }
    }
  };
}

/**
 * Combined rate limit and auth middleware
 */
export function withRateLimitAndAuth<T = any>(
  handler: (request: NextRequest, context: any, user: any) => Promise<NextResponse<T>>,
  options: {
    limiter: Ratelimit | null;
    roles?: string[];
    skipOnMissing?: boolean;
  }
) {
  return withRateLimit(
    async (request: NextRequest, context: any) => {
      // Import auth check
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Check roles if specified
      if (options.roles && options.roles.length > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile?.role || !options.roles.includes(profile.role)) {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          );
        }
      }

      return handler(request, context, user);
    },
    {
      limiter: options.limiter,
      skipOnMissing: options.skipOnMissing,
    }
  );
}
