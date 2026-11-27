import { expect, it } from 'vitest';
import { achieveCnaAgreements, achieveDocumentVersion, hasCurrentAchieveSignature } from '@/lib/program-holder/achieve-cna-agreements';

const packet = {
  mou: 'Final MOU fixture',
  nda: 'Separate NDA fixture',
  program_scope: 'Certified Nursing Assistant program only',
  incorporated_terms: 'Approved incorporated program-host terms fixture',
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
  expect(achieveCnaAgreements({
    achieve_cna_agreements: {
      mou: packet.mou,
      nda: packet.nda,
      approval_reference: packet.approval_reference,
      schedule_a: packet.schedule_a,
    },
  })?.signingArtifactComplete).toBe(false);
});

it('binds each signature to its own agreement and the current packet', () => {
  const approved = achieveCnaAgreements({ achieve_cna_agreements: packet })!;
  const features = {
    achieve_cna_agreements: packet,
    achieve_cna_current_revision_id: '11111111-1111-4111-8111-111111111111',
    achieve_cna_signed_mou: {
      version: achieveDocumentVersion('mou', approved.digest, '11111111-1111-4111-8111-111111111111'),
      revision_id: '11111111-1111-4111-8111-111111111111',
      acceptance_id: 'mou-receipt',
    },
    nda: true,
  };
  expect(hasCurrentAchieveSignature(features, 'mou', approved.digest)).toBe(true);
  expect(hasCurrentAchieveSignature(features, 'nda', approved.digest)).toBe(false);
  const revised = achieveCnaAgreements({ achieve_cna_agreements: {
    ...packet, schedule_a: { ...packet.schedule_a, payment_timing: 'Revised timing' },
  } })!;
  expect(hasCurrentAchieveSignature(features, 'mou', revised.digest)).toBe(false);
  const revisedScope = achieveCnaAgreements({ achieve_cna_agreements: {
    ...packet,
    program_scope: 'Certified Nursing Assistant and Home Health Aide programs',
  } })!;
  expect(hasCurrentAchieveSignature(features, 'mou', revisedScope.digest)).toBe(false);
  expect(hasCurrentAchieveSignature({
    ...features,
    achieve_cna_current_revision_id: '22222222-2222-4222-8222-222222222222',
  }, 'mou', approved.digest)).toBe(false);
});
