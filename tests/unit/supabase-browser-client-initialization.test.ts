import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ client: null as any }));
vi.mock('@supabase/ssr', () => ({ createBrowserClient: () => mocks.client }));
vi.mock('@/lib/supabase/public-config', () => ({
  getBrowserPublicSupabaseConfig: () => ({ url: 'https://project.supabase.co', anonKey: 'fixture-public-key' }),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
beforeEach(() => {
  vi.resetModules();
  mocks.client = { auth: {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  } };
});
describe('cached Supabase browser client initialization', () => {
  it('installs one listener and one wrapper across repeated component calls', async () => {
    const { createBrowserClient } = await import('@/lib/supabase/client');
    const client = createBrowserClient();
    const getSession = client.auth.getSession;
    for (let i = 0; i < 20; i++) {
      expect(createBrowserClient()).toBe(client);
      expect(client.auth.getSession).toBe(getSession);
    }
    expect(mocks.client.auth.onAuthStateChange).toHaveBeenCalledOnce();
  });
  it('cleans an invalid refresh token once rather than once per factory call', async () => {
    const original = mocks.client.auth.getSession.mockResolvedValue({
      data: { session: null }, error: { message: 'Invalid Refresh Token: Refresh Token Not Found' },
    });
    const { createBrowserClient } = await import('@/lib/supabase/client');
    for (let i = 0; i < 20; i++) createBrowserClient();
    expect(await mocks.client.auth.getSession()).toEqual({ data: { session: null }, error: null });
    expect(original).toHaveBeenCalledOnce();
    expect(mocks.client.auth.signOut).toHaveBeenCalledOnce();
  });
  it('does not clear a session for transient auth rate limiting', async () => {
    const limited = { data: { session: null }, error: { message: 'Request rate limit reached', status: 429 } };
    mocks.client.auth.getSession.mockResolvedValue(limited);
    const { createBrowserClient } = await import('@/lib/supabase/client');
    expect(await createBrowserClient().auth.getSession()).toBe(limited);
    expect(mocks.client.auth.signOut).not.toHaveBeenCalled();
  });
});
