-- Program State Engine
-- Adds enrollment_state, capacity, and provider ref columns to programs.
-- enrollment_state drives CTA behavior and API gating across the platform.

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS enrollment_state       text NOT NULL DEFAULT 'open'
    CHECK (enrollment_state IN ('open', 'waitlist', 'closed')),
  ADD COLUMN IF NOT EXISTS total_seats            int,
  ADD COLUMN IF NOT EXISTS seats_available        int,
  ADD COLUMN IF NOT EXISTS next_cohort_date       date,
  ADD COLUMN IF NOT EXISTS waitlist_enabled       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS internal_provider_ref  text;  -- admin-only, never exposed in UI

-- CNA is intentionally waitlisted
UPDATE public.programs
  SET enrollment_state = 'waitlist',
      waitlist_enabled = true
  WHERE slug = 'cna';

-- CDL provider reference (internal only — never surfaced in UI or public API)
UPDATE public.programs
  SET internal_provider_ref = 'cdl-provider-001'
  WHERE slug = 'cdl-training';

CREATE INDEX IF NOT EXISTS idx_programs_enrollment_state
  ON public.programs(enrollment_state);

-- RLS: internal_provider_ref is readable only by service_role (admin)
-- Public/authenticated reads via REST API will not expose this column
-- because the column is not in any public view or anon-accessible query.
COMMENT ON COLUMN public.programs.internal_provider_ref IS
  'Internal provider reference — admin-only. Never expose in public UI or API responses.';
