import { logger } from '@/lib/logger';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazy initialize Redis client to avoid build-time errors
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token || !url.startsWith('https://')) {
    return null;
  }
  
  redis = new Redis({ url, token });
  return redis;
}

// Rate limit configurations
const RATE_LIMITS = {
  auth: { requests: 5, window: '1 m' }, // 5 requests per minute
  payment: { requests: 10, window: '1 m' }, // 10 requests per minute
  contact: { requests: 3, window: '1 m' }, // 3 requests per minute
  api: { requests: 100, window: '1 m' }, // 100 requests per minute
  strict: { requests: 3, window: '5 m' }, // 3 requests per 5 minutes
  public: { requests: 10, window: '1 m' }, // 10 requests per minute (public AI tutor)
  license: { requests: 5, window: '5 m' }, // 5 license operations per 5 minutes
  licenseValidate: { requests: 20, window: '1 m' }, // 20 validations per minute
} as const;

// Create rate limiters lazily
function createRateLimiter(config: { requests: number; window: string }, prefix: string): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(config.requests, config.window as any),
    analytics: true,
    prefix,
  });
}

// Lazy getters for rate limiters
let _authRateLimit: Ratelimit | null | undefined;
let _paymentRateLimit: Ratelimit | null | undefined;
let _contactRateLimit: Ratelimit | null | undefined;
let _apiRateLimit: Ratelimit | null | undefined;
let _strictRateLimit: Ratelimit | null | undefined;
let _publicRateLimit: Ratelimit | null | undefined;
let _licenseRateLimit: Ratelimit | null | undefined;
let _licenseValidateRateLimit: Ratelimit | null | undefined;

export const authRateLimit = { get: () => _authRateLimit ?? (_authRateLimit = createRateLimiter(RATE_LIMITS.auth, 'ratelimit:auth')) };
export const paymentRateLimit = { get: () => _paymentRateLimit ?? (_paymentRateLimit = createRateLimiter(RATE_LIMITS.payment, 'ratelimit:payment')) };
export const contactRateLimit = { get: () => _contactRateLimit ?? (_contactRateLimit = createRateLimiter(RATE_LIMITS.contact, 'ratelimit:contact')) };
export const apiRateLimit = { get: () => _apiRateLimit ?? (_apiRateLimit = createRateLimiter(RATE_LIMITS.api, 'ratelimit:api')) };
export const strictRateLimit = { get: () => _strictRateLimit ?? (_strictRateLimit = createRateLimiter(RATE_LIMITS.strict, 'ratelimit:strict')) };
export const publicRateLimit = { get: () => _publicRateLimit ?? (_publicRateLimit = createRateLimiter(RATE_LIMITS.public, 'ratelimit:public')) };
export const licenseRateLimit = { get: () => _licenseRateLimit ?? (_licenseRateLimit = createRateLimiter(RATE_LIMITS.license, 'ratelimit:license')) };
export const licenseValidateRateLimit = { get: () => _licenseValidateRateLimit ?? (_licenseValidateRateLimit = createRateLimiter(RATE_LIMITS.licenseValidate, 'ratelimit:license-validate')) };

// Helper function to get identifier from request
export function getIdentifier(request: Request): string {
  // Try to get IP from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}

// Helper function to create rate limit headers
export function createRateLimitHeaders(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}

// Legacy interface for backwards compatibility
interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

export async function checkRateLimit(config: RateLimitConfig) {
  const r = getRedis();
  if (!r) {
    logger.warn('⚠️ Rate limiting disabled - Redis not configured');
    return { ok: true, remaining: config.limit, current: 0 };
  }

  const { key, limit, windowSeconds } = config;
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `${key}:${Math.floor(now / windowSeconds)}`;

  const current = (await r.incr(windowKey)) as number;

  if (current === 1) {
    await r.expire(windowKey, windowSeconds);
  }

  const remaining = Math.max(limit - current, 0);
  const ok = current <= limit;

  return {
    ok,
    remaining,
    current,
  };
}
