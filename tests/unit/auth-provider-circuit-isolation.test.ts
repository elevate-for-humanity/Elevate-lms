import { expect, it, vi } from 'vitest';
import { timedFetch } from '@/lib/supabase/timed-fetch';
import { createClient } from '@supabase/supabase-js';

it('verifies users with the provider even when the database circuit is open', async () => {
  const transport = vi.spyOn(globalThis, 'fetch');
  try {
    for (let i = 0; i < 5; i++) {
      transport.mockRejectedValueOnce(new Error('database connection interrupted'));
    }
    transport.mockResolvedValueOnce(new Response('{"id":"audit-user"}', { status: 200 }));
    for (let i = 0; i < 5; i++) {
      await timedFetch('https://audit.supabase.co/rest/v1/programs').catch(() => {});
    }
    const client = createClient('https://audit.supabase.co', 'audit-public-key', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: timedFetch },
    });
    const result = await client.auth.getUser('audit-session-token');
    expect(result.error).toBeNull();
    expect(result.data.user?.id).toBe('audit-user');
    expect(transport).toHaveBeenCalledTimes(6);
    await expect(timedFetch('https://audit.supabase.co/rest/v1/programs')).rejects.toThrow(
      'is open',
    );
    expect(transport).toHaveBeenCalledTimes(6);
  } finally {
    transport.mockRestore();
  }
});
