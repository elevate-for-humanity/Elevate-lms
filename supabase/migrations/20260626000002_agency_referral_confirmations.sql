-- Partner acknowledgment log for workforce referrals.
-- Every time a partner confirms receipt of a referral (or fails to),
-- a row is written here. This is the audit trail agencies ask for.
--
-- Answers: "Did the partner confirm they received this referral?"
-- Required for FSSA/WIOA audits — a referral without confirmation is not valid.

CREATE TABLE IF NOT EXISTS public.agency_referral_confirmations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id         uuid NOT NULL REFERENCES public.workforce_referrals(id) ON DELETE CASCADE,

  -- Who confirmed (partner contact or staff recording the confirmation)
  confirmed_by_name   text,
  confirmed_by_email  text,
  confirmed_by_phone  text,
  recorded_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- What was confirmed
  confirmation_method text NOT NULL DEFAULT 'email'
    CHECK (confirmation_method IN ('email','phone','portal','in_person','fax','other')),
  confirmation_type   text NOT NULL DEFAULT 'receipt'
    CHECK (confirmation_type IN (
      'receipt',          -- partner confirmed they received the referral
      'enrollment',       -- partner confirmed participant enrolled
      'attendance',       -- partner confirmed attendance/participation
      'completion',       -- partner confirmed program completion
      'placement',        -- partner confirmed job placement
      'no_show',          -- partner reported participant did not show
      'declined',         -- partner declined the referral
      'unable_to_reach'   -- partner could not be reached (logged for follow-up)
    )),

  -- Outcome data (populated for enrollment/completion/placement types)
  enrollment_date     date,
  completion_date     date,
  placement_date      date,
  employer_name       text,
  job_title           text,
  hourly_wage         numeric(8,2),

  -- Notes (required for audit — case managers must document every contact)
  notes               text,

  -- Follow-up tracking
  follow_up_required  boolean NOT NULL DEFAULT false,
  follow_up_due_date  date,
  follow_up_completed boolean NOT NULL DEFAULT false,

  confirmed_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- When a confirmation of type 'receipt' is inserted, mark the referral as acknowledged
CREATE OR REPLACE FUNCTION public.sync_referral_acknowledgment()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.confirmation_type = 'receipt' THEN
    UPDATE public.workforce_referrals
    SET
      partner_acknowledged     = true,
      partner_acknowledged_at  = NEW.confirmed_at,
      updated_at               = now()
    WHERE id = NEW.referral_id;
  END IF;

  -- Advance referral status based on confirmation type
  UPDATE public.workforce_referrals
  SET
    status = CASE NEW.confirmation_type
      WHEN 'enrollment'  THEN 'enrolled'
      WHEN 'completion'  THEN 'completed'
      WHEN 'no_show'     THEN 'withdrawn'
      WHEN 'declined'    THEN 'cancelled'
      ELSE status  -- receipt / attendance / placement / unable_to_reach don't change status
    END,
    updated_at = now()
  WHERE id = NEW.referral_id
    AND (
      -- only advance, never regress
      CASE NEW.confirmation_type
        WHEN 'enrollment' THEN status IN ('referred','intake_started')
        WHEN 'completion' THEN status IN ('referred','intake_started','enrolled','active')
        WHEN 'no_show'    THEN status NOT IN ('completed','withdrawn','cancelled')
        WHEN 'declined'   THEN status NOT IN ('completed','withdrawn','cancelled')
        ELSE false
      END
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_referral_acknowledgment ON public.agency_referral_confirmations;
CREATE TRIGGER trg_sync_referral_acknowledgment
  AFTER INSERT ON public.agency_referral_confirmations
  FOR EACH ROW EXECUTE FUNCTION public.sync_referral_acknowledgment();

-- updated_at
DROP TRIGGER IF EXISTS trg_agency_referral_confirmations_updated_at ON public.agency_referral_confirmations;
CREATE TRIGGER trg_agency_referral_confirmations_updated_at
  BEFORE UPDATE ON public.agency_referral_confirmations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_arc_referral_id
  ON public.agency_referral_confirmations(referral_id);

CREATE INDEX IF NOT EXISTS idx_arc_confirmation_type
  ON public.agency_referral_confirmations(confirmation_type);

CREATE INDEX IF NOT EXISTS idx_arc_follow_up
  ON public.agency_referral_confirmations(follow_up_required, follow_up_completed, follow_up_due_date)
  WHERE follow_up_required = true AND follow_up_completed = false;

-- RLS
ALTER TABLE public.agency_referral_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arc_admin_all" ON public.agency_referral_confirmations;
DO $$ BEGIN CREATE POLICY "arc_admin_all" ON public.agency_referral_confirmations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','advisor','staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- View: referral pipeline summary used by the admin dashboard
DROP VIEW IF EXISTS public.referral_pipeline_summary;
CREATE VIEW public.referral_pipeline_summary AS
SELECT
  wr.id,
  wr.application_id,
  wr.enrollment_id,
  wr.participant_name,
  wr.participant_email,
  wr.agency_name,
  wr.agency_type,
  wr.case_manager_name,
  wr.case_manager_email,
  wr.funding_type,
  wr.voucher_number,
  wr.status,
  wr.referral_date,
  wr.partner_acknowledged,
  wr.partner_acknowledged_at,
  wr.funding_approved,
  wr.funding_approved_at,
  wr.contact_sent,
  wr.case_notes,
  -- Days since referral (SLA tracking)
  EXTRACT(DAY FROM now() - wr.referral_date)::int AS days_since_referral,
  -- Latest confirmation
  latest.confirmation_type  AS latest_confirmation_type,
  latest.confirmed_at       AS latest_confirmation_at,
  latest.notes              AS latest_confirmation_notes,
  -- Outcome data from latest placement confirmation
  placement.employer_name,
  placement.job_title,
  placement.hourly_wage,
  placement.placement_date,
  -- Linked application status
  a.status                  AS application_status,
  a.eligibility_status,
  a.has_workone_approval,
  a.workone_approval_ref,
  -- Linked enrollment
  te.status                 AS enrollment_status,
  te.program_id
FROM public.workforce_referrals wr
LEFT JOIN LATERAL (
  SELECT confirmation_type, confirmed_at, notes
  FROM public.agency_referral_confirmations
  WHERE referral_id = wr.id
  ORDER BY confirmed_at DESC
  LIMIT 1
) latest ON true
LEFT JOIN LATERAL (
  SELECT employer_name, job_title, hourly_wage, placement_date
  FROM public.agency_referral_confirmations
  WHERE referral_id = wr.id
    AND confirmation_type = 'placement'
  ORDER BY confirmed_at DESC
  LIMIT 1
) placement ON true
LEFT JOIN public.applications a ON a.id = wr.application_id
LEFT JOIN public.training_enrollments te ON te.id = wr.enrollment_id
WHERE wr.archived = false;

COMMENT ON VIEW public.referral_pipeline_summary IS
  'Denormalised referral pipeline for admin dashboard. One row per referral with latest confirmation and linked application/enrollment status.';
