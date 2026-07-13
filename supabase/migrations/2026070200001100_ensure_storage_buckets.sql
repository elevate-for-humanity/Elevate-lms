-- Ensure all storage buckets referenced in application code exist.
-- Uses ON CONFLICT DO NOTHING so re-running is safe.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Document uploads (onboarding, enrollment, compliance)
  ('documents',             'documents',             false, 52428800,  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('agreements',            'agreements',            false, 20971520,  ARRAY['application/pdf','image/png','image/jpeg']),
  ('assignments',           'assignments',           false, 52428800,  ARRAY['application/pdf','image/jpeg','image/png','video/mp4','application/zip']),
  ('mous',                  'mous',                  false, 20971520,  ARRAY['application/pdf','image/png','image/jpeg']),
  ('contracts',             'contracts',             false, 20971520,  ARRAY['application/pdf','image/png','image/jpeg']),
  ('files',                 'files',                 false, 104857600, NULL),
  ('media',                 'media',                 true,  104857600, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','audio/mpeg']),
  ('avatars',               'avatars',               true,  5242880,   ARRAY['image/jpeg','image/png','image/webp']),
  -- Course content (canonical names: course-content and course-videos, hyphenated)
  ('course-content',        'course-content',        false, 524288000, NULL),
  ('course_content',        'course_content',        false, 524288000, NULL),  -- legacy alias
  ('course-videos',         'course-videos',         false, 524288000, ARRAY['video/mp4','video/webm','video/quicktime']),
  ('course_videos',         'course_videos',         false, 524288000, ARRAY['video/mp4','video/webm','video/quicktime']),  -- legacy alias
  ('curriculum',            'curriculum',            false, 104857600, NULL),
  ('scorm_packages',        'scorm_packages',        false, 524288000, ARRAY['application/zip','application/x-zip-compressed']),
  ('videos',                'videos',                false, 524288000, ARRAY['video/mp4','video/webm','video/quicktime']),
  -- Program holder / partner documents
  ('program_holder_documents', 'program_holder_documents', false, 52428800, ARRAY['application/pdf','image/jpeg','image/png']),
  ('provider_exports',      'provider_exports',      false, 104857600, ARRAY['application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('sam_documents',         'sam_documents',         false, 52428800,  ARRAY['application/pdf','image/jpeg','image/png']),
  -- Enrollment / apprenticeship
  ('enrollment-documents',  'enrollment-documents',  false, 52428800,  ARRAY['application/pdf','image/jpeg','image/png']),
  ('apprentice-uploads',    'apprentice-uploads',    false, 52428800,  NULL)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder in documents bucket
-- (policy may already exist from 20260417000013 — use IF NOT EXISTS guard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'users_own_documents_insert'
  ) THEN
    CREATE POLICY users_own_documents_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'users_own_documents_select'
  ) THEN
    CREATE POLICY users_own_documents_select ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'users_own_documents_delete'
  ) THEN
    CREATE POLICY users_own_documents_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;
