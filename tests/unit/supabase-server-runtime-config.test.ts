// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  server: vi.fn(() => ({ auth: {} })),
  public: vi.fn(() => ({})),
}));
vi.mock('@supabase/ssr', () => ({ createServerClient: state.server }));
vi.mock('@supabase/supabase-js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@supabase/supabase-js')>()),
  createClient: state.public,
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: () => [], set: vi.fn() }),
  headers: async () => new Headers({ host: 'admin.elevateforhumanity.org' }),
}));
import { createClient, createPublicClient, isSupabaseConfigured } from '@/lib/supabase/server';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it('uses the runtime configuration for both cookie and public server clients despite build placeholders', async () => {
  vi.stubEnv('SUPABASE_URL', 'https://runtime.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'runtime-public-key');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'build-placeholder');
  expect(isSupabaseConfigured()).toBe(true);
  await createClient();
  createPublicClient();
  for (const factory of [state.server, state.public]) {
    expect(factory).toHaveBeenCalledWith(
      'https://runtime.supabase.co',
      'runtime-public-key',
      expect.any(Object),
    );
  }
});
it('rejects build placeholders instead of constructing an unusable authentication client', async () => {
  vi.stubEnv('SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_ANON_KEY', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'build-placeholder');
  expect(isSupabaseConfigured()).toBe(false);
  await expect(createClient()).rejects.toThrow('SUPABASE_CONFIGURATION_MISSING');
  expect(state.server).not.toHaveBeenCalled();
});
