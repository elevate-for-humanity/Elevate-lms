-- Seed student-handbook document row.
-- System documents have no real user. Make user_id nullable for owner_type='system'.

-- 1. Allow user_id to be NULL (system docs have no user)
ALTER TABLE public.documents ALTER COLUMN user_id DROP NOT NULL;

-- 2. Set sensible defaults on columns that are NOT NULL in the live schema
DO $$
BEGIN
  ALTER TABLE public.documents ALTER COLUMN file_size SET DEFAULT 0;
  ALTER TABLE public.documents ALTER COLUMN file_url SET DEFAULT '';
  ALTER TABLE public.documents ALTER COLUMN mime_type SET DEFAULT 'application/octet-stream';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not set defaults: %', SQLERRM;
END $$;

UPDATE public.documents SET file_size = 0 WHERE file_size IS NULL;
UPDATE public.documents SET file_url = '' WHERE file_url IS NULL;
UPDATE public.documents SET mime_type = 'application/octet-stream' WHERE mime_type IS NULL;

-- 3. Relax owner_type CHECK to allow 'system'
DO $$
BEGIN
  ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_owner_type_check;
  ALTER TABLE public.documents ADD CONSTRAINT documents_owner_type_check
    CHECK (owner_type IN ('apprentice', 'host_shop', 'system', 'student', 'employer'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update owner_type constraint: %', SQLERRM;
END $$;

-- 4. Relax document_type CHECK to allow 'student-handbook'
DO $$
BEGIN
  ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
  ALTER TABLE public.documents ADD CONSTRAINT documents_document_type_check
    CHECK (document_type IN (
      'photo_id', 'school_transcript', 'certificate', 'out_of_state_license',
      'shop_license', 'barber_license', 'ce_certificate', 'ipla_packet', 'other',
      'student-handbook', 'consent', 'enrollment', 'identity'
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update document_type constraint: %', SQLERRM;
END $$;

-- 5. Insert student-handbook (user_id=NULL, no FK issue)
INSERT INTO public.documents (
  user_id,
  owner_type,
  owner_id,
  document_type,
  file_path,
  file_name,
  file_size,
  file_url,
  mime_type,
  verified
)
SELECT
  NULL,
  'system',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'student-handbook',
  '/student-handbook',
  'Student Handbook',
  0,
  '',
  'application/pdf',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.documents WHERE document_type = 'student-handbook'
);
