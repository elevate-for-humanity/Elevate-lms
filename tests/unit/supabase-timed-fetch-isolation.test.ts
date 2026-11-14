import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CircuitBreaker } from '@/lib/resilience';
import { timedFetch } from '@/lib/supabase/timed-fetch';

describe('Supabase timed fetch circuit isolation', () => {
  beforeEach(() => {
    CircuitBreaker.resetAll();
    vi.restoreAllMocks();
    delete process.env.SUPABASE_FETCH_TIMEOUT_MS;
    delete process.env.SUPABASE_AUTH_FETCH_TIMEOUT_MS;
    delete process.env.SUPABASE_READ_MAX_ATTEMPTS;
    delete process.env.SUPABASE_CIRCUIT_BREAKER_ENABLED;
  });

  it('gives interactive Supabase Auth requests a dedicated timeout budget', async () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'test-token' }), { status: 200 }),
    );

    await timedFetch('https://example.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
    });

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 15_000);
  });

  it('keeps public Data API reads on the fail-fast timeout', async () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]', { status: 200 }));

    await timedFetch('https://example.supabase.co/rest/v1/programs');

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2_500);
  });

  it('allows batch workers to bypass the interactive read circuit', async () => {
    process.env.SUPABASE_CIRCUIT_BREAKER_ENABLED = 'false';
    process.env.SUPABASE_READ_MAX_ATTEMPTS = '1';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new DOMException('This operation was aborted', 'AbortError'))
      .mockResolvedValueOnce(new Response('[]', { status: 200 }));

    await expect(timedFetch('https://example.supabase.co/rest/v1/programs')).rejects.toThrow(
      'aborted',
    );
    const response = await timedFetch('https://example.supabase.co/rest/v1/programs');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not replay interactive reads by default', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('temporarily unavailable', { status: 503 }));

    await expect(timedFetch('https://example.supabase.co/rest/v1/programs')).rejects.toThrow(
      'Supabase transient HTTP 503',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not let failed optional writes block a required read', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new DOMException('This operation was aborted', 'AbortError'))
      .mockRejectedValueOnce(new DOMException('This operation was aborted', 'AbortError'))
      .mockRejectedValueOnce(new DOMException('This operation was aborted', 'AbortError'))
      .mockRejectedValueOnce(new DOMException('This operation was aborted', 'AbortError'))
      .mockRejectedValueOnce(new DOMException('This operation was aborted', 'AbortError'))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 'program-1' }]), { status: 200 }));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        timedFetch('https://example.supabase.co/rest/v1/course_factory_jobs', {
          method: 'POST',
        }),
      ).rejects.toThrow('aborted');
    }

    const response = await timedFetch(
      'https://example.supabase.co/rest/v1/programs?slug=eq.cosmetology-apprenticeship',
      { method: 'GET' },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
