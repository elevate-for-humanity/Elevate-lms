-- Fix: Add 'student-handbook' to documents_document_type_check constraint
-- and seed the student handbook document row.

BEGIN;

-- 1. Update the check constraint to include 'student-handbook'
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check CHECK (document_type IN (
  'photo_id',
  'school_transcript',
  'certificate',
  'out_of_state_license',
  'shop_license',
  'barber_license',
  'cosmetology_license',
  'instructor_license',
  'apprentice_permit',
  'drug_test',
  'background_check',
  'w9',
  'insurance',
  'lease_agreement',
  'mou',
  'enrollment_agreement',
  'training_plan',
  'completion_certificate',
  'state_board_results',
  'practical_exam',
  'hours_log',
  'student-handbook',
  'other'
));

-- 2. Seed student handbook document (idempotent)
INSERT INTO documents (user_id, document_type, file_name, file_size, file_url, mime_type, status, metadata)
SELECT
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  'student-handbook',
  'Elevate-Student-Handbook-2025.pdf',
  0,
  '/student-handbook',
  'application/pdf',
  'approved',
  '{"handbook_type": "student-handbook", "version": "2025.1"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM documents WHERE metadata->>'handbook_type' = 'student-handbook'
);

COMMIT;
