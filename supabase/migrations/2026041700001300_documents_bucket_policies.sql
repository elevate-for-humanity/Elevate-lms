-- DOCUMENTS STORAGE BUCKET + RLS POLICIES
--
-- MUST BE APPLIED MANUALLY via Supabase Dashboard → SQL Editor.
-- The standard migration runner runs as service_role, which is NOT the owner
-- of storage.objects (that's supabase_storage_admin). The Dashboard SQL Editor
-- has the elevated permissions required to alter storage policies.
--
-- This file is intentionally tracked but auto-runner will SKIP it gracefully
-- after the first failure; idempotent so re-running in Dashboard is safe.

-- Ensure the 'documents' storage bucket exists.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can upload and read their own documents
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
CREATE POLICY "Users can read own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can read all documents" ON storage.objects;
CREATE POLICY "Admins can read all documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );
