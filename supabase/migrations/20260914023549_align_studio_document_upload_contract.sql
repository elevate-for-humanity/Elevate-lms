-- Align the private Studio document bucket with the formats and size enforced
-- by the Admin Studio upload endpoint. Authorization remains server-side and
-- every stored object remains private.
UPDATE storage.buckets
SET file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/json',
      'text/plain',
      'text/markdown',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ]::text[]
WHERE id = 'documents';
