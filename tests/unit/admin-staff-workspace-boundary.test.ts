// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ role: 'staff' }));
vi.mock('@/lib/supabase/middleware', () => ({
  hasSupabaseAuthCookie: () => true,
  createMiddlewareSupabaseClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'staff-user' } }, error: null }) },
    from: (table: string) => ({ select: () => ({ eq: () => table === 'profiles'
      ? { maybeSingle: async () => ({ data: { role: state.role } }) }
      : Promise.resolve({ data: [{ roles: { name: 'student' } }] }) }) }),
  }),
}));
vi.mock('@/lib/api/admin-ip-guard', () => ({ checkAdminIP: () => null }));
vi.mock('@/lib/auth/privileged-mfa', () => ({ PRIVILEGED_MFA_ROLES: ['admin', 'super_admin'], privilegedMfaEnforcementEnabled: () => false }));
import { middleware } from '@/apps/admin/middleware';
beforeEach(() => { state.role = 'staff'; });
describe('staff authorization boundary', () => {
  it.each(['/students', '/programs', '/hr/payroll', '/settings'])('denies staff direct access to %s', async path => {
    const response = await middleware(new NextRequest('https://admin.elevateforhumanity.org' + path));
    expect(response.headers.get('location')).toBe('https://admin.elevateforhumanity.org/unauthorized');
  });
  it('denies privileged Admin APIs for a staff and student account', async () => {
    const response = await middleware(new NextRequest('https://admin.elevateforhumanity.org/api/admin/impersonate'));
    expect(response.status).toBe(403);
  });
  it.each(['/staff-portal/dashboard', '/staff-portal/courses', '/api/staff/my-students', '/dashboard'])('retains the authorized staff surface %s', async path => {
    const response = await middleware(new NextRequest('https://admin.elevateforhumanity.org' + path));
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
  it('retains platform administrator access', async () => {
    state.role = 'admin';
    const response = await middleware(new NextRequest('https://admin.elevateforhumanity.org/students'));
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
