import { describe, expect, it } from 'vitest';
import { getDocumentUploadGuidance } from '../../apps/lms/app/apprentice/documents/document-guidance';

describe('apprentice document upload guidance', () => {
  it('explains acceptable proof-of-address evidence', () => {
    const guidance = getDocumentUploadGuidance({
      document_type: 'proof_of_address',
      name: 'Proof of Address',
    });

    expect(guidance).toContain('utility bill');
    expect(guidance).toContain('lease');
    expect(guidance).toContain('bank statement');
    expect(guidance).toContain('full name and current home address');
    expect(guidance).toContain('last 90 days');
  });

  it('uses configured requirement descriptions when available', () => {
    expect(getDocumentUploadGuidance({
      document_type: 'proof_of_address',
      description: 'Upload the document requested by your case manager.',
    })).toBe('Upload the document requested by your case manager.');
  });

  it('does not invent guidance for unrelated document types', () => {
    expect(getDocumentUploadGuidance({ document_type: 'signed_agreement' })).toBeNull();
  });
});
