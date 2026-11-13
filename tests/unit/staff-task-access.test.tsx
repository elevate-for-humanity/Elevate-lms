import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  roles: ['staff'] as string[],
  denied: false,
  queries: [] as Array<{ table: string; filters: Array<[string, string, unknown]> }>,
  adminClient: vi.fn(),
}));

vi.mock('@/lib/auth/require-role', () => ({
  requireRole: async () => {
    if (state.denied) throw new Error('access denied');
    return { user: { id: 'staff-1' }, profile: { full_name: 'Staff' }, effectiveRoles: state.roles };
  },
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: () => {
    const query: any = { select: () => query, eq: () => query, order: async () => ({ data: [] }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], count: 0 }).then(resolve) };
    return query;
  } }),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: state.adminClient }));

import StaffTasksPage from '@/apps/admin/app/staff-portal/tasks/page';

beforeEach(() => {
  state.roles = ['staff'];
  state.denied = false;
  state.queries = [];
  state.adminClient.mockReset().mockResolvedValue({ from: (table: string) => {
    const entry = { table, filters: [] as Array<[string, string, unknown]> };
    state.queries.push(entry);
    const query: any = { select: () => query, limit: async () => ({ data: [], error: null }) };
    for (const op of ['eq', 'is', 'neq']) query[op] = (column: string, value: unknown) => {
      entry.filters.push([op, column, value]);
      return query;
    };
    return query;
  } });
});

describe('server-only admissions tasks', () => {
  it('reads only the signed-in staff member application tasks', async () => {
    await StaffTasksPage();
    expect(state.queries).toEqual([{ table: 'tasks', filters: [
      ['eq', 'assigned_to', 'staff-1'], ['eq', 'related_type', 'application'],
    ] }]);
  });

  it('allows an effective admin role to also triage unassigned application tasks', async () => {
    state.roles = ['staff', 'admin'];
    await StaffTasksPage();
    expect(state.queries).toHaveLength(2);
    expect(state.queries[1]).toEqual({ table: 'tasks', filters: [
      ['is', 'assigned_to', null], ['eq', 'related_type', 'application'], ['neq', 'status', 'completed'],
    ] });
  });

  it('does not open the service-role client when authorization fails', async () => {
    state.denied = true;
    await expect(StaffTasksPage()).rejects.toThrow('access denied');
    expect(state.adminClient).not.toHaveBeenCalled();
  });
});
