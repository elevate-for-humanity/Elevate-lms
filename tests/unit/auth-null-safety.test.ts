import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Supabase to simulate missing env vars (returns null client)
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('auth.ts null safety', () => {
  beforeEach(() => {
    vi.resetModules();
    // Simulate missing Supabase env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('createServerSupabaseClient returns null when env vars are missing', async () => {
    const { createServerSupabaseClient } = await import('@/lib/auth');
    const client = await createServerSupabaseClient();
    expect(client).toBeNull();
  });

  it('getSession returns null when supabase client is null', async () => {
    const { getSession } = await import('@/lib/auth');
    const session = await getSession();
    expect(session).toBeNull();
  });

  it('getAuthUser returns null when supabase client is null', async () => {
    const { getAuthUser } = await import('@/lib/auth');
    const user = await getAuthUser();
    expect(user).toBeNull();
  });

  it('getCurrentUser returns null when supabase client is null', async () => {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it('canAccessStudent returns false when supabase client is null', async () => {
    const { canAccessStudent } = await import('@/lib/auth');
    const result = await canAccessStudent('some-id');
    expect(result).toBe(false);
  });

  it('canAccessEnrollment returns false when supabase client is null', async () => {
    const { canAccessEnrollment } = await import('@/lib/auth');
    const result = await canAccessEnrollment('some-id');
    expect(result).toBe(false);
  });
});
