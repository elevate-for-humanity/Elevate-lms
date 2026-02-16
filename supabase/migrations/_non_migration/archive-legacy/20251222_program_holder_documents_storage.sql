-- Program Holder Documents Storage Bucket
-- Secure storage for program holder document uploads

-- Create storage bucket for program holder documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'program-holder-documents',
  'program-holder-documents',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for program-holder-documents bucket

-- Program holders can upload their own documents
CREATE POLICY "Program holders can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'program-holder-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'program_holder'
  )
);

-- Program holders can view their own documents
CREATE POLICY "Program holders can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'program-holder-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all program holder documents
CREATE POLICY "Admins can view all program holder documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'program-holder-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Admins can delete program holder documents
CREATE POLICY "Admins can delete program holder documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'program-holder-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'program-holder-documents') THEN
    RAISE NOTICE '✅ program-holder-documents bucket created successfully';
  ELSE
    RAISE WARNING '⚠️  Failed to create program-holder-documents bucket';
  END IF;
END $$;
