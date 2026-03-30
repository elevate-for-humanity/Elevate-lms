/**
 * In-process rate limiter — emergency brake for serverless routes.
 *
 * Use this ONLY for routes that don't already use the Upstash-backed
 * applyRateLimit() from lib/api/withRateLimit.ts.
 *
 * Limitations:
 * - State is per-instance (not shared across Netlify function invocations).
 * - Resets on cold start.
 * - Suitable as a secondary defence; not a replacement for Upstash in prod.
 *
 * For new routes, prefer applyRateLimit() from @/lib/api/withRateLimit.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export type RateLimitOptions = {
  windowMs: number;
  max: number;
};

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const current = store.get(key);

  if (!current || now > current.resetAt) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.max - 1, resetAt };
  }

  if (current.count >= options.max) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(key, current);
  return {
    allowed: true,
    remaining: options.max - current.count,
    resetAt: current.resetAt,
  };
}

export function getRateLimitKey(req: Request, userId?: string | null): string {
  const forwarded = req.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0]?.trim() || 'unknown';
  return userId ? `user:${userId}` : `ip:${ip}`;
}
