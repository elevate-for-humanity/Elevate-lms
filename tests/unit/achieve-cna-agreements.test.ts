import { expect, it } from 'vitest';
import { achieveCnaAgreements, achieveDocumentVersion, hasCurrentAchieveSignature } from '@/lib/program-holder/achieve-cna-agreements';

const packet = {
  mou: 'Final MOU fixture',
  nda: 'Separate NDA fixture',
  approval_reference: 'Reviewed packet fixture',
  schedule_a: {
    collecting_party: 'Test collector',
    disbursement_method: 'Test method',
    invoice_evidence: 'Test evidence',
    invoice_due_dates: 'Test due dates',
    payment_timing: 'Test timing',
    refund_allocation: 'Test allocation',
  },
};

it('blocks signing until the finalized packet includes all Schedule A terms', () => {
  expect(achieveCnaAgreements({ full_forms_status: 'review_pending' })).toBeNull();
  expect(achieveCnaAgreements({
    achieve_cna_agreements: { ...packet, schedule_a: { ...packet.schedule_a, refund_allocation: '  ' } },
  })).toBeNull();
});

it('binds each signature to its own agreement and the current packet', () => {
  const approved = achieveCnaAgreements({ achieve_cna_agreements: packet })!;
  const features = {
    achieve_cna_signed_mou: { version: achieveDocumentVersion('mou', approved.digest), acceptance_id: 'mou-receipt' },
    nda: true,
  };
  expect(hasCurrentAchieveSignature(features, 'mou', approved.digest)).toBe(true);
  expect(hasCurrentAchieveSignature(features, 'nda', approved.digest)).toBe(false);
  const revised = achieveCnaAgreements({ achieve_cna_agreements: {
    ...packet, schedule_a: { ...packet.schedule_a, payment_timing: 'Revised timing' },
  } })!;
  expect(hasCurrentAchieveSignature(features, 'mou', revised.digest)).toBe(false);
});
