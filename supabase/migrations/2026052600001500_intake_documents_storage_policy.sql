-- Storage setup for unauthenticated intake document uploads.
--
-- The intake form at /apply is public (no auth required). Documents uploaded
-- via POST /api/intake/upload are stored under intake-documents/{ts}-{rand}/
-- in the 'documents' bucket using the service_role (admin) client, which
-- bypasses storage RLS. However, if the bucket does not exist yet the upload
-- fails with a 404.
--
-- The bucket setup is safe for the automated migration runner. Policies on
-- storage.objects are owner-only in Supabase, so this migration only applies
-- those policies when it is running as the storage.objects owner. Otherwise it
-- emits a NOTICE and continues; the service_role upload path still works because
-- service_role bypasses storage RLS.

-- Ensure the documents bucket exists with the correct settings.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $storage_policies$
DECLARE
  objects_owner text;
BEGIN
  SELECT tableowner
  INTO objects_owner
  FROM pg_tables
  WHERE schemaname = 'storage'
    AND tablename = 'objects';

  IF objects_owner IS NULL THEN
    RAISE NOTICE 'Skipping intake storage policies because storage.objects was not found.';
  ELSIF current_user = objects_owner THEN
    -- Allow service_role to insert into intake-documents/ prefix.
    -- The upload route uses requireAdminClient() which runs as service_role.
    EXECUTE $policy$
      DROP POLICY IF EXISTS "Service role can upload intake documents" ON storage.objects
    $policy$;
    EXECUTE $policy$
      CREATE POLICY "Service role can upload intake documents"
        ON storage.objects
        FOR INSERT
        TO service_role
        WITH CHECK (
          bucket_id = 'documents'
          AND (storage.foldername(name))[1] = 'intake-documents'
        )
    $policy$;

    -- Allow admins and staff to read intake documents for review.
    EXECUTE $policy$
      DROP POLICY IF EXISTS "Admins can read intake documents" ON storage.objects
    $policy$;
    EXECUTE $policy$
      CREATE POLICY "Admins can read intake documents"
        ON storage.objects
        FOR SELECT
        USING (
          bucket_id = 'documents'
          AND (storage.foldername(name))[1] = 'intake-documents'
          AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'super_admin', 'staff', 'case_manager')
          )
        )
    $policy$;

    -- Service role can also read (for signed URL generation in admin review pages).
    EXECUTE $policy$
      DROP POLICY IF EXISTS "Service role can read all documents" ON storage.objects
    $policy$;
    EXECUTE $policy$
      CREATE POLICY "Service role can read all documents"
        ON storage.objects
        FOR SELECT
        TO service_role
        USING (bucket_id = 'documents')
    $policy$;
  ELSE
    RAISE NOTICE 'Skipping intake storage policies: current_user % is not storage.objects owner %.', current_user, objects_owner;
  END IF;
END
$storage_policies$;
