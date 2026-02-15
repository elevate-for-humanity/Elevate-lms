import { NextResponse } from 'next/server';
import { contactRateLimit, strictRateLimit, apiRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';

type Tier = 'strict' | 'contact' | 'api';

const limiters: Record<Tier, { get: () => any }> = {
  strict: strictRateLimit,   // 3 req / 5 min
  contact: contactRateLimit, // 3 req / 1 min
  api: apiRateLimit,         // 100 req / 1 min
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
  if (!limiter) return null; // Redis not configured — allow

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
    // Redis error — fail open
    return null;
  }

  return null;
}
