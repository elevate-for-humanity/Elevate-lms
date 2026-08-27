import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

// Shared standard Redis client. REDIS_URL is the canonical runtime secret.
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5_000,
      enableReadyCheck: true,
    });
    redis.on('error', (error) => {
      logger.warn('[redis] connection error', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
    return redis;
  } catch (error) {
    logger.warn('[redis] client initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    redis = null;
    return null;
  }
}

export interface RedisClientCompat {
  set(
    key: string,
    value: string,
    options?: { nx?: boolean; ex?: number },
  ): Promise<string | null>;
  get(key: string): Promise<string | null>;
}

let redisCompat: RedisClientCompat | null = null;

export function getRedisClient(): RedisClientCompat | null {
  const client = getRedis();
  if (!client) return null;
  if (redisCompat) return redisCompat;

  redisCompat = {
    async set(key, value, options) {
      if (options?.nx && options?.ex) {
        return client.set(key, value, 'EX', options.ex, 'NX');
      }
      if (options?.nx) {
        return client.set(key, value, 'NX');
      }
      if (options?.ex) {
        return client.set(key, value, 'EX', options.ex);
      }
      return client.set(key, value);
    },
    async get(key) {
      return client.get(key);
    },
  };

  return redisCompat;
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

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimiterLike {
  limit(identifier: string): Promise<RateLimitResult>;
}

function parseWindowMs(window: string): number {
  const match = window.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return 60_000;

  const valueToken = match[1];
  const unitToken = match[2];
  if (valueToken === undefined || unitToken === undefined) return 60_000;

  const value = Number(valueToken);
  if (!Number.isSafeInteger(value) || value <= 0) return 60_000;

  const unit = unitToken.toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const multiplier = multipliers[unit];
  return multiplier === undefined ? 60_000 : value * multiplier;
}

const FIXED_WINDOW_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return {current, ttl}
`;

async function consumeRedisWindow(
  client: Redis,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const raw = (await client.eval(FIXED_WINDOW_SCRIPT, 1, key, String(windowMs))) as unknown;
  const pair = Array.isArray(raw) ? raw : [];
  const current = Number(pair[0] ?? 1);
  const ttl = Number(pair[1] ?? windowMs);
  const safeTtl = Number.isFinite(ttl) && ttl > 0 ? ttl : windowMs;

  return {
    success: current <= limit,
    limit,
    remaining: Math.max(limit - current, 0),
    reset: now + safeTtl,
  };
}

function createRateLimiter(
  config: { requests: number; window: string },
  prefix: string,
): RateLimiterLike | null {
  if (!getRedis()) return null;
  const windowMs = parseWindowMs(config.window);

  return {
    async limit(identifier: string): Promise<RateLimitResult> {
      const client = getRedis();
      if (!client) throw new Error('Redis is not configured');
      const bucket = Math.floor(Date.now() / windowMs);
      const key = `${prefix}:${bucket}:${identifier}`;
      return consumeRedisWindow(client, key, config.requests, windowMs);
    },
  };
}

let _authRateLimit: RateLimiterLike | null | undefined;
let _paymentRateLimit: RateLimiterLike | null | undefined;
let _contactRateLimit: RateLimiterLike | null | undefined;
let _apiRateLimit: RateLimiterLike | null | undefined;
let _strictRateLimit: RateLimiterLike | null | undefined;
let _publicRateLimit: RateLimiterLike | null | undefined;
let _pageLoadRateLimit: RateLimiterLike | null | undefined;
let _licenseRateLimit: RateLimiterLike | null | undefined;
let _licenseValidateRateLimit: RateLimiterLike | null | undefined;

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

  const fingerprintSeed = [
    request.headers.get('user-agent') || '',
    request.headers.get('accept-language') || '',
    request.headers.get('sec-ch-ua') || '',
  ].join('|');

  return `anonymous:${simpleHash(fingerprintSeed || 'no-client-headers')}`;
}

type LocalBucket = { count: number; reset: number };
const localBuckets = new Map<string, LocalBucket>();

export function checkInMemoryRateLimit(
  tier: RateLimitTier,
  identifier: string,
  now = Date.now(),
): RateLimitResult {
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
  const normalized = reset < 1_000_000_000_000 ? reset * 1_000 : reset;
  return Math.max(normalized, now + 1_000);
}

export function getRetryAfterSeconds(reset: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((normalizeRateLimitReset(reset, now) - now) / 1_000));
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
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
  const client = getRedis();
  if (!client) {
    logger.warn('Rate limiting Redis not configured; legacy check is allowing request');
    return { ok: true, remaining: config.limit, current: 0 };
  }

  const windowMs = config.windowSeconds * 1_000;
  const bucket = Math.floor(Date.now() / windowMs);
  const result = await consumeRedisWindow(client, `${config.key}:${bucket}`, config.limit, windowMs);
  const current = config.limit - result.remaining;

  return {
    ok: result.success,
    remaining: result.remaining,
    current,
  };
}
