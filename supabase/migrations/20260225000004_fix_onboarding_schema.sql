-- Fix missing columns and constraints that block the student onboarding flow.
--
-- Context: API routes (learner, sign-document, submit, orientation, schedule)
-- reference columns that were never created on the underlying tables.
-- Without these columns, server actions crash on insert/update.

BEGIN;

-- profiles: schedule/select page writes selected_cohort on submit
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selected_cohort text;

-- profiles: orientation page writes orientation_completed_at on submit
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orientation_completed_at timestamptz;

-- documents: the onboarding documents page allows uploading selective service
-- registration, but the check constraint did not include that value.
-- Rebuild the constraint with the full set of allowed types.
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check CHECK (
  document_type = ANY (ARRAY[
    'photo_id', 'selfie', 'identity', 'other', 'student-handbook',
    'ssn_proof', 'proof_of_residency', 'drivers_license', 'passport',
    'birth_certificate', 'proof_of_address', 'proof_of_income',
    'w2', 'tax_return', 'pay_stub', 'bank_statement', 'utility_bill',
    'lease', 'enrollment_agreement', 'financial_aid', 'scholarship',
    'government_id', 'transcript', 'diploma', 'certification', 'resume',
    'selective_service', 'school_transcript', 'certificate',
    'out_of_state_license', 'shop_license', 'barber_license',
    'ce_certificate', 'employment_verification', 'ipla_packet'
  ])
);

COMMIT;
