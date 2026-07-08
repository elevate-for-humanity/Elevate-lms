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

function getIP(request: Request): string {
  const h = request.headers;
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    'unknown'
  );
}

// IPs that should never consume Upstash quota.
// ECS health checks originate from localhost (task-internal) or the VPC CIDR.
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

  const id = getIP(request);

  // Skip Redis for internal/ECS health check IPs — they are not external callers
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
      logger.error('[rate-limit] Redis credential error — failing open', undefined, {
        tier,
        action: 'Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in SSM /elevate/',
      });
    } else {
      logger.warn('[rate-limit] Redis unavailable — failing open', { tier, error: msg });
    }

    return null;
  }

  return null;
}
