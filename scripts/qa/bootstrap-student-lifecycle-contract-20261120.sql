-- Isolated QA-only structural stage for the student application lifecycle.
-- Preconditions make this refuse production and any concurrent/partial stage.
-- No application, enrollment, profile, course, or credit rows are inserted.
BEGIN;

DO $qa$
BEGIN
  IF to_regclass('public.applications') IS NOT NULL THEN
    RAISE EXCEPTION 'QA lifecycle stage refused: public.applications already exists';
  END IF;
  IF to_regclass('public.lms_courses') IS NOT NULL THEN
    RAISE EXCEPTION 'QA lifecycle stage refused: public.lms_courses already exists';
  END IF;
  IF to_regclass('public.courses') IS NULL
     OR to_regclass('public.programs') IS NULL
     OR to_regclass('public.program_enrollments') IS NULL
     OR to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'QA lifecycle stage refused: required canonical dependencies are absent';
  END IF;
  IF to_regclass('public.training_courses') IS NOT NULL THEN
    RAISE EXCEPTION 'QA lifecycle stage refused: unexpected legacy course source exists';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE slug = 'elevate-lms-qa'
  ) THEN
    RAISE EXCEPTION 'QA lifecycle stage refused: isolated QA tenant marker is absent';
  END IF;
END
$qa$;

CREATE TABLE public.applications (
  id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  zip text NOT NULL DEFAULT '',
  program_interest text NOT NULL DEFAULT 'General Inquiry',
  has_case_manager boolean NOT NULL DEFAULT false,
  case_manager_agency text,
  support_notes text,
  contact_preference text NOT NULL DEFAULT 'phone',
  advisor_email text,
  status text DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  employer_sponsor_id uuid,
  submit_token uuid DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.programs(id),
  user_id uuid,
  pathway_slug text,
  source text DEFAULT 'direct',
  full_name text,
  eligibility_data jsonb,
  reviewer_id uuid,
  review_notes text,
  reviewed_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  intake_id uuid,
  program_slug text,
  payment_received_at timestamptz,
  eligibility_status text DEFAULT 'pending',
  eligibility_verified_at timestamptz,
  eligibility_verified_by uuid,
  advisor_assigned uuid,
  advisor_notes text,
  next_step text,
  next_step_due_date date,
  sezzle_session_uuid text,
  sezzle_order_uuid text,
  sezzle_reference_id text,
  sezzle_card_token text,
  payment_provider text,
  payment_status text,
  payment_amount_cents integer,
  payment_completed_at timestamptz,
  payment_reference text,
  internal_order_id text,
  affirm_order_id text,
  customer_email text,
  reference_number text,
  name text,
  notes text,
  date_of_birth date,
  address text,
  state text,
  zip_code text,
  requested_funding_source text,
  household_size integer,
  annual_income_usd integer,
  justice_involved boolean DEFAULT false,
  has_employer_sponsor boolean DEFAULT false,
  has_workone_approval boolean DEFAULT false,
  workone_approval_ref text,
  eligibility_evaluated_at timestamptz,
  recommended_funding_source text,
  funding_type text,
  funding_eligibility_status text,
  enrollment_id uuid REFERENCES public.program_enrollments(id) ON DELETE SET NULL,
  milady_status text NOT NULL DEFAULT 'not_applicable',
  onboarding_sent_at timestamptz,
  follow_up_notes text,
  funding_verified boolean DEFAULT false,
  funding_source text
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.applications FROM anon, authenticated;
GRANT ALL ON TABLE public.applications TO service_role;

CREATE INDEX applications_status_created_idx
  ON public.applications (status, created_at DESC);
CREATE INDEX applications_email_idx
  ON public.applications (lower(email));
CREATE INDEX applications_program_idx
  ON public.applications (program_id, program_slug);
CREATE INDEX applications_user_idx
  ON public.applications (user_id);

CREATE VIEW public.lms_courses
WITH (security_invoker = true)
AS
SELECT
  c.id,
  COALESCE(c.title, c.course_name) AS title,
  c.slug,
  c.description,
  c.short_description,
  c.status::text AS status,
  c.is_active,
  c.published_at,
  c.thumbnail_url,
  c.duration_hours,
  c.total_lessons,
  c.generation_status,
  c.generation_progress,
  c.review_status,
  c.program_id,
  c.org_id,
  c.version,
  c.compliance_profile_key,
  c.governing_body,
  c.governing_standard_version,
  NULL::numeric AS passing_score,
  NULL::boolean AS certificate_enabled,
  NULL::uuid AS created_by,
  c.created_at,
  c.updated_at,
  'courses'::text AS course_source
FROM public.courses c;

REVOKE ALL ON TABLE public.lms_courses FROM anon, authenticated;
GRANT SELECT ON TABLE public.lms_courses TO service_role;

COMMENT ON TABLE public.applications IS
  'Isolated QA structural contract for real-auth student lifecycle acceptance; contains no copied production rows.';
COMMENT ON VIEW public.lms_courses IS
  'Isolated QA canonical course projection. The QA project has no legacy training_courses source.';

COMMIT;
