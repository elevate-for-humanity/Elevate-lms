import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CircuitBreaker } from '@/lib/resilience';
import { timedFetch } from '@/lib/supabase/timed-fetch';

describe('Supabase timed fetch circuit isolation', () => {
  beforeEach(() => {
    CircuitBreaker.resetAll();
    vi.restoreAllMocks();
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
