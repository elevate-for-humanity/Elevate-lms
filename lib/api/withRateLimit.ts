import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/api/get-client-ip';
import {
  contactRateLimit,
  strictRateLimit,
  apiRateLimit,
  authRateLimit,
  paymentRateLimit,
  publicRateLimit,
  pageLoadRateLimit,
  createRateLimitHeaders,
  RATE_LIMITS,
  checkInMemoryRateLimit,
} from '@/lib/rate-limit';

type Tier = 'strict' | 'contact' | 'api' | 'auth' | 'payment' | 'public' | 'pageLoad';

const limiters: Record<Tier, { get: () => any }> = {
  strict: strictRateLimit, // 3 req / 5 min
  contact: contactRateLimit, // 3 req / 1 min
  api: apiRateLimit, // 60 req / 1 min
  auth: authRateLimit, // 5 req / 1 min
  payment: paymentRateLimit, // 10 req / 1 min
  public: publicRateLimit, // 5 req / 1 min (public AI tutor)
  pageLoad: pageLoadRateLimit, // 30 req / 1 min (public content endpoints)
};

// IPs that should never consume Upstash quota.
// Platform health checks originate from localhost/container-internal networks.
const INTERNAL_IP_PREFIXES = ['127.', '::1', '10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.'];

function isInternalIP(ip: string): boolean {
  return INTERNAL_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

/**
 * Check rate limit and return 429 response if exceeded.
 * Returns null if the request is allowed.
 *
 * Usage:
 *   const blocked = await applyRateLimit(request, 'contact');
 *   if (blocked) return blocked;
 */
export async function applyRateLimit(
  request: Request,
  tier: Tier = 'contact',
): Promise<NextResponse | null> {
  const limiter = limiters[tier]?.get();
  const failClosed = tier === 'strict';
  const isProduction = process.env.NODE_ENV === 'production';

  if (!limiter) {
    if (failClosed && isProduction) {
      logger.error('[rate-limit] Redis unavailable — failing closed', undefined, { tier });
      return NextResponse.json({ error: 'Rate limiting temporarily unavailable' }, { status: 503 });
    }

    // Redis is optional in local/test environments so strict admin routes remain testable.
    // Production strict routes still fail closed above.
    logger.warn('[rate-limit] Redis unavailable — failing open', { tier });
    return null;
  }

  const id = getClientIp(request);

  // Skip Redis for internal health check IPs — they are not external callers.
  // and would otherwise burn ~1,440 Upstash requests/day per task per route.
  if (isInternalIP(id)) return null;

  try {
    const result = await limiter.limit(id);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            ...createRateLimitHeaders(result),
            'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
          },
        },
      );
    }
  } catch (err) {
    // Redis error (timeout, connection refused, bad credentials, plan limit exceeded, etc.).
    // Strict tier fails closed; other tiers fail open.
    const msg = err instanceof Error ? err.message : String(err);
    const isQuotaExhausted = msg.includes('max requests limit exceeded');
    const isCredential = msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized');
    const isMalformedResponse = msg.includes('res.map is not a function') || msg.includes('res.filter is not a function') || msg.includes('Cannot read properties of');

    // If Redis command is not available (e.g., plain Redis vs Upstash Redis), use in-memory fallback
    const isCommandUnavailable = msg.includes('not available') || msg.includes('not a function') || isMalformedResponse;

    if (isCommandUnavailable) {
      // Use in-memory rate limiting as fallback - this is expected when using plain Redis without RATELIMIT command
      if (failClosed) {
        // For strict tier, use in-memory check
        const windowMs = tier === 'strict' ? 5 * 60 * 1000 : 60 * 1000;
        const limit = RATE_LIMITS[tier]?.requests || 60;
        const allowed = checkInMemoryRateLimit(id, limit, windowMs);
        if (!allowed) {
          return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }
        return null;
      }
      // For non-strict tiers, allow request but log once
      logger.debug('[rate-limit] Using in-memory fallback', { tier, ip: id });
      return null;
    }

    // Check for malformed response errors (indicates Redis/Upstash issue)
    const isMalformedResponse = 
      msg.includes('res.map is not a function') || 
      msg.includes('res.filter is not a function') || 
      msg.includes('Cannot read properties of');

    // If Redis command is not available (e.g., plain Redis vs Upstash Redis), use in-memory fallback
    const isCommandUnavailable = 
      msg.includes('not available') || 
      msg.includes('not a function') || 
      isMalformedResponse;

    if (isCommandUnavailable) {
      // Use in-memory rate limiting as fallback - this is expected when using plain Redis without RATELIMIT command
      if (failClosed) {
        // For strict tier, use in-memory check
        const windowMs = tier === 'strict' ? 5 * 60 * 1000 : 60 * 1000;
        const limit = RATE_LIMITS[tier]?.requests || 60;
        const allowed = checkInMemoryRateLimit(id, limit, windowMs);
        if (!allowed) {
          return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }
        return null;
      }
      // For non-strict tiers, allow request but log once
      logger.debug('[rate-limit] Using in-memory fallback', { tier, ip: id });
      return null;
    }

    if (failClosed) {
      // Only strict tier logs at error — it's actually blocking traffic.
      logger.error(`[rate-limit] Redis error — failing closed`, undefined, { tier, error: msg });
      return NextResponse.json({ error: 'Rate limiting temporarily unavailable' }, { status: 503 });
    }

    if (isQuotaExhausted) {
      // Monthly quota exhausted — log once at warn, not error, to avoid Sentry spam.
      // Failing open: traffic continues normally until quota resets.
      logger.warn('[rate-limit] Upstash monthly quota exhausted — failing open until reset', { tier });
    } else if (isCredential) {
      logger.error('[rate-limit] Redis credentials invalid — failing open', undefined, {
        tier,
        error: msg,
        action: 'Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Northflank secrets.',
      });
    } else {
      logger.warn('[rate-limit] Redis unavailable — failing open', { tier, error: msg });
    }

    return null;
  }

  return null;
}
