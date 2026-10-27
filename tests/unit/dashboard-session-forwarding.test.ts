// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ cookie: true, rotate: true }));
vi.mock('@/lib/api/admin-ip-guard', () => ({ checkAdminIP: () => null }));
vi.mock('@/lib/auth/privileged-mfa', () => ({
  PRIVILEGED_MFA_ROLES: [],
  privilegedMfaEnforcementEnabled: () => false,
}));
vi.mock('@/lib/supabase/middleware', () => ({
  hasSupabaseAuthCookie: () => state.cookie,
  createMiddlewareSupabaseClient: (_req: unknown, setAll: Function) => ({
    auth: {
      getUser: async () => {
        if (state.rotate)
          setAll([{ name: 'sb-project-auth-token', value: 'rotated', options: { path: '/' } }]);
        return { data: { user: { id: 'admin' } }, error: null };
      },
    },
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          table === 'profiles'
            ? { maybeSingle: async () => ({ data: { role: 'admin' }, error: null }) }
            : Promise.resolve({ data: [], error: null }),
      }),
    }),
  }),
}));
import { middleware as adminMiddleware } from '@/apps/admin/middleware';
import { middleware as lmsMiddleware } from '@/apps/lms/middleware';
beforeEach(() => {
  state.cookie = true;
  state.rotate = true;
});
describe('dashboard session continuity', () => {
  for (const [name, middleware, route] of [
    ['Admin', adminMiddleware, '/apprenticeships'],
    ['LMS', lmsMiddleware, '/apprentice/dashboard'],
  ] as const) {
    it(`${name} forwards refreshed cookies to the current page and browser`, async () => {
      const request = new NextRequest(`https://admin.elevateforhumanity.org${route}`, {
        headers: { cookie: 'sb-project-auth-token=expired' },
      });
      const response = await middleware(request);
      expect(response.headers.get('x-middleware-request-cookie')).toContain(
        'sb-project-auth-token=rotated',
      );
      expect(response.cookies.get('sb-project-auth-token')?.value).toBe('rotated');
    });
  }
  it('returns JSON 401 for an anonymous approval API request instead of redirecting to HTML', async () => {
    state.cookie = false;
    const response = await adminMiddleware(
      new NextRequest(
        'https://admin.elevateforhumanity.org/api/admin/apprenticeships/pending-hours',
      ),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get('location')).toBeNull();
    expect(await response.json()).toMatchObject({ error: 'AUTH_REQUIRED' });
  });
});
