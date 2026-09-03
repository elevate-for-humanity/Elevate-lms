-- Add draft state columns to program_enrollments for wizard auto-save.
-- draft_data stores the wizard form state as JSONB.
-- wizard_step tracks which step the user was on when they last saved.

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS draft_data    JSONB    DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS wizard_step   INTEGER  DEFAULT 1;
