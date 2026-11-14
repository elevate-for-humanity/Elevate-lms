-- Phase 1 of the zero-downtime enrollment consolidation.
-- Extend the canonical table, preserve every legacy apprenticeship value, and
-- establish the natural key used by all webhook writers. The legacy table is
-- retired only after every deployed reader and writer uses this table.

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS transfer_hours numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rapids_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rapids_id text,
  ADD COLUMN IF NOT EXISTS lms_enrolled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS milady_enrolled_at timestamptz,
  ADD COLUMN IF NOT EXISTS supervisor_id uuid,
  ADD COLUMN IF NOT EXISTS hours_needed integer NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS total_program_fee numeric,
  ADD COLUMN IF NOT EXISTS down_payment numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_remaining numeric,
  ADD COLUMN IF NOT EXISTS payment_plan_months integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_payment_amount numeric,
  ADD COLUMN IF NOT EXISTS next_payment_date date,
  ADD COLUMN IF NOT EXISTS vendor_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vendor_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS vendor_payment_amount numeric,
  ADD COLUMN IF NOT EXISTS certificate_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS case_id uuid,
  ADD COLUMN IF NOT EXISTS region_id text,
  ADD COLUMN IF NOT EXISTS payment_option text,
  ADD COLUMN IF NOT EXISTS required_hours numeric NOT NULL DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS has_host_shop boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS host_shop_name text,
  ADD COLUMN IF NOT EXISTS progress text,
  ADD COLUMN IF NOT EXISTS employer_id uuid,
  ADD COLUMN IF NOT EXISTS employer_of_record text,
  ADD COLUMN IF NOT EXISTS employer_name text,
  ADD COLUMN IF NOT EXISTS employer_contact_email text,
  ADD COLUMN IF NOT EXISTS employer_contact_phone text,
  ADD COLUMN IF NOT EXISTS employer_pays_wage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expected_end_date date,
  ADD COLUMN IF NOT EXISTS wage_rate_hour numeric,
  ADD COLUMN IF NOT EXISTS stipend_total_amount numeric,
  ADD COLUMN IF NOT EXISTS tuition_covered_amount numeric,
  ADD COLUMN IF NOT EXISTS external_case_id text,
  ADD COLUMN IF NOT EXISTS lms_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS practical_skills_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transfer_hours_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS transfer_hours_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS transfer_hours_source text;

INSERT INTO public.program_enrollments (
  id, user_id, student_id, program_id, program_slug, stripe_checkout_session_id,
  status, transfer_hours, rapids_status, rapids_id, lms_enrolled,
  milady_enrolled_at, host_shop_id, supervisor_id, started_at, completed_at,
  created_at, updated_at, hours_needed, total_program_fee, down_payment,
  amount_paid, balance_remaining, payment_plan_months, monthly_payment_amount,
  payment_status, stripe_subscription_id, next_payment_date, vendor_paid,
  vendor_paid_at, vendor_payment_amount, certificate_issued_at, funding_source,
  case_id, region_id, payment_option, required_hours, has_host_shop,
  host_shop_name, enrollment_state, progress, cohort_id
)
SELECT
  se.id, se.student_id, se.student_id, p.id,
  COALESCE(se.program_slug, ap.slug), se.stripe_checkout_session_id,
  se.status, se.transfer_hours, se.rapids_status, se.rapids_id,
  se.lms_enrolled, se.milady_enrolled_at, se.shop_id, se.supervisor_id,
  se.started_at, se.completed_at, se.created_at, se.updated_at,
  se.hours_needed, se.total_program_fee, se.down_payment, se.amount_paid,
  se.balance_remaining, se.payment_plan_months, se.monthly_payment_amount,
  se.payment_status, se.stripe_subscription_id, se.next_payment_date,
  se.vendor_paid, se.vendor_paid_at, se.vendor_payment_amount,
  se.certificate_issued_at, se.funding_source, se.case_id, se.region_id,
  se.payment_option, se.required_hours, se.has_host_shop, se.host_shop_name,
  se.enrollment_state, se.progress, se.cohort_id
FROM public.student_enrollments se
JOIN public.apprenticeship_programs ap ON ap.id = se.program_id
JOIN public.programs p ON p.slug = COALESCE(se.program_slug, ap.slug)
ON CONFLICT (student_id, program_slug) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  program_id = EXCLUDED.program_id,
  program_slug = EXCLUDED.program_slug,
  status = EXCLUDED.status,
  transfer_hours = EXCLUDED.transfer_hours,
  updated_at = GREATEST(public.program_enrollments.updated_at, EXCLUDED.updated_at);

CREATE OR REPLACE FUNCTION public.enforce_program_enrollment_hours()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  configured_hours integer;
BEGIN
  IF NEW.program_id IS NULL THEN
    RAISE EXCEPTION 'program_enrollments.program_id is required';
  END IF;

  SELECT required_hours INTO configured_hours
  FROM public.programs
  WHERE id = NEW.program_id;

  IF configured_hours IS NOT NULL THEN
    NEW.hours_needed := configured_hours;
    NEW.required_hours := configured_hours;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_program_enrollment_hours_trigger
  ON public.program_enrollments;
CREATE TRIGGER enforce_program_enrollment_hours_trigger
BEFORE INSERT OR UPDATE OF program_id ON public.program_enrollments
FOR EACH ROW EXECUTE FUNCTION public.enforce_program_enrollment_hours();

ALTER TABLE public.transfer_hour_requests
  DROP CONSTRAINT IF EXISTS transfer_hour_requests_enrollment_id_fkey;
ALTER TABLE public.transfer_hour_requests
  ADD CONSTRAINT transfer_hour_requests_enrollment_id_fkey
  FOREIGN KEY (enrollment_id) REFERENCES public.program_enrollments(id)
  ON DELETE CASCADE;
