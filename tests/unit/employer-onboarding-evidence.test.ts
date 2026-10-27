import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ expired: false, missingFile: false, parentApproved: true, pending: false, update: vi.fn(), email: vi.fn(), filters: [] as unknown[][] }));
vi.mock('@/lib/jobs/enqueue-email', () => ({ enqueueEmail: state.email }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn() } }));
import { checkOnboardingComplete, tryAutoActivate } from '@/lib/employer/check-onboarding-complete';
const documents = ['coi_general_liability', 'coi_workers_comp', 'business_license', 'ein_verification', 'supervisor_designation', 'employer_mou'];
const db: any = { from: (table: string) => {
  const q: any = { select: () => q, eq: (...args: unknown[]) => { state.filters.push([table, ...args]); return q; }, in: () => q, order: () => q, limit: () => q, update: (values: unknown) => { state.update(values); return q; }, insert: async () => ({ error: null }),
    maybeSingle: async () => ({ data: table === 'employers' ? { id: 'business-id', owner_user_id: 'login-id', approved: state.parentApproved, business_name: 'Business', contact_name: 'Owner', contact_email: 'owner@example.invalid' } : { id: 'onboarding', status: 'approved', hiring_needs: { job_title: 'Technician' } }, error: null }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === 'documents' ? documents.map((type, index) => ({ document_type: type, status: state.pending && index === 0 ? 'pending' : 'approved', file_path: state.missingFile && index === 0 ? null : `protected/${type}.pdf`, expiration_date: state.expired && index === 0 ? '2020-01-01' : null })) : [], error: null }).then(resolve),
  }; return q;
} };
beforeEach(() => { state.expired = false; state.missingFile = false; state.parentApproved = true; state.pending = false; state.filters = []; state.update.mockClear(); state.email.mockClear(); state.email.mockResolvedValue('mail-job'); });
it('resolves the business key separately from the owner documents and schedules the supported welcome job', async () => {
  expect(await tryAutoActivate(db, 'login-id')).toBe(true);
  expect(state.filters).toContainEqual(['employer_onboarding', 'employer_id', 'business-id']);
  expect(state.filters).toContainEqual(['documents', 'user_id', 'login-id']);
  expect(state.email).toHaveBeenCalledWith(expect.objectContaining({ emailType: 'employer_activated', to: 'owner@example.invalid', correlationId: 'employer-activated:onboarding' }));
});
it.each(['expired', 'missingFile', 'pending'] as const)('does not activate with %s document evidence', async condition => {
  state[condition] = true;
  expect((await checkOnboardingComplete(db, 'login-id')).complete).toBe(false);
  expect(await tryAutoActivate(db, 'login-id')).toBe(false);
  expect(state.update).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  expect(state.email).not.toHaveBeenCalled();
});
it('cannot activate an employer whose business approval is missing', async () => {
  state.parentApproved = false;
  expect(await tryAutoActivate(db, 'login-id')).toBe(false);
  expect(state.update).not.toHaveBeenCalled();
});
