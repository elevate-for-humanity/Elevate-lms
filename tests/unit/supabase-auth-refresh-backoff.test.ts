import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClient, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { createBrowserAuthFetch } from '@/lib/supabase/browser-auth-fetch';

const origin = 'https://fixture.supabase.co';
const refresh = origin + '/auth/v1/token?grant_type=refresh_token';
const request = { method: 'POST', body: '{"refresh_token":"fixture-only"}' };
afterEach(() => vi.useRealTimers());

describe('Supabase browser refresh backoff', () => {
  it('shares a provider retry window across tabs without storing credentials', async () => {
    let clock = 1000, until = 0;
    const upstream = vi.fn(async () => new Response('{}', { status: 429, headers: { 'retry-after': '60' } }));
    const options = { fetchImpl: upstream, now: () => clock, readRetryUntil: () => until, writeRetryUntil: (value: number) => { until = value; } };
    const first = createBrowserAuthFetch(origin, options);
    await expect(first(refresh, request)).rejects.toSatisfy(isAuthRetryableFetchError);
    for (let i = 0; i < 20; i++) await expect(first(refresh, request)).rejects.toSatisfy(isAuthRetryableFetchError);
    await expect(createBrowserAuthFetch(origin, options)(refresh, request)).rejects.toSatisfy(isAuthRetryableFetchError);
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(until).toBe(61000);
    clock = 61001;
    await expect(first(refresh, request)).rejects.toSatisfy(isAuthRetryableFetchError);
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  it('does not intercept password sign-in, database calls or other projects', async () => {
    const upstream = vi.fn(async () => new Response('{}', { status: 429 }));
    const transport = createBrowserAuthFetch(origin, { fetchImpl: upstream });
    for (const url of [origin + '/auth/v1/token?grant_type=password', origin + '/rest/v1/courses', 'https://other.supabase.co/auth/v1/token?grant_type=refresh_token'])
      expect((await transport(url, request)).status).toBe(429);
    expect(upstream).toHaveBeenCalledTimes(3);
  });

  it('preserves permanent invalid-token rejection and request cancellation', async () => {
    const writeRetryUntil = vi.fn();
    const upstream = vi.fn(async () => new Response('{"code":"refresh_token_not_found"}', { status: 400 }));
    const transport = createBrowserAuthFetch(origin, { fetchImpl: upstream, writeRetryUntil });
    expect((await transport(refresh, request)).status).toBe(400);
    expect(writeRetryUntil).not.toHaveBeenCalled();
    const controller = new AbortController(); controller.abort();
    await expect(transport(refresh, { ...request, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('verifies real SDK session retention with adapter=%s', async useAdapter => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T00:00:00Z'));
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const access = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({ exp: expiry, sub: 'fixture-user', role: 'authenticated' }) + '.fixture';
    const key = 'fixture-refresh-adapter-' + useAdapter;
    const storage = new Map<string, string>([[key, JSON.stringify({ access_token: access, refresh_token: 'fixture-only', expires_at: expiry, token_type: 'bearer', user: { id: 'fixture-user' } })]]);
    const upstream = vi.fn(async (input: RequestInfo | URL) => {
      if (!String(input).startsWith(refresh)) throw new Error('Unexpected external request in auth fixture');
      return new Response('{"code":"over_request_rate_limit","msg":"rate limited"}', { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '60' } });
    });
    const client = createClient(origin, 'fixture-public-key', {
      auth: { storageKey: key, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
        storage: { getItem: name => storage.get(name) ?? null, setItem: (name, value) => { storage.set(name, value); }, removeItem: name => { storage.delete(name); } } },
      global: { fetch: useAdapter ? createBrowserAuthFetch(origin, { fetchImpl: upstream }) : upstream },
    });
    await client.auth.initialize();
    vi.setSystemTime(new Date('2026-10-24T02:00:00Z'));
    const pending = client.auth.getSession();
    await vi.advanceTimersByTimeAsync(35_000);
    const result = await pending;
    expect(Boolean(result.error && isAuthRetryableFetchError(result.error))).toBe(useAdapter);
    expect(storage.has(key)).toBe(useAdapter);
    expect(upstream).toHaveBeenCalledTimes(1);
    await client.auth.stopAutoRefresh();
  });
});
