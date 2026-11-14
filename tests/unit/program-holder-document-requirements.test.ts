import { describe, expect, it } from 'vitest';
import {
  isProgramHolderUploadDocumentType,
  programHolderDocumentStatus,
  PROGRAM_HOLDER_UPLOAD_DOCUMENT_TYPES,
} from '@/lib/program-holder/document-requirements';

describe('program holder document requirements', () => {
  it('accepts portal upload types including business_license', () => {
    expect(isProgramHolderUploadDocumentType('business_license')).toBe(true);
    expect(isProgramHolderUploadDocumentType('ein_verification')).toBe(true);
    expect(isProgramHolderUploadDocumentType('not_a_real_type')).toBe(false);
    expect(PROGRAM_HOLDER_UPLOAD_DOCUMENT_TYPES).toContain('employer_mou');
  });

  it('maps legacy approved boolean to status', () => {
    expect(programHolderDocumentStatus({ status: 'approved' })).toBe('approved');
    expect(programHolderDocumentStatus({ approved: true })).toBe('approved');
    expect(programHolderDocumentStatus({ approved: false })).toBe('rejected');
    expect(programHolderDocumentStatus({ approved: null })).toBe('pending');
  });
});
