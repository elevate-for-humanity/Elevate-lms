import { afterEach, describe, expect, it } from 'vitest';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getRetryAfterSeconds, normalizeRateLimitReset } from '@/lib/rate-limit';

const originalNodeEnv = process.env.NODE_ENV;
const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

describe('applyRateLimit resilient fallback behavior', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;

    if (originalRedisUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl;

    if (originalRedisToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken;
  });

  it('allows local/test strict requests when Redis is not configured', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const result = await applyRateLimit(
      new Request('http://localhost/api/admin/dev-studio/chat', {
        headers: { 'x-forwarded-for': '198.51.100.11' },
      }),
      'strict',
    );

    expect(result).toBeNull();
  });

  it('uses a local strict limiter in production instead of returning 503 when Redis is absent', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const request = () =>
      new Request('https://www.elevateforhumanity.org/api/admin/dev-studio/chat', {
        headers: { 'x-forwarded-for': '198.51.100.22' },
      });

    expect(await applyRateLimit(request(), 'strict')).toBeNull();
    expect(await applyRateLimit(request(), 'strict')).toBeNull();
    expect(await applyRateLimit(request(), 'strict')).toBeNull();

    const fourth = await applyRateLimit(request(), 'strict');
    expect(fourth?.status).toBe(429);
    expect(Number(fourth?.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);
  });

  it('normalizes epoch seconds and never emits a negative retry delay', () => {
    const now = Date.now();
    const resetSeconds = Math.floor((now + 30_000) / 1_000);

    expect(normalizeRateLimitReset(resetSeconds, now)).toBeGreaterThan(now);
    expect(getRetryAfterSeconds(now - 60_000, now)).toBe(1);
  });
});
