import { describe, expect, it } from 'vitest';
import {
  normalizeDocumentReviewStatus,
  resolveDocumentStorageLocator,
} from '../../lib/admin/document-record';

describe('admin document access', () => {
  it('resolves canonical file_path documents', () => {
    expect(resolveDocumentStorageLocator({ file_path: 'user/photo-id.pdf' })).toEqual({
      bucket: 'documents',
      path: 'user/photo-id.pdf',
    });
  });

  it('resolves apprentice uploads stored in metadata', () => {
    expect(
      resolveDocumentStorageLocator({
        metadata: {
          storage_bucket: 'documents',
          storage_path: 'user/apprentice-documents/program/enrollment/government_id/id.png',
        },
      }),
    ).toEqual({
      bucket: 'documents',
      path: 'user/apprentice-documents/program/enrollment/government_id/id.png',
    });
  });

  it('rejects public URLs and path traversal', () => {
    expect(resolveDocumentStorageLocator({ file_url: 'https://example.com/id.pdf' })).toBeNull();
    expect(resolveDocumentStorageLocator({ file_path: '../id.pdf' })).toBeNull();
    expect(
      resolveDocumentStorageLocator({
        metadata: {
          storage_bucket: 'public-assets',
          storage_path: 'student/id.pdf',
        },
      }),
    ).toBeNull();
  });

  it('normalizes every review-queue status family', () => {
    expect(normalizeDocumentReviewStatus('pending_review')).toBe('pending');
    expect(normalizeDocumentReviewStatus('pending')).toBe('pending');
    expect(normalizeDocumentReviewStatus('verified')).toBe('approved');
    expect(normalizeDocumentReviewStatus('denied')).toBe('rejected');
  });
});
