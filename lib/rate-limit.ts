import { logger } from '@/lib/logger';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazy initialize Redis client to avoid build-time errors.
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

export function getRedisClient(): Redis | null {
  return getRedis();
}

export const RATE_LIMITS = {
  auth: { requests: 5, window: '1 m' },
  payment: { requests: 10, window: '1 m' },
  contact: { requests: 3, window: '1 m' },
  api: { requests: 180, window: '1 m' },
  strict: { requests: 3, window: '5 m' },
  public: { requests: 20, window: '1 m' },
  pageLoad: { requests: 180, window: '1 m' },
  license: { requests: 5, window: '5 m' },
  licenseValidate: { requests: 20, window: '1 m' },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMITS;

function createRateLimiter(
  config: { requests: number; window: string },
  prefix: string,
): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(config.requests, config.window as any),
    analytics: true,
    prefix,
  });
}

let _authRateLimit: Ratelimit | null | undefined;
let _paymentRateLimit: Ratelimit | null | undefined;
let _contactRateLimit: Ratelimit | null | undefined;
let _apiRateLimit: Ratelimit | null | undefined;
let _strictRateLimit: Ratelimit | null | undefined;
let _publicRateLimit: Ratelimit | null | undefined;
let _pageLoadRateLimit: Ratelimit | null | undefined;
let _licenseRateLimit: Ratelimit | null | undefined;
let _licenseValidateRateLimit: Ratelimit | null | undefined;

export const authRateLimit = {
  get: () =>
    _authRateLimit ?? (_authRateLimit = createRateLimiter(RATE_LIMITS.auth, 'ratelimit:auth')),
};
export const paymentRateLimit = {
  get: () =>
    _paymentRateLimit ??
    (_paymentRateLimit = createRateLimiter(RATE_LIMITS.payment, 'ratelimit:payment')),
};
export const contactRateLimit = {
  get: () =>
    _contactRateLimit ??
    (_contactRateLimit = createRateLimiter(RATE_LIMITS.contact, 'ratelimit:contact')),
};
export const apiRateLimit = {
  get: () => _apiRateLimit ?? (_apiRateLimit = createRateLimiter(RATE_LIMITS.api, 'ratelimit:api')),
};
export const strictRateLimit = {
  get: () =>
    _strictRateLimit ??
    (_strictRateLimit = createRateLimiter(RATE_LIMITS.strict, 'ratelimit:strict')),
};
export const publicRateLimit = {
  get: () =>
    _publicRateLimit ??
    (_publicRateLimit = createRateLimiter(RATE_LIMITS.public, 'ratelimit:public')),
};
export const pageLoadRateLimit = {
  get: () =>
    _pageLoadRateLimit ??
    (_pageLoadRateLimit = createRateLimiter(RATE_LIMITS.pageLoad, 'ratelimit:pageload')),
};
export const licenseRateLimit = {
  get: () =>
    _licenseRateLimit ??
    (_licenseRateLimit = createRateLimiter(RATE_LIMITS.license, 'ratelimit:license')),
};
export const licenseValidateRateLimit = {
  get: () =>
    _licenseValidateRateLimit ??
    (_licenseValidateRateLimit = createRateLimiter(
      RATE_LIMITS.licenseValidate,
      'ratelimit:license-validate',
    )),
};

function simpleHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function getIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const cloudflareIp = request.headers.get('cf-connecting-ip')?.trim();
  const ip = cloudflareIp || forwarded || realIp;

  if (ip) return ip;

  // Avoid putting every request with a missing proxy header into one shared
  // "unknown" bucket. This fingerprint is only a last-resort fallback.
  const fingerprintSeed = [
    request.headers.get('user-agent') || '',
    request.headers.get('accept-language') || '',
    request.headers.get('sec-ch-ua') || '',
  ].join('|');

  return `anonymous:${simpleHash(fingerprintSeed || 'no-client-headers')}`;
}

function parseWindowMs(window: string): number {
  const match = window.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return 60_000;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * multipliers[unit];
}

type LocalBucket = { count: number; reset: number };
const localBuckets = new Map<string, LocalBucket>();

export function checkInMemoryRateLimit(
  tier: RateLimitTier,
  identifier: string,
  now = Date.now(),
): { success: boolean; limit: number; remaining: number; reset: number } {
  const config = RATE_LIMITS[tier];
  const key = `${tier}:${identifier}`;
  const windowMs = parseWindowMs(config.window);
  const existing = localBuckets.get(key);

  let bucket: LocalBucket;
  if (!existing || existing.reset <= now) {
    bucket = { count: 1, reset: now + windowMs };
  } else {
    bucket = { count: existing.count + 1, reset: existing.reset };
  }

  localBuckets.set(key, bucket);

  // Keep the fallback bounded during a long-lived process.
  if (localBuckets.size > 10_000) {
    for (const [bucketKey, candidate] of localBuckets) {
      if (candidate.reset <= now) localBuckets.delete(bucketKey);
      if (localBuckets.size <= 8_000) break;
    }
  }

  return {
    success: bucket.count <= config.requests,
    limit: config.requests,
    remaining: Math.max(config.requests - bucket.count, 0),
    reset: bucket.reset,
  };
}

export function normalizeRateLimitReset(reset: number, now = Date.now()): number {
  if (!Number.isFinite(reset) || reset <= 0) return now + 1_000;

  // Some Redis/rate-limit implementations expose epoch seconds; Upstash uses
  // epoch milliseconds. Normalize either form before headers are produced.
  const normalized = reset < 1_000_000_000_000 ? reset * 1_000 : reset;
  return Math.max(normalized, now + 1_000);
}

export function getRetryAfterSeconds(reset: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((normalizeRateLimitReset(reset, now) - now) / 1_000));
}

export function createRateLimitHeaders(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  const reset = normalizeRateLimitReset(result.reset);
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(reset).toISOString(),
  };
}

interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

export async function checkRateLimit(config: RateLimitConfig) {
  const r = getRedis();
  if (!r) {
    logger.warn('Rate limiting Redis not configured; legacy check is allowing request');
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
