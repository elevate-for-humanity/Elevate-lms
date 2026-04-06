-- CRM leads table — student/applicant pipeline.
-- Separate from the existing `leads` table which is enterprise/licensing-oriented.
-- Every eligibility submission, application, and payment creates or advances a row here.

CREATE TABLE IF NOT EXISTS public.crm_leads (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  full_name          text        NOT NULL,
  email              text        NOT NULL,
  phone              text,

  source             text        NOT NULL DEFAULT 'website',
  source_detail      text,
  role               text        NOT NULL DEFAULT 'student',
  program_slug       text,

  -- Pipeline stage (ordered funnel)
  stage              text        NOT NULL DEFAULT 'new',
  -- new | qualified | nurture | applied | checkout_started |
  -- paid_awaiting_approval | approved | converted | lost

  status             text        NOT NULL DEFAULT 'open',
  -- open | won | lost

  priority           text        NOT NULL DEFAULT 'normal',
  -- normal | high | urgent

  qualified          boolean,
  funding_interest   boolean,
  self_pay_interest  boolean,

  -- Links to other system objects (nullable — populated as funnel progresses)
  application_id     uuid        REFERENCES public.applications(id)        ON DELETE SET NULL,
  profile_id         uuid        REFERENCES public.profiles(id)            ON DELETE SET NULL,
  enrollment_id      uuid        REFERENCES public.program_enrollments(id) ON DELETE SET NULL,
  owner_user_id      uuid        REFERENCES public.profiles(id)            ON DELETE SET NULL,

  notes              text
  , UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_stage    ON public.crm_leads(stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status   ON public.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_priority ON public.crm_leads(priority);
CREATE INDEX IF NOT EXISTS idx_crm_leads_app_id   ON public.crm_leads(application_id);

-- Follow-up reminders — task queue for the CRM.
-- Separate from follow_ups (JRI case management) and followup_schedule (program scheduling).

CREATE TABLE IF NOT EXISTS public.follow_up_reminders (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  due_at             timestamptz NOT NULL,
  status             text        NOT NULL DEFAULT 'pending',
  -- pending | completed | dismissed

  type               text        NOT NULL,
  -- qualified-lead-follow-up | application-unpaid-24h | paid-applicant-approval

  lead_id            uuid        REFERENCES public.crm_leads(id)    ON DELETE CASCADE,
  application_id     uuid        REFERENCES public.applications(id) ON DELETE CASCADE,
  assigned_user_id   uuid        REFERENCES public.profiles(id)     ON DELETE SET NULL,
  note               text
);

CREATE INDEX IF NOT EXISTS idx_fur_status     ON public.follow_up_reminders(status);
CREATE INDEX IF NOT EXISTS idx_fur_due_at     ON public.follow_up_reminders(due_at);
CREATE INDEX IF NOT EXISTS idx_fur_lead_id    ON public.follow_up_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_fur_app_id     ON public.follow_up_reminders(application_id);
