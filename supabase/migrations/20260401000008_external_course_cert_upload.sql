-- Add certificate_url to external_course_completions
-- Populated when a learner uploads a DOL wallet card or completion certificate.

ALTER TABLE external_course_completions
  ADD COLUMN IF NOT EXISTS certificate_url text;

-- Storage policies for the `documents` bucket, external-course-certs/ prefix.
--
-- Path layout: external-course-certs/{user_id}/{course_id}/{timestamp}.{ext}
-- (storage.foldername(name))[1] = 'external-course-certs'
-- (storage.foldername(name))[2] = user_id

-- Learners can upload their own certificates
DROP POLICY IF EXISTS "learner_upload_ext_course_cert" ON storage.objects;
CREATE POLICY "learner_upload_ext_course_cert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'external-course-certs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Learners can read back their own certificates
DROP POLICY IF EXISTS "learner_read_ext_course_cert" ON storage.objects;
CREATE POLICY "learner_read_ext_course_cert"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'external-course-certs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Learners can replace their own certificates (upsert uses UPDATE)
DROP POLICY IF EXISTS "learner_update_ext_course_cert" ON storage.objects;
CREATE POLICY "learner_update_ext_course_cert"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'external-course-certs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Admins and staff can read all certificates for review
DROP POLICY IF EXISTS "admin_read_ext_course_certs" ON storage.objects;
CREATE POLICY "admin_read_ext_course_certs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'external-course-certs'
    AND is_admin_role()
  );
