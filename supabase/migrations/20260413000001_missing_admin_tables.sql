-- Missing tables referenced by admin pages with no prior migration.
-- All pages already handle query errors gracefully (empty fallback).
-- Apply in Supabase Dashboard → SQL Editor.

-- ── 1. workflows ─────────────────────────────────────────────────────────────
-- Used by: /admin/workflows, /admin/autopilot
CREATE TABLE IF NOT EXISTS public.workflows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',   -- draft | active | paused | archived
  category      TEXT,                             -- enrollment | compliance | notification | etc.
  trigger_type  TEXT,                             -- manual | schedule | event
  trigger_config JSONB,
  steps         JSONB DEFAULT '[]',
  run_count     INTEGER NOT NULL DEFAULT 0,
  last_run_at   TIMESTAMPTZ,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows (status);

-- ── 2. automation_rules ───────────────────────────────────────────────────────
-- Used by: /admin/autopilot
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',  -- draft | active | paused
  trigger_type    TEXT,                            -- enrollment | application | schedule | event
  trigger_config  JSONB,
  action_type     TEXT,                            -- send_email | update_status | create_task | etc.
  action_config   JSONB,
  run_count       INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_automation_rules_status ON public.automation_rules (status);

-- ── 3. email_automations ──────────────────────────────────────────────────────
-- Used by: /admin/email-marketing/automation
CREATE TABLE IF NOT EXISTS public.email_automations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  trigger_event TEXT,                              -- enrollment | application_approved | inactivity | etc.
  delay_hours   INTEGER NOT NULL DEFAULT 0,
  subject       TEXT,
  html_body     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  sent_count    INTEGER NOT NULL DEFAULT 0,
  open_count    INTEGER NOT NULL DEFAULT 0,
  click_count   INTEGER NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. financial_assurance_records ───────────────────────────────────────────
-- Used by: /admin/compliance/financial-assurance
CREATE TABLE IF NOT EXISTS public.financial_assurance_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assurance_type    TEXT NOT NULL,                 -- surety_bond | insurance | letter_of_credit
  provider_name     TEXT,
  policy_number     TEXT,
  amount_cents      BIGINT,
  effective_date    DATE,
  expiration_date   DATE,
  status            TEXT NOT NULL DEFAULT 'active', -- active | expired | cancelled
  document_url      TEXT,
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_financial_assurance_expiration
  ON public.financial_assurance_records (expiration_date)
  WHERE status = 'active';

-- ── 5. mou_documents ─────────────────────────────────────────────────────────
-- Used by: /admin/docs/mou
CREATE TABLE IF NOT EXISTS public.mou_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  version         TEXT,
  document_status TEXT NOT NULL DEFAULT 'draft',   -- draft | active | superseded | archived
  document_type   TEXT NOT NULL DEFAULT 'mou',     -- mou | addendum | amendment
  storage_path    TEXT,
  signed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signed_at       TIMESTAMPTZ,
  effective_date  DATE,
  expiration_date DATE,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6. social_campaigns ──────────────────────────────────────────────────────
-- Used by: /admin/social-media
CREATE TABLE IF NOT EXISTS public.social_campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',     -- draft | scheduled | active | completed | paused
  platform      TEXT,                              -- facebook | instagram | twitter | linkedin | all
  content       TEXT,
  media_urls    JSONB DEFAULT '[]',
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  reach         INTEGER,
  impressions   INTEGER,
  clicks        INTEGER,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 7. v_admin_financial_assurance_summary (view) ────────────────────────────
-- Used by: /admin/compliance/financial-assurance
-- Must be created AFTER financial_assurance_records table above.
CREATE OR REPLACE VIEW public.v_admin_financial_assurance_summary AS
SELECT
  COUNT(*)                                                                    AS total_records,
  COUNT(*) FILTER (WHERE status = 'active')                                  AS active_count,
  COUNT(*) FILTER (WHERE status = 'expired')                                 AS expired_count,
  COUNT(*) FILTER (WHERE expiration_date < now() AND status = 'active')      AS expiring_soon_count,
  COALESCE(SUM(f.amount_cents) FILTER (WHERE f.status = 'active'), 0)        AS total_coverage_cents,
  MAX(updated_at)                                                             AS last_updated_at
FROM public.financial_assurance_records f;

-- ── 8. Missing columns on program_enrollments ────────────────────────────────
-- Admin enrollments page queries: access_granted_at, at_risk, amount_paid_cents
-- approve.ts writes: amount_paid_cents (already in original CREATE TABLE)
-- Admin dashboard reads: amount_paid_cents, payment_status (already added)
-- These are the remaining gaps:

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS at_risk            BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_granted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrollment_state   TEXT        NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS program_slug       TEXT;

CREATE INDEX IF NOT EXISTS idx_program_enrollments_at_risk
  ON public.program_enrollments (at_risk) WHERE at_risk = true;

CREATE INDEX IF NOT EXISTS idx_program_enrollments_access
  ON public.program_enrollments (access_granted_at) WHERE access_granted_at IS NULL;

-- ── 9. Missing columns on lesson_progress ────────────────────────────────────
-- progress/complete route queries: lesson_progress.course_id, time_spent_seconds
-- lesson_progress was created with (user_id, course_slug, lesson_id) — no course_id UUID

ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS course_id          UUID,
  ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id
  ON public.lesson_progress (course_id);

-- ── 10. lms_progress table ───────────────────────────────────────────────────
-- progress/complete writes to lms_progress (not lesson_progress).
-- This table tracks per-course completion state, separate from per-lesson progress.
CREATE TABLE IF NOT EXISTS public.lms_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id         UUID,
  course_slug       TEXT,
  status            TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | completed
  progress_percent  NUMERIC(5,2) NOT NULL DEFAULT 0,
  completed_at      TIMESTAMPTZ,
  evidence_url      TEXT,
  last_activity_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_lms_progress_user ON public.lms_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_course ON public.lms_progress (course_id);
