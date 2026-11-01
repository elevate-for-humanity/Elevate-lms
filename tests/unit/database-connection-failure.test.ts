import { afterEach, describe, expect, it, vi } from 'vitest';

const configured = vi.hoisted(() => ({ value: false }));
vi.mock('@/lib/supabase/public-config', () => ({
  getServerPublicSupabaseConfig: () => configured.value ? { url: 'https://project.supabase.co', anonKey: 'test-key' } : null,
  getBrowserPublicSupabaseConfig: () => null,
}));
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.mock('@/lib/supabase/browser-auth-fetch', () => ({ createBrowserAuthFetch: vi.fn(), getBrowserAuthFetch: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => { throw new Error('CLIENT_INIT_FAILED'); } }));

import { createPublicClient } from '@/lib/supabase/public';
import { createStaticClient } from '@/lib/supabase/static';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createBrowserClient } from '@/lib/supabase/client';

afterEach(() => { configured.value = false; });
describe('database failures cannot masquerade as empty records or successful writes', () => {
  it('rejects unconfigured public and build-time reads', () => {
    expect(createPublicClient).toThrow('SUPABASE_CONFIGURATION_MISSING');
    expect(createStaticClient).toThrow('SUPABASE_CONFIGURATION_MISSING');
  });
  it('rejects unconfigured authenticated server access', async () => {
    await expect(createServerClient()).rejects.toThrow('SUPABASE_CONFIGURATION_MISSING');
  });
  it('rejects unconfigured browser operations instead of supplying a no-op client', () => {
    expect(createBrowserClient).toThrow('SUPABASE_CONFIGURATION_MISSING');
  });
  it('propagates configured public client construction failures', () => {
    configured.value = true;
    expect(createPublicClient).toThrow('CLIENT_INIT_FAILED');
  });
});
