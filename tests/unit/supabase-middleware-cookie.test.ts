import { describe, expect, it } from 'vitest';
import { hasSupabaseAuthCookie } from '@/lib/supabase/middleware';

function requestWithCookies(cookies: Array<{ name: string; value: string }>) {
  return {
    cookies: {
      getAll: () => cookies,
    },
  } as Parameters<typeof hasSupabaseAuthCookie>[0];
}

describe('Supabase middleware cookie detection', () => {
  it('returns false when no session cookie exists', () => {
    expect(hasSupabaseAuthCookie(requestWithCookies([]))).toBe(false);
    expect(
      hasSupabaseAuthCookie(requestWithCookies([{ name: '__efh_pathname', value: '/dashboard' }])),
    ).toBe(false);
  });

  it('recognizes regular and chunked Supabase auth cookies', () => {
    expect(
      hasSupabaseAuthCookie(
        requestWithCookies([{ name: 'sb-project-auth-token', value: 'session' }]),
      ),
    ).toBe(true);
    expect(
      hasSupabaseAuthCookie(
        requestWithCookies([{ name: 'sb-project-auth-token.1', value: 'chunk' }]),
      ),
    ).toBe(true);
  });

  it('ignores empty or unrelated cookies', () => {
    expect(
      hasSupabaseAuthCookie(
        requestWithCookies([
          { name: 'sb-project-auth-token', value: '   ' },
          { name: 'sb-project-other', value: 'value' },
          { name: 'sb-project-auth-token-code-verifier', value: 'not-a-session' },
        ]),
      ),
    ).toBe(false);
  });
});
