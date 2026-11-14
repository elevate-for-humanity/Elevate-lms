import { describe, expect, it } from 'vitest';
import {
  getServerPublicSupabaseConfig,
  isPlaceholderSupabaseConfig,
  resolveServerSupabaseRawEnv,
} from '@/lib/supabase/public-config';

describe('supabase public-config', () => {
  it('treats placeholder values as misconfigured', () => {
    expect(isPlaceholderSupabaseConfig('https://x.supabase.co', 'placeholder')).toBe(true);
    expect(isPlaceholderSupabaseConfig('https://x.supabase.co', 'build-placeholder')).toBe(true);
    expect(isPlaceholderSupabaseConfig('https://placeholder.supabase.co', 'eyJ')).toBe(true);
    expect(isPlaceholderSupabaseConfig('', '')).toBe(true);
  });

  it('accepts real-looking values', () => {
    expect(
      isPlaceholderSupabaseConfig(
        'https://cuxzzpsyufcewtmicszk.supabase.co',
        'eyJhbGciOiJIUzI1NiJ9.test',
      ),
    ).toBe(false);
  });

  it('getServerPublicSupabaseConfig returns null when env is missing', () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const prevSupabaseUrl = process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_URL;
    expect(getServerPublicSupabaseConfig()).toBeNull();
    process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
    process.env.SUPABASE_URL = prevSupabaseUrl;
  });

  it('prefers SUPABASE_ANON_KEY over inlined NEXT_PUBLIC build placeholder', () => {
    const prevAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const prevRuntime = process.env.SUPABASE_ANON_KEY;
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'build-placeholder';
    process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiJ9.runtime';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
    const cfg = getServerPublicSupabaseConfig();
    expect(cfg?.anonKey).toBe('eyJhbGciOiJIUzI1NiJ9.runtime');
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevAnon;
    process.env.SUPABASE_ANON_KEY = prevRuntime;
    process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
  });

  it('getServerPublicSupabaseConfig falls back to SUPABASE_URL', () => {
    const prevNextUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevSupabaseUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiJ9.test';
    const cfg = getServerPublicSupabaseConfig();
    expect(cfg?.url).toBe('https://cuxzzpsyufcewtmicszk.supabase.co');
    process.env.NEXT_PUBLIC_SUPABASE_URL = prevNextUrl;
    process.env.SUPABASE_URL = prevSupabaseUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
  });
});
