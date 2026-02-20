import { NextResponse } from 'next/server';
import { contactRateLimit, strictRateLimit, apiRateLimit, authRateLimit, paymentRateLimit, publicRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';

type Tier = 'strict' | 'contact' | 'api' | 'auth' | 'payment' | 'public';

// Tiers that must fail closed (return 503) when Redis is unavailable
const FAIL_CLOSED_TIERS: Set<Tier> = new Set(['auth', 'payment', 'strict']);

const limiters: Record<Tier, { get: () => any }> = {
  strict: strictRateLimit,     // 3 req / 5 min
  contact: contactRateLimit,   // 3 req / 1 min
  api: apiRateLimit,           // 100 req / 1 min
  auth: authRateLimit,         // 5 req / 1 min
  payment: paymentRateLimit,   // 10 req / 1 min
  public: publicRateLimit,     // 10 req / 1 min (public AI tutor)
};

function getIP(request: Request): string {
  const h = request.headers;
  return h.get('x-forwarded-for')?.split(',')[0]?.trim()
    || h.get('x-real-ip')
    || h.get('cf-connecting-ip')
    || 'unknown';
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
  tier: Tier = 'contact'
): Promise<NextResponse | null> {
  const limiter = limiters[tier]?.get();
  if (!limiter) {
    // For auth/payment/strict tiers, fail closed when Redis is unavailable
    if (FAIL_CLOSED_TIERS.has(tier)) {
      return NextResponse.json(
        { error: 'Rate limiting service unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    return null; // Other tiers: fail open
  }

  const id = getIP(request);

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
        }
      );
    }
  } catch {
    // Redis error — fail closed for sensitive tiers
    if (FAIL_CLOSED_TIERS.has(tier)) {
      return NextResponse.json(
        { error: 'Rate limiting service unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    return null;
  }

  return null;
}
