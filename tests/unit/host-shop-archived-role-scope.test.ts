import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasAnyRole, EMPLOYER_ROLES, PROGRAM_HOLDER_ROLES, HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { scopeArchivedHostShopRoles, requireRole, hasRole } from '@/lib/auth/require-role';
import { apiRequireRoles } from '@/lib/admin/guards';

const auth = vi.hoisted(() => ({
  archived: true,
  role: 'host_shop',
  secondary: 'employer',
  selectedUser: 'host-owner',
  archiveError: false,
  missingProfile: false,
}));
vi.mock('next/navigation', () => ({
  redirect: (href: string) => { throw new Error('REDIRECT:' + href); },
}));
vi.mock('next/headers', () => ({
  headers: async () => ({ get: () => null }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({
      data: { user: { id: auth.selectedUser, email: 'shop-owner@example.org' } },
    }) },
    from: (table: string) => {
      const query: any = {};
      for (const method of ['select', 'eq']) query[method] = () => query;
      query.maybeSingle = async () => ({
        data: table === 'profiles' && !auth.missingProfile ? { id: auth.selectedUser, role: auth.role, is_active: true } : null,
        error: null,
      });
      query.then = (resolve: (value: unknown) => void) => Promise.resolve({
        data: table === 'user_roles'
          ? [{ roles: { name: auth.secondary } }]
          : table === 'partner_users'
            ? [{ partner_id: 'own-partner', role: 'partner_admin', status: 'active' }]
            : [],
        error: null,
      }).then(resolve);
      return query;
    },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      if (table !== 'program_holders') throw new Error('Unexpected admin DB read');
      const query: any = {};
      query.select = () => query;
      query.eq = () => query;
      query.then = (resolve: (value: unknown) => void) => Promise.resolve({
        data: auth.archived ? [{ features: { portal_access_archived: true } }] : [],
        error: auth.archiveError ? { code: '42501' } : null,
      }).then(resolve);
      return query;
    },
  }),
}));

describe('archived Program Holder is strictly Host Shop-only', () => {
  beforeEach(() => { auth.archived = true; auth.role = 'host_shop'; auth.secondary = 'employer'; auth.archiveError = false; auth.missingProfile = false; });

  it('retains only Host Shop effective permissions for an archived account', () => {
    const effective = scopeArchivedHostShopRoles(['host_shop','employer','program_holder'], 'host_shop', true);
    expect(effective).toEqual(['host_shop']);
    expect(hasAnyRole(effective, HOST_SHOP_ROLES)).toBe(true);
    expect(hasAnyRole(effective, EMPLOYER_ROLES)).toBe(false);
    expect(hasAnyRole(effective, PROGRAM_HOLDER_ROLES)).toBe(false);
  });

  it('does not alter other non-archived or platform-admin accounts', () => {
    expect(scopeArchivedHostShopRoles(['host_shop','employer'], 'host_shop', false))
      .toEqual(['host_shop','employer']);
    expect(scopeArchivedHostShopRoles(['admin','host_shop'], 'admin', true))
      .toEqual(['admin','host_shop']);
  });

  it('allows the archived owner into Host Shop with no inherited employer grants', async () => {
    const result = await requireRole(['host_shop']);
    expect(result.effectiveRoles).toEqual(['host_shop']);
    expect(await hasRole('host_shop')).toBe(true);
  });

  it('denies actual Employer and Program Holder route guards despite stored employer role', async () => {
    await expect(requireRole(['employer'])).rejects.toThrow('REDIRECT:/unauthorized');
    await expect(requireRole(['program_holder'])).rejects.toThrow('REDIRECT:/unauthorized');
    expect(await hasRole('employer')).toBe(false);
    expect(await hasRole('program_holder')).toBe(false);
  });

  it('preserves genuine dual-role grants at other, non-archived shops', async () => {
    auth.archived = false;
    const result = await requireRole(['employer']);
    expect(result.effectiveRoles).toContain('employer');
    expect(result.effectiveRoles).toContain('host_shop');
    expect(await hasRole('employer')).toBe(true);
  });

  it('denies privileged APIs despite legacy administrator grants on an archived shop owner', async () => {
    auth.secondary = 'admin';
    const result = await apiRequireRoles(undefined, ['admin', 'super_admin']);
    expect(result.error?.status).toBe(403);
    expect(result.effectiveRoles).toEqual(['host_shop']);
  });

  it('fails closed when the archive scope cannot be checked', async () => {
    auth.secondary = 'admin';
    auth.archiveError = true;
    const result = await apiRequireRoles(undefined, ['admin', 'super_admin']);
    expect(result.error).toBeDefined();
    expect(result.effectiveRoles).toEqual([]);
  });

  it('denies secondary grants when the canonical profile is missing', async () => {
    auth.secondary = 'admin';
    auth.missingProfile = true;
    const result = await apiRequireRoles(undefined, ['admin', 'super_admin']);
    expect(result.error?.status).toBe(401);
    expect(result.effectiveRoles).toEqual([]);
  });
});
