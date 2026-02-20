-- Seed student-handbook document row.
-- Uses NULL for uploaded_by (UUID column) and sentinel UUID for owner_id (NOT NULL).

-- Relax owner_type CHECK to allow 'system'
DO $$
BEGIN
  ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_owner_type_check;
  ALTER TABLE public.documents ADD CONSTRAINT documents_owner_type_check
    CHECK (owner_type IN ('apprentice', 'host_shop', 'system', 'student', 'employer'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update owner_type constraint: %', SQLERRM;
END $$;

-- Relax document_type CHECK to allow 'student-handbook'
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

-- Insert only if no student-handbook row exists yet
INSERT INTO public.documents (
  owner_type,
  owner_id,
  document_type,
  file_path,
  file_name,
  uploaded_by,
  verified
)
SELECT
  'system',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'student-handbook',
  '/student-handbook',
  'Student Handbook',
  null::uuid,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.documents WHERE document_type = 'student-handbook'
);
