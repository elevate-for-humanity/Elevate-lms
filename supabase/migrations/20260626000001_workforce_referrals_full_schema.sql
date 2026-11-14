-- Replaces the 5-column stub in baseline_untracked_tables with the full schema
-- that the workforce-referral API route actually writes.
-- Safe to run against a DB that already has the stub (ALTER ADD COLUMN IF NOT EXISTS).

-- 1. Add all missing columns to the existing table
ALTER TABLE public.workforce_referrals
  ADD COLUMN IF NOT EXISTS user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS application_id    uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enrollment_id     uuid REFERENCES public.training_enrollments(id) ON DELETE SET NULL,

  -- Agency / case manager
  ADD COLUMN IF NOT EXISTS agency_name       text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS agency_type       text NOT NULL DEFAULT 'other'
    CHECK (agency_type IN (
      'american_job_center','workforce_board','vocational_rehabilitation',
      'wioa','jri','snap_et','fssa','other'
    )),
  ADD COLUMN IF NOT EXISTS case_manager_name  text,
  ADD COLUMN IF NOT EXISTS case_manager_email text,
  ADD COLUMN IF NOT EXISTS case_manager_phone text,

  -- Participant (denormalised for audit trail — survives user deletion)
  ADD COLUMN IF NOT EXISTS participant_name  text,
  ADD COLUMN IF NOT EXISTS participant_email text,

  -- Funding
  ADD COLUMN IF NOT EXISTS funding_type      text,
  ADD COLUMN IF NOT EXISTS voucher_number    text,
  ADD COLUMN IF NOT EXISTS funding_amount    numeric(10,2),
  ADD COLUMN IF NOT EXISTS funding_approved  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS funding_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS funding_approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Referral lifecycle
  ADD COLUMN IF NOT EXISTS referral_date     timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS contact_sent      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_sent_at   timestamptz,
  ADD COLUMN IF NOT EXISTS partner_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS partner_acknowledged_at timestamptz,

  -- Status (extends the existing status text column)
  ADD COLUMN IF NOT EXISTS status_update_email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_status_update_sent_at  timestamptz,

  -- Case notes (required for FSSA/WIOA audits)
  ADD COLUMN IF NOT EXISTS case_notes        text,

  -- Soft-delete
  ADD COLUMN IF NOT EXISTS archived          boolean NOT NULL DEFAULT false;

-- 2. Tighten the status column to the values the API actually uses
--    (existing rows default to 'referred' if status is null)
UPDATE public.workforce_referrals
  SET status = 'referred'
  WHERE status IS NULL OR status NOT IN (
    'referred','intake_started','enrolled','active','completed','withdrawn','cancelled'
  );

ALTER TABLE public.workforce_referrals
  DROP CONSTRAINT IF EXISTS workforce_referrals_status_check;

ALTER TABLE public.workforce_referrals
  ADD CONSTRAINT workforce_referrals_status_check
  CHECK (status IN (
    'referred','intake_started','enrolled','active','completed','withdrawn','cancelled'
  ));

ALTER TABLE public.workforce_referrals
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'referred';

-- 3. Primary key (baseline stub may not have one)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.workforce_referrals'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.workforce_referrals ADD PRIMARY KEY (id);
  END IF;
END $$;

-- 4. Indexes for the query patterns in the API route
CREATE INDEX IF NOT EXISTS idx_workforce_referrals_user_id
  ON public.workforce_referrals(user_id);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_application_id
  ON public.workforce_referrals(application_id);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_agency_type
  ON public.workforce_referrals(agency_type);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_status
  ON public.workforce_referrals(status);

CREATE INDEX IF NOT EXISTS idx_workforce_referrals_referral_date
  ON public.workforce_referrals(referral_date DESC);

-- 5. updated_at trigger (reuse existing helper if present, else create)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workforce_referrals_updated_at ON public.workforce_referrals;
CREATE TRIGGER trg_workforce_referrals_updated_at
  BEFORE UPDATE ON public.workforce_referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. RLS
ALTER TABLE public.workforce_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workforce_referrals_admin_all" ON public.workforce_referrals;
DO $$ BEGIN CREATE POLICY "workforce_referrals_admin_all" ON public.workforce_referrals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','advisor','staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "workforce_referrals_own_read" ON public.workforce_referrals;
DO $$ BEGIN CREATE POLICY "workforce_referrals_own_read" ON public.workforce_referrals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
