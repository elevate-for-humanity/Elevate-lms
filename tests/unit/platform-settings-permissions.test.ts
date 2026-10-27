import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as platformGet, POST as platformPost } from '@/apps/admin/app/api/admin/platform-settings/route';
import { GET as settingsGet, POST as settingsPost } from '@/apps/admin/app/api/admin/settings/route';
import { GET as envGet, POST as envPost, DELETE as envDelete } from '@/apps/admin/app/api/admin/env-vars/route';
import { requireAdminClient } from '@/lib/supabase/admin';

const identity = vi.hoisted(() => ({ role: 'staff', secondary: [] as string[], error: false }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'operator', email: 'operator@example.invalid' } }, error: null }) },
  from: (table: string) => {
    const query: any = {
      select: () => query, eq: () => query,
      maybeSingle: async () => ({ data: { role: identity.role }, error: null }),
      then: (resolve: any) => Promise.resolve({ data: identity.secondary.map(name => ({ roles: { name } })), error: identity.error ? { message: 'Unavailable' } : null }).then(resolve),
    };
    if (table !== 'profiles' && table !== 'user_roles') throw new Error('Unexpected authentication query');
    return query;
  },
}) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_name: string, handler: unknown) => handler }));
vi.mock('@/lib/auth/privileged-mfa', () => ({
  PRIVILEGED_MFA_ROLES: ['admin', 'super_admin'],
  privilegedMfaEnforcementEnabled: () => false,
  checkPrivilegedMfa: vi.fn(),
}));

const endpoints = [
  ['platform GET', platformGet, 'GET'], ['platform POST', platformPost, 'POST'],
  ['settings GET', settingsGet, 'GET'], ['settings POST', settingsPost, 'POST'],
  ['environment GET', envGet, 'GET'], ['environment POST', envPost, 'POST'],
  ['environment DELETE', envDelete, 'DELETE'],
] as const;

describe('platform settings use the canonical permission before privileged access', () => {
  beforeEach(() => { identity.role = 'staff'; identity.secondary = []; identity.error = false; vi.mocked(requireAdminClient).mockReset(); });
  for (const role of ['staff', 'org_admin', 'instructor', 'student']) {
    it.each(endpoints)(`${role} is denied by %s`, async (_name, handler, method) => {
      identity.role = role;
      const response = await handler(new NextRequest('https://admin.example.invalid/api', { method }));
      expect(response.status).toBe(403);
      expect(requireAdminClient).not.toHaveBeenCalled();
    });
  }
  it.each(endpoints)('fails closed on secondary-role lookup failure: %s', async (_name, handler, method) => {
    identity.role = 'admin'; identity.error = true;
    const response = await handler(new NextRequest('https://admin.example.invalid/api', { method }));
    expect(response.status).toBe(500);
    expect(requireAdminClient).not.toHaveBeenCalled();
  });
  for (const role of ['admin', 'super_admin']) {
    it(`permits ${role} to read settings`, async () => {
      identity.role = role;
      vi.mocked(requireAdminClient).mockResolvedValue({ from: () => ({ select: () => ({ order: async () => ({ data: [{ key: 'site_name', value: 'Elevate' }], error: null }) }) }) } as never);
      const response = await platformGet(new NextRequest('https://admin.example.invalid/api'));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ site_name: 'Elevate' });
    });
  }
  it('honors a verified secondary admin role', async () => {
    identity.secondary = ['admin'];
    vi.mocked(requireAdminClient).mockResolvedValue({ from: () => ({ select: () => ({ order: async () => ({ data: [], error: null }) }) }) } as never);
    expect((await platformGet(new NextRequest('https://admin.example.invalid/api'))).status).toBe(200);
  });
});
