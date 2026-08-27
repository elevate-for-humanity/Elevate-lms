import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getUser, maybeSingle } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  }),
}));

import { getCurrentUserWithRole, requireRoleLevel } from '@/lib/rbac';

beforeEach(() => {
  getUser.mockReset();
  maybeSingle.mockReset();
});

describe('RBAC data boundaries', () => {
  it('omits an unavailable authentication email', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    maybeSingle.mockResolvedValue({
      data: { id: 'user-1', role: 'admin', full_name: 'Admin', email: null },
      error: null,
    });

    const { user } = await getCurrentUserWithRole();

    expect(user).toEqual({ id: 'user-1', role: 'admin' });
    expect(user).not.toHaveProperty('email');
  });

  it('rejects an unknown persisted role from hierarchy checks', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-2', email: 'user@example.com' } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { id: 'user-2', role: 'unknown_role', full_name: 'User', email: 'user@example.com' },
      error: null,
    });

    await expect(requireRoleLevel('student')).rejects.toThrow('FORBIDDEN');
  });

  it('rejects an unknown required hierarchy level', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-3', email: 'admin@example.com' } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { id: 'user-3', role: 'admin', full_name: 'Admin', email: 'admin@example.com' },
      error: null,
    });

    await expect(requireRoleLevel('invented_role')).rejects.toThrow('FORBIDDEN');
  });
});
