import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  contactRateLimit,
  strictRateLimit,
  apiRateLimit,
  authRateLimit,
  paymentRateLimit,
  publicRateLimit,
  pageLoadRateLimit,
  createRateLimitHeaders,
  checkInMemoryRateLimit,
  getIdentifier,
  getRetryAfterSeconds,
  type RateLimitTier,
} from '@/lib/rate-limit';

type Tier = Extract<
  RateLimitTier,
  'strict' | 'contact' | 'api' | 'auth' | 'payment' | 'public' | 'pageLoad'
>;

const limiters: Record<Tier, { get: () => any }> = {
  strict: strictRateLimit,
  contact: contactRateLimit,
  api: apiRateLimit,
  auth: authRateLimit,
  payment: paymentRateLimit,
  public: publicRateLimit,
  pageLoad: pageLoadRateLimit,
};

const INTERNAL_IP_PREFIXES = [
  '127.',
  '::1',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
];

function isInternalIP(identifier: string): boolean {
  return INTERNAL_IP_PREFIXES.some((prefix) => identifier.startsWith(prefix));
}

function tooManyRequests(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        ...createRateLimitHeaders(result),
        'Retry-After': String(getRetryAfterSeconds(result.reset)),
      },
    },
  );
}

/**
 * Check rate limit and return a 429 response if exceeded.
 *
 * Upstash is the distributed limiter. If it is missing, exhausted, or
 * temporarily unavailable, a bounded in-process limiter takes over so Redis
 * cannot become a production outage. The fallback remains fail-safe: requests
 * are still limited, but counters are per running instance until Redis recovers.
 */
export async function applyRateLimit(
  request: Request,
  tier: Tier = 'contact',
): Promise<NextResponse | null> {
  const pathname = (() => {
    try {
      return new URL(request.url).pathname;
    } catch {
      return '';
    }
  })();

  const effectiveTier: Tier =
    pathname === '/api/inquiry' && tier === 'strict'
      ? 'contact'
      : pathname === '/api/verification/submit' && tier === 'strict'
        ? 'auth'
        : tier;

  const identifier = getIdentifier(request);
  if (isInternalIP(identifier)) return null;

  const limiter = limiters[effectiveTier]?.get();

  if (!limiter) {
    const fallback = checkInMemoryRateLimit(effectiveTier, identifier);
    logger.warn('[rate-limit] Upstash not configured; using local fallback', {
      tier: effectiveTier,
    });
    return fallback.success ? null : tooManyRequests(fallback);
  }

  try {
    const result = await limiter.limit(identifier);
    if (!result.success) return tooManyRequests(result);
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isQuotaExhausted = msg.includes('max requests limit exceeded');
    const isCredential =
      msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized');

    const fallback = checkInMemoryRateLimit(effectiveTier, identifier);

    if (isQuotaExhausted) {
      logger.warn('[rate-limit] Upstash quota exhausted; using local fallback', {
        tier: effectiveTier,
      });
    } else if (isCredential) {
      logger.error('[rate-limit] Upstash credential error; using local fallback', undefined, {
        tier: effectiveTier,
        action: 'Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in runtime secrets',
      });
    } else {
      logger.warn('[rate-limit] Upstash unavailable; using local fallback', {
        tier: effectiveTier,
        error: msg,
      });
    }

    return fallback.success ? null : tooManyRequests(fallback);
  }
}
