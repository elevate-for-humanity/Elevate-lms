import { afterEach, describe, expect, it } from 'vitest';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const originalNodeEnv = process.env.NODE_ENV;

describe('applyRateLimit strict local behavior', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('fails open for strict routes in test/local environments when Redis is not configured', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const result = await applyRateLimit(new Request('http://localhost/api/devstudio/chat'), 'strict');

    expect(result).toBeNull();
  });

  it('still fails closed for strict routes in production when Redis is not configured', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    // Use absolute URL for production test
    const result = await applyRateLimit(new Request('https://www.elevateforhumanity.org/api/devstudio/chat'), 'strict');

    expect(result?.status).toBe(503);
    await expect(result?.json()).resolves.toEqual({ error: 'Rate limiting temporarily unavailable' });
  });
});

