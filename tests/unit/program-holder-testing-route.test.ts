vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ context: null as any, saved: null as any, mismatch: false, mode: 'holder', missingTerms: false, transactions: [] as any[], existing: false, failure: '', unsigned: false, features: {} as any, signed: false }));
vi.mock('@/lib/auth/require-program-holder', () => ({ requireProgramHolder: async () => ({ ...state.context, mode: state.mode }) }));
import { POST } from '@/apps/lms/app/api/program-holder/testing-reports/route';
const studentId = '11111111-1111-4111-8111-111111111111';
const evidenceId = '22222222-2222-4222-8222-222222222222';
const body = { enrollmentId: studentId, start: '2026-01-01', end: '2026-01-28', hours: 24, exam: 'Credential exam', coursework: 'Completed assigned coursework', assessments: 'Assessment A: 90 percent', practical_skills: 'Verified by instructor', summary: 'Ready for review', certified: true, evidenceIds: [evidenceId] };
const request = () => ({ json: async () => body }) as Request;
beforeEach(() => {
  Object.assign(state, { saved: null, mismatch: false, mode: 'holder', missingTerms: false, transactions: [], existing: false, failure: '', unsigned: false, features: { compensation: { model: 'fixed_amount_per_funded_student', amount_cents:120000 } }, signed: false });
  state.context = { holderId: 'holder', profile: { id: 'owner', full_name: 'Instructor' }, user: { id: 'owner' }, programIds: ['program'], db: { from(table: string) {
    let insert: any; const filters: any[] = [];
    const q: any = { select: () => q, eq: (k: string,v: any) => { filters.push([k,v]);return q; }, is: () => q, in: () => q, contains: () => q, limit: () => q, maybeSingle: () => q, single: () => q, insert: (row: any) => { insert = row;return q; }, then: (resolve: any) => {
      if (table === state.failure) return Promise.resolve({ data: null, error: { message: 'unavailable' } }).then(resolve);
      let data: any = null;
      if (table === 'program_enrollments') { expect(filters).toContainEqual(['program_holder_id', 'holder']);data = { id: studentId, full_name: 'Student', program_id: 'program' }; }
      if (table === 'program_holder_documents') { expect(filters).toContainEqual(['user_id', 'owner']);data = [{ id: evidenceId, file_name: 'assessment.pdf', description: JSON.stringify({ enrollment_id: state.mismatch ? 'another-student' : studentId }) }]; }
      if (table === 'programs') data = { title: 'Bookkeeping', total_hours: 24 };
      if (table === 'payout_schedules') data = state.missingTerms ? null : { id:'s',total_payout_cents:120000,increment_1_cents:60000,increment_2_cents:60000,increment_1_status:'paid',increment_2_status:'pending' };
      if (table === 'program_holder_payout_transactions') data = state.transactions;
      if (table === 'program_holders') data = { mou_signed: !state.unsigned, features: state.features };
      if (table === 'license_agreement_acceptances') { expect(filters).toContainEqual(['agreement_type','program_holder_mou']);expect(filters.some(([key]) => key === 'document_version')).toBe(true);data = state.signed ? [{ id:'acceptance' }] : []; }
      if (table === 'program_holder_reports') { if (insert) { state.saved = insert;data = { id: 'report' }; } else data = state.existing ? { id: 'existing', status: 'submitted' } : null; }
      return Promise.resolve({ data, error: null }).then(resolve);
    } }; return q;
  } } };
});
it('saves the exact report with a student-specific draft and no completion or payment writes', async () => {
  expect((await POST(request())).status).toBe(201);
  expect(state.saved.content).toContain('Assessment names, dates, and actual scores: Assessment A: 90 percent');
  expect(state.saved.metadata.completion_invoice).toMatchObject({ amount_cents: 60000, transfer_allowed: false, payment_status: 'not_submitted' });
  expect(state.saved.metadata.payment_execution).toBe('blocked_pending_authorized_review');
});
it('rejects evidence belonging to another student', async () => { state.mismatch = true;expect((await POST(request())).status).toBe(400);expect(state.saved).toBeNull(); });
it('accepts an exit report without inventing missing compensation', async () => { state.missingTerms = true;expect((await POST(request())).status).toBe(201);expect(state.saved.metadata.completion_invoice.amount_cents).toBeNull(); });
it('blocks calculations with unsigned terms', async () => { state.unsigned = true;await POST(request());expect(state.saved.metadata.completion_invoice.amount_cents).toBeNull(); });
it('accounts for a confirmed full upfront payment', async () => { state.transactions = [{ installment:1,amount_cents:120000,status:'paid' }];await POST(request());expect(state.saved.metadata.completion_invoice.amount_cents).toBe(0); });
it('returns the existing pending report on retry', async () => { state.existing = true;expect((await (await POST(request())).json()).alreadySubmitted).toBe(true);expect(state.saved).toBeNull(); });
it('fails closed when payment history cannot be read', async () => { state.failure = 'program_holder_payout_transactions';expect((await POST(request())).status).toBe(503);expect(state.saved).toBeNull(); });
it('denies administrative previews a submission', async () => { state.mode = 'preview';expect((await POST(request())).status).toBe(403);expect(state.saved).toBeNull(); });

it('requires individual terms even when a legacy schedule exists', async () => { state.features={};await POST(request());expect(state.saved.metadata.completion_invoice.amount_cents).toBeNull(); });
it('blocks a schedule that conflicts with the individual total', async () => { state.features.compensation.amount_cents=186750;await POST(request());expect(state.saved.metadata.completion_invoice.amount_cents).toBeNull(); });
it('checks acceptance of the exact payment addendum version', async () => {
 state.features={payment_addendum:{title:'Individual terms',paragraphs:['Terms'],checklist:['Review'],total_cents:120000,start_cents:60000,completion_cents:60000}};
 await POST(request());expect(state.saved.metadata.completion_invoice.amount_cents).toBeNull();
 state.signed=true;await POST(request());expect(state.saved.metadata.completion_invoice.amount_cents).toBe(60000);
});
it('does not ignore historical manual or bank payments outside the normalized ledger', async () => {
 state.features.student_payment_review={students:[{enrollment_id:studentId,status:'Paid — bank verified'}]};await POST(request());expect(state.saved.metadata.completion_invoice.amount_cents).toBeNull();
});

it('rejects malformed record IDs before reading student data', async () => {
 const result=await POST({json:async()=>({...body,enrollmentId:'-'.repeat(36)})} as Request);expect(result.status).toBe(400);expect(state.saved).toBeNull();
});
it('does not calculate a request from a malformed unversioned addendum', async () => {
 state.features={payment_addendum:{total_cents:120000,start_cents:60000,completion_cents:60000}};await POST(request());expect(state.saved.metadata.completion_invoice.amount_cents).toBeNull();
});
it('holds pending individual terms when no versioned acceptance can be checked', async () => {
 state.features={compensation_terms:{per_student_total_cents:120000,start_installment_cents:60000,completion_installment_cents:60000,effective_status:'pending signed payment addendum'}};await POST(request());expect(state.saved.metadata.completion_invoice.amount_cents).toBeNull();
});
