-- Canonical SAM.gov storage bucket access.
-- The application table remains public.sam_documents; this migration configures Storage only.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sam-documents',
  'sam-documents',
  false,
  52428800,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "sam_documents_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "sam_documents_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "sam_documents_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "sam_documents_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "sam_documents_admin_all" ON storage.objects;

CREATE POLICY "sam_documents_owner_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'sam-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "sam_documents_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'sam-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "sam_documents_owner_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'sam-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'sam-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "sam_documents_owner_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'sam-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "sam_documents_admin_all"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'sam-documents' AND public.is_admin())
WITH CHECK (bucket_id = 'sam-documents' AND public.is_admin());
