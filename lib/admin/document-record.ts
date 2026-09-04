const ADMIN_DOCUMENT_BUCKETS = new Set([
  'documents',
  'enrollment-documents',
  'program-holder-documents',
  'apprentice-uploads',
  'tax-documents',
]);

type DocumentStorageFields = {
  file_path?: unknown;
  file_url?: unknown;
  metadata?: unknown;
};

export function resolveDocumentStorageLocator(
  document: DocumentStorageFields,
): { bucket: string; path: string } | null {
  const metadata =
    document.metadata && typeof document.metadata === 'object' && !Array.isArray(document.metadata)
      ? (document.metadata as Record<string, unknown>)
      : {};
  const configuredBucket =
    typeof metadata.storage_bucket === 'string' ? metadata.storage_bucket.trim() : '';
  if (configuredBucket && !ADMIN_DOCUMENT_BUCKETS.has(configuredBucket)) return null;
  const bucket = configuredBucket || 'documents';

  const candidates = [document.file_path, metadata.storage_path, document.file_url];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    let path = candidate.trim();
    if (!path || /^https?:\/\//i.test(path) || path.startsWith('/') || path.includes('..'))
      continue;
    if (path.startsWith(`${bucket}/`)) path = path.slice(bucket.length + 1);
    if (path) return { bucket, path };
  }
  return null;
}

export function normalizeDocumentReviewStatus(
  status: unknown,
): 'pending' | 'approved' | 'rejected' | 'unknown' {
  const value = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (['pending', 'pending_review', 'submitted', 'uploaded'].includes(value)) return 'pending';
  if (['approved', 'accepted', 'verified'].includes(value)) return 'approved';
  if (['rejected', 'denied'].includes(value)) return 'rejected';
  return 'unknown';
}
