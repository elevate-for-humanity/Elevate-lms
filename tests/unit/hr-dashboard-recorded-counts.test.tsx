import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const state = vi.hoisted(() => ({ failed: '' }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: async () => ({}) }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (table: string) => {
  let head = false; let active = false;
  const q: any = { select: (_fields: string, options?: { head?: boolean }) => { head = options?.head ?? false; return q; }, eq: (key: string, value: unknown) => { active = key === 'status' && value === 'active'; return q; }, in: () => q, order: () => q, limit: () => q,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({
      data: table === 'employees' && !head ? [{ id: 'employee', first_name: 'Sample', last_name: 'Employee', department_id: 'department', role: 'Instructor', status: 'active' }] : table === 'departments' ? [{ id: 'department', name: 'Education' }] : [],
      count: table === 'employees' ? active ? 41 : 50 : 0,
      error: state.failed === table ? { message: 'Unavailable' } : null,
    }).then(resolve),
  }; return q;
} }) }));
import HRPage from '@/apps/admin/app/hr/page';
beforeEach(() => { state.failed = ''; });
afterEach(cleanup);
it('uses the full active count rather than counting the recent roster sample', async () => {
  render(await HRPage());
  expect(screen.getByText('41 active')).toBeInTheDocument();
  expect(screen.getByText('Education · Instructor')).toBeInTheDocument();
  expect(screen.getByText('Departments of Recent Employees')).toBeInTheDocument();
});
it('does not render false empty HR statistics when a source fails', async () => {
  state.failed = 'payroll_runs';
  await expect(HRPage()).rejects.toThrow('Unable to load HR dashboard');
});
