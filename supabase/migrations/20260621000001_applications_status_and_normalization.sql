-- Fix applications table: status constraint, normalization columns, dedup index
--
-- Problems addressed:
--   1. applications_valid_status constraint is missing 'under_review' and
--      'ready_to_enroll', which are written by confirm-workone and transition
--      routes respectively. Any write of those values throws a constraint
--      violation → "internal server error" for the admin.
--   2. No normalized_email / normalized_phone columns → duplicates slip through.
--   3. No unique index on (normalized_email, program_id) → same person can
--      submit multiple times for the same program.

-- ── 1. Widen status constraint to include all values the code writes ──────────

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_valid_status,
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_valid_status CHECK (
    status IN (
      'submitted',
      'in_review',
      'under_review',
      'ready_to_enroll',
      'approved',
      'rejected',
      'enrolled',
      'pending_workone',
      'waitlisted'
    )
  );

-- Migrate any legacy rows that used the old status values so they don't
-- violate the new constraint on the next write.
UPDATE public.applications SET status = 'submitted'    WHERE status = 'pending';
UPDATE public.applications SET status = 'in_review'    WHERE status = 'funding_review';
UPDATE public.applications SET status = 'enrolled'     WHERE status IN ('onboarding_complete', 'converted', 'active');

-- ── 2. Add normalization columns ──────────────────────────────────────────────

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS normalized_email TEXT,
  ADD COLUMN IF NOT EXISTS normalized_phone TEXT;

-- Back-fill from existing rows
UPDATE public.applications
SET
  normalized_email = lower(trim(email)),
  normalized_phone = regexp_replace(phone, '\D', '', 'g')
WHERE normalized_email IS NULL OR normalized_phone IS NULL;

-- Keep normalized columns in sync on future writes
CREATE OR REPLACE FUNCTION public.normalize_application_contact()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.normalized_email := lower(trim(NEW.email));
  NEW.normalized_phone := regexp_replace(NEW.phone, '\D', '', 'g');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_application_contact ON public.applications;
CREATE TRIGGER trg_normalize_application_contact
  BEFORE INSERT OR UPDATE OF email, phone ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.normalize_application_contact();

-- ── 3. Unique index: one application per (email, program) ────────────────────
-- Partial index — only enforces uniqueness on non-rejected rows so a rejected
-- applicant can re-apply for the same program.

CREATE UNIQUE INDEX IF NOT EXISTS unique_applicant_per_program
  ON public.applications (normalized_email, program_id)
  WHERE program_id IS NOT NULL
    AND status NOT IN ('rejected', 'waitlisted');

-- ── 4. Indexes for admin queue performance ────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_applications_status
  ON public.applications (status);

CREATE INDEX IF NOT EXISTS idx_applications_normalized_email
  ON public.applications (normalized_email);
