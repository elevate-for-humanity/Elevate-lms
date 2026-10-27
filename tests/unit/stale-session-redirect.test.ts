// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const { getUser, createClient } = vi.hoisted(() => ({ getUser: vi.fn(), createClient: vi.fn() }));
vi.mock('@/lib/supabase/middleware', () => ({
  hasSupabaseAuthCookie: (req: NextRequest) => req.cookies.has('sb-project-auth-token'),
  createMiddlewareSupabaseClient: createClient,
}));
import { middleware } from '../../apps/lms/middleware';

beforeEach(() => {
  vi.clearAllMocks();
  createClient.mockImplementation((_req, setAll) => {
    getUser.mockImplementation(async () => {
      setAll([{ name: 'sb-project-auth-token', value: '', options: { path: '/', maxAge: 0 } }]);
      return { data: { user: null }, error: { code: 'refresh_token_not_found' } };
    });
    return { auth: { getUser } };
  });
});

describe('LMS stale-session response', () => {
  it('expires the stale cookie on the login redirect, so the browser cannot repeat it', async () => {
    const response = await middleware(new NextRequest('https://app.elevateforhumanity.org/learner/dashboard', {
      headers: { cookie: 'sb-project-auth-token=stale' },
    }));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.cookies.get('sb-project-auth-token')?.value).toBe('');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });
  it('does not attempt refresh for anonymous requests', async () => {
    const response = await middleware(new NextRequest('https://app.elevateforhumanity.org/learner/dashboard'));
    expect(response.status).toBe(307);
    expect(createClient).not.toHaveBeenCalled();
  });
  it('preserves authenticated navigation and rotated cookies', async () => {
    createClient.mockImplementation((_req, setAll) => ({ auth: { getUser: async () => {
      setAll([{ name: 'sb-project-auth-token', value: 'rotated', options: { path: '/' } }]);
      return { data: { user: { id: 'student' } }, error: null };
    } } }));
    const response = await middleware(new NextRequest('https://app.elevateforhumanity.org/learner/dashboard', {
      headers: { cookie: 'sb-project-auth-token=valid' },
    }));
    expect(response.status).toBe(200);
    expect(response.cookies.get('sb-project-auth-token')?.value).toBe('rotated');
  });
});
