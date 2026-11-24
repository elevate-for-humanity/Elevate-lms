import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ eligibility: 'eligible', payment: 'paid', writes: [] as string[] }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'admin' } } }) },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: 'admin' } }) }) }) }),
}) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => {
  let writing = false;
  const q = {
    select: () => q, eq: () => q,
    update: () => { writing = true; return q; },
    maybeSingle: async () => ({ data: { id: 'enrollment', student_id: 'learner', eligibility_status: state.eligibility, payment_status: state.payment }, error: null }),
    then: (resolve: (value: unknown) => unknown) => {
      if (writing) state.writes.push(table);
      return Promise.resolve({ data: table === 'enrollment_requirements' ? [{ id: 'requirement', status: 'verified' }] : null, error: null }).then(resolve);
    },
  }; return q;
} }) }));
vi.mock('@/lib/audit', () => ({ writeAdminAuditEvent: vi.fn(async () => {}) }));
vi.mock('@/lib/email/send-internal', () => ({ sendInternalEmail: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/config/platform-config', () => ({ PLATFORM_DEFAULTS: { orgName: 'QA' } }));
import { approveEnrollment } from '@/apps/admin/app/enrollments/actions';
beforeEach(() => { state.eligibility = 'eligible'; state.payment = 'paid'; state.writes = []; });
it.each(['ineligible', 'pending'])('denies paid enrollment with eligibility %s without writes', async eligibility => {
  state.eligibility = eligibility;
  await expect(approveEnrollment('enrollment', 'learner')).rejects.toThrow('eligibility');
  expect(state.writes).toEqual([]);
});
it('retains approval when eligibility is not recorded', async () => {
  // program_enrollments.eligibility_status is never populated (the review
  // writes 'eligible' to applications, not here), so a missing value must
  // not block approval — only an explicitly recorded non-'eligible' value does.
  state.eligibility = '';
  await approveEnrollment('enrollment', 'learner');
  expect(state.writes).toEqual(['program_enrollments', 'profiles']);
});
it('retains approval for eligible paid learners', async () => {
  await approveEnrollment('enrollment', 'learner');
  expect(state.writes).toEqual(['program_enrollments', 'profiles']);
});
it('denies eligible unpaid learners without writes', async () => {
  state.payment = 'pending';
  await expect(approveEnrollment('enrollment', 'learner')).rejects.toThrow('authorization');
  expect(state.writes).toEqual([]);
});
