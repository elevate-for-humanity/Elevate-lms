-- Operator 0 must be assignable through the same contract as Admin forms.
-- Preserve ordinary 2–6 digit extensions and all existing records/RLS.
ALTER TABLE public.phone_numbers
  DROP CONSTRAINT phone_numbers_extension_format_check,
  ADD CONSTRAINT phone_numbers_extension_format_check
    CHECK (extension IS NULL OR extension ~ '^(0|[0-9]{2,6})$');
