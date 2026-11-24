ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS self_pay_application_verified_at timestamptz;

COMMENT ON COLUMN public.program_enrollments.self_pay_application_verified_at IS
  'Verified owned self-pay invoice and full application accepted by the enrollment service. State-funded admissions require administrator approval.';
