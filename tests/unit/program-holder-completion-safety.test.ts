import { describe, expect, it } from 'vitest';
import { completionInvoiceDraft } from '@/lib/program-holder/completion-invoice';
import { hasRecruitingAssignment } from '@/lib/program-holder/recruiting-access';
import { curriculumProgress } from '@/lib/program-holder/curriculum-progress';
import { evidenceEnrollment, testingReportToday, isHolderRecordId } from '@/lib/program-holder/testing-report';
import { materialUploadPolicy } from '@/lib/program-holder/material-upload';
const terms = { id: 'schedule', total_payout_cents: 120000, increment_1_cents: 60000, increment_2_cents: 60000, increment_1_status: 'paid', increment_2_status: 'pending' };
describe('Holder agreement and payment safeguards', () => {
  it('honors Carlina’s 600/600 arrangement', () => expect(completionInvoiceDraft(terms, [], 'r').amount_cents).toBe(60000));
  it('keeps Crystal’s documented full upfront schedule from creating a completion installment', () => expect(completionInvoiceDraft({ ...terms, increment_1_cents: 120000, increment_2_cents: 0 }, [], 'r').amount_cents).toBe(0));
  it('deducts a confirmed full upfront payment even under an older split schedule', () => expect(completionInvoiceDraft(terms, [{ installment: 1, amount_cents: 120000, status: 'paid' }], 'r').amount_cents).toBe(0));
  it('holds any pending upfront transfer', () => expect(completionInvoiceDraft(terms, [{ installment: 1, status: 'processing' }], 'r').status).toBe('payment_in_progress'));
  it('does not double-count schedule flags and matching ledger payments', () => expect(completionInvoiceDraft(terms, [{ installment: 1, amount_cents: 60000, status: 'paid' }], 'r').amount_cents).toBe(60000));
  it('blocks inconsistent installment allocations', () => expect(completionInvoiceDraft({ ...terms, total_payout_cents: 150000 }, [], 'r').amount_cents).toBeNull());
  it('blocks unknown or overpaid historical payments', () => {
    for (const transaction of [{ installment: null, amount_cents: 60000, status: 'paid' }, { installment: 1, amount_cents: 150000, status: 'paid' }, { installment: 1, amount_cents: 60000, status: 'reversed' }])
      expect(completionInvoiceDraft(terms, [transaction], 'r').amount_cents).toBeNull();
  });
  it('never authorizes a transfer from report submission', () => expect(completionInvoiceDraft(terms, [], 'r').transfer_allowed).toBe(false));
});
describe('Scoped holder workspace', () => {
  it('does not grant recruiting from a role label or all-applicant flag', () => {
    expect(hasRecruitingAssignment({ approved_role: 'Program Holder', all_applicant_access: true })).toBe(false);
    expect(hasRecruitingAssignment({ recruiting_enabled: true })).toBe(true);
    expect(hasRecruitingAssignment({ regional_assignment: { all_programs_in_region: true } })).toBe(true);
  });
  it('keeps completed build distinct from publication', () => {
    expect(curriculumProgress({ generation_status: 'completed', generation_progress: 100, status: 'draft' })).toMatchObject({ percent: 100, published: false });
    expect(curriculumProgress(null)).toMatchObject({ percent: null, published: false });
    expect(curriculumProgress({ generation_status: 'generating', generation_progress: 45, generation_paused: true })).toMatchObject({ status: 'Paused', percent: 45 });
  });
  it('does not infer evidence student identity from a filename', () => {
    expect(evidenceEnrollment('Crystal Sims.pdf')).toBeNull();
    expect(evidenceEnrollment(JSON.stringify({ enrollment_id: 'student' }))).toBe('student');
  });
  it('accepts curriculum files by matching type and extension, with bounded size', () => {
    expect(materialUploadPolicy('lab_tracker', { name: 'lab.xlsx', type: '', size: 50 })?.allowed).toBe(true);
    expect(materialUploadPolicy('textbook', { name: 'book.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 50 })?.allowed).toBe(true);
    expect(materialUploadPolicy('lab_tracker', { name: 'lab.xlsx', type: 'text/html', size: 50 })?.allowed).toBe(false);
    expect(materialUploadPolicy('textbook', { name: 'book.docx', type: '', size: 51 * 1024 * 1024 })?.allowed).toBe(false);
  });
});

it.each(['released','processing','held'])('blocks a %s schedule even without a matching transaction row', status => {
 expect(completionInvoiceDraft({...terms,increment_1_status:status},[],'r').amount_cents).toBeNull();
});

it('uses the reporting timezone at the UTC date boundary', () => {
 expect(testingReportToday(new Date('2026-10-29T01:00:00Z'))).toBe('2026-10-28');
 expect(isHolderRecordId('-'.repeat(36))).toBe(false);
});
