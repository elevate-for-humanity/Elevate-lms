import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const scope = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/require-role', () => ({ requireRole: async () => ({}) }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (table: string) => {
  if (table !== 'participant_report') throw new Error('Unexpected reporting authority');
  const q: any = { select: () => q, eq: (...args: unknown[]) => { scope(...args); return q; }, order: () => q,
    range: async () => ({ error: null, data: [{ enrollment_id: 'enrollment', participant_id: 'learner', full_name: 'JRI Learner', email: 'learner@example.invalid', program_title: 'HVAC', enrollment_status: 'completed', enrolled_at: '2026-10-01', placement_status: 'verified' }] }),
  }; return q;
} }) }));
import JRIReportsPage from '@/apps/admin/app/jri/reports/page';
afterEach(cleanup);
it('renders canonical JRI records and connects every export control to a scoped CSV route', async () => {
  render(await JRIReportsPage());
  expect(scope).toHaveBeenCalledWith('funding_source', 'jri');
  expect(screen.getByText('JRI Learner')).toBeInTheDocument();
  expect(screen.getByText('1 of 1 learners')).toBeInTheDocument();
  const exports = screen.getAllByRole('link', { name: 'Export CSV' });
  expect(exports).toHaveLength(3);
  expect(exports[0]).toHaveAttribute('href', '/api/reports/participants/export?funding=jri');
  expect(exports[1]).toHaveAttribute('href', '/api/reports/participants/export?funding=jri&status=completed');
});
