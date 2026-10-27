import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const state = vi.hoisted(() => ({ assigned: true, error: false, calls: [] as unknown[][] }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: async () => ({ user: { id: 'instructor' }, profile: { full_name: 'Instructor' }, effectiveRoles: ['instructor'] }) }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (table: string) => {
  const query: any = {
    select: (fields: string) => { state.calls.push([table, 'select', fields]); return query; },
    eq: (...args: unknown[]) => { state.calls.push([table, 'eq', ...args]); return query; },
    in: (...args: unknown[]) => { state.calls.push([table, 'in', ...args]); return query; },
    order: () => query, limit: () => query,
    then: (resolve: (value: unknown) => unknown) => {
      const data: Record<string, unknown[]> = {
        program_instructors: state.assigned ? [{ program_id: 'program' }] : [],
        program_enrollments: [{ id: 'enrollment', user_id: 'learner', status: 'active', profiles: { id: 'learner', full_name: 'Learner' }, programs: { title: 'Program' }, program_id: 'program' }],
        competency_log: [{ id: 'ojt', student_id: 'learner', created_at: '2026-10-27' }],
        barber_instructor_signoffs: [{ id: 'signoff', student_id: 'learner', signoff_type: 'module_completion' }],
        profiles: [{ id: 'learner', full_name: 'Review learner', email: 'learner@example.invalid' }],
      };
      return Promise.resolve({ data: data[table] ?? [], count: 0, error: state.error && table === 'competency_log' ? { message: 'Unavailable' } : null }).then(resolve);
    },
  };
  return query;
} }) }));
import InstructorDashboard from '@/apps/admin/app/instructor/dashboard/page';
beforeEach(() => { state.assigned = true; state.error = false; state.calls = []; });
afterEach(cleanup);
it('loads each review with its real learner key and hydrates the learner identity', async () => {
  render(await InstructorDashboard());
  expect(screen.getAllByText('Review learner')).toHaveLength(2);
  expect(state.calls).toContainEqual(['competency_log', 'in', 'apprentice_id', ['learner']]);
  expect(state.calls).toContainEqual(['barber_instructor_signoffs', 'in', 'user_id', ['learner']]);
  expect(state.calls).toContainEqual(['profiles', 'in', 'id', ['learner']]);
});
it('does not query review records when the instructor has no assigned learners', async () => {
  state.assigned = false;
  render(await InstructorDashboard());
  expect(screen.queryByText('Review learner')).not.toBeInTheDocument();
  expect(state.calls.some(call => ['competency_log', 'barber_instructor_signoffs'].includes(String(call[0])))).toBe(false);
});
it('surfaces a failed review read instead of a false empty work list', async () => {
  state.error = true;
  await expect(InstructorDashboard()).rejects.toThrow('Unable to load pending instructor reviews');
});
