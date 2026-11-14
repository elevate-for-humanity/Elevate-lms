// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  profile: { role: 'admin', is_active: true, suspended: false } as Record<string, unknown>,
  lookupError: null as null | { message: string },
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => client }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => client,
  createAdminClient: () => client,
}));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined }),
}));

const client = {
  auth: {
    getUser: async () => ({
      data: { user: { id: 'current-user', email: 'user@example.invalid' } },
      error: null,
    }),
  },
  from: (table: string) => {
    const result = {
      data:
        table === 'profiles'
          ? state.profile
          : table === 'user_roles'
            ? [{ roles: { name: 'super_admin' } }]
            : [],
      error: state.lookupError,
    };
    const query = {
      select: (_columns: string) => query,
      eq: (_column: string, _value: string) => query,
      maybeSingle: async () => result,
      then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    };
    return query;
  },
};
import { requireRole, hasRole } from '@/lib/auth/require-role';
import { requireApiRole } from '@/lib/auth/require-api-role';
import { requireAuth } from '@/lib/auth/requireAuth';
import { apiAuthGuard } from '@/lib/admin/guards';

beforeEach(() => {
  state.profile = { role: 'admin', is_active: true, suspended: false };
  state.lookupError = null;
});
describe('current account status overrides primary and secondary authority', () => {
  it.each([
    { is_active: false, suspended: false },
    { is_active: true, suspended: true },
  ])('denies disabled account %j', async (flags) => {
    Object.assign(state.profile, flags);
    await expect(requireRole(['admin'])).rejects.toThrow('REDIRECT:/unauthorized');
    expect(await hasRole('admin')).toBe(false);
    expect(((await requireApiRole(['admin'])) as Response).status).toBe(401);
    expect((await requireAuth()).user).toBeNull();
    const guarded = await apiAuthGuard();
    expect(guarded.error?.status).toBe(401);
    expect(guarded.effectiveRoles).toEqual([]);
  });
  it('preserves active authorized access', async () => {
    expect((await requireRole(['admin'])).user.id).toBe('current-user');
    expect(await hasRole('admin')).toBe(true);
    expect((await requireAuth()).user?.id).toBe('current-user');
    expect((await apiAuthGuard()).effectiveRoles).toContain('admin');
    expect('user' in (await requireApiRole(['admin']))).toBe(true);
  });
  it('fails closed on profile lookup errors', async () => {
    state.lookupError = { message: 'database unavailable' };
    await expect(requireRole(['admin'])).rejects.toThrow('ROLE_LOOKUP_UNAVAILABLE');
    expect(await hasRole('admin')).toBe(false);
    expect((await requireAuth()).user).toBeNull();
    expect((await apiAuthGuard()).error?.status).toBe(500);
  });
});
