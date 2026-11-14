-- program_enrollments.enrollment_confirmed_at
-- Written by enrollment-success pages across all programs when a student
-- lands on the confirmation page after account creation.
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_confirmed_at TIMESTAMPTZ;

-- NOTE: The 'documents' bucket and its storage.objects policies were moved to
-- 20260417000013_documents_bucket_policies.sql because they require the
-- supabase_storage_admin role and cannot be applied via the standard exec_sql
-- migration runner (error 42501 "must be owner of table objects").
