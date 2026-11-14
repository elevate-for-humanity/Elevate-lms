import { describe, expect, it } from 'vitest';
import { apprenticeDocumentChecklist } from '@/lib/apprenticeship/document-checklist';
const requirements = [
  { document_type: 'government_id', is_required: true },
  { document_type: 'apprenticeship_agreement', is_required: false },
  { document_type: 'employer_verification', is_required: true },
  { document_type: 'transfer_evidence', is_required: false },
];
describe('shared apprentice document checklist', () => {
  it('requires the electronic agreement independently of upload configuration', () => {
    const result = apprenticeDocumentChecklist(
      requirements,
      [{ document_type: 'government_id', status: 'verified' }],
      false,
    );
    expect(result.requiredCount).toBe(2);
    expect(result.missingCount).toBe(1);
    expect(result.completeCount).toBe(1);
    expect(result.rows.map((row) => row.requirement.document_type)).toEqual([
      'government_id',
      'transfer_evidence',
    ]);
  });
  it('preserves approved evidence when a newer pending duplicate exists', () => {
    const result = apprenticeDocumentChecklist(
      requirements,
      [
        { document_type: 'government_id', status: 'pending' },
        { document_type: 'government_id', status: 'accepted' },
      ],
      true,
    );
    expect(result.missingCount).toBe(0);
    expect(result.rows[0].status).toBe('complete');
    expect(result.rows[0].document?.status).toBe('accepted');
  });
  it('does not count pending or rejected evidence as approved', () => {
    for (const status of ['pending', 'rejected']) {
      expect(
        apprenticeDocumentChecklist(
          requirements,
          [{ document_type: 'government_id', status }],
          true,
        ).missingCount,
      ).toBe(1);
    }
  });
  it('does not confirm completion when requirements are unconfigured', () => {
    expect(apprenticeDocumentChecklist([], [], true).configured).toBe(false);
  });
});
