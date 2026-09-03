-- Table Consolidation Migration
-- Merges overlapping/duplicate tables into canonical ones.
-- Strategy per family:
--   1. Merge any unique data from aliases into canonical
--   2. Drop empty alias tables
--   3. Create views where code still references old names (zero-downtime)
--   4. Add missing columns to canonical tables so nothing is lost
--
-- SAFE: no canonical data is deleted. All merges use INSERT ... ON CONFLICT DO NOTHING.
-- Apply in Supabase Dashboard → SQL Editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 1: ENROLLMENTS
-- Canonical: program_enrollments (461 code refs, 12 rows, full schema)
-- enrollments: VIEW over program_enrollments — already correct, keep as-is
-- course_enrollments: 3 rows, different schema (LMS course assignments) — keep separate
-- training_enrollments: 1 row, HVAC legacy — merge into program_enrollments then drop
-- apprenticeship_enrollments: 0 rows — drop
-- cohort_enrollments: 0 rows — drop
-- ─────────────────────────────────────────────────────────────────────────────

-- Merge training_enrollments → program_enrollments (1 row, no conflict risk)
INSERT INTO public.program_enrollments (
  id, user_id, program_id, program_slug, status, enrolled_at,
  completed_at, progress_percent, funding_source, cohort_id,
  docs_verified, orientation_completed_at, documents_submitted_at,
  confirmed_at, agreement_signed, course_id, created_at, updated_at
)
SELECT
  id,
  user_id,
  program_id,
  program_slug,
  status,
  enrolled_at,
  completed_at,
  progress,
  funding_source,
  cohort_id,
  docs_verified,
  orientation_completed_at,
  documents_submitted_at,
  confirmed_at,
  agreement_signed,
  course_id_uuid,
  COALESCE(enrolled_at, now()),
  COALESCE(updated_at, now())
FROM public.training_enrollments
WHERE id NOT IN (SELECT id FROM public.program_enrollments)
ON CONFLICT (id) DO NOTHING;

-- Drop empty/merged alias tables
DROP TABLE IF EXISTS public.training_enrollments CASCADE;
DROP TABLE IF EXISTS public.apprenticeship_enrollments CASCADE;
DROP TABLE IF EXISTS public.cohort_enrollments CASCADE;

-- Recreate enrollments view pointing to canonical table (was already a view)
CREATE OR REPLACE VIEW public.enrollments AS
SELECT
  id,
  user_id,
  student_id,
  program_id,
  program_slug,
  status,
  enrollment_state,
  enrolled_at,
  completed_at,
  progress_percent,
  funding_source,
  cohort_id,
  created_at,
  updated_at
FROM public.program_enrollments;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 2: AUDIT LOGS
-- Canonical: audit_logs (69 code refs, 61,660 rows)
-- admin_audit_events: 203 rows, slightly different schema — merge in
-- admin_audit_log: 0 rows — drop
-- ai_audit_log: 0 rows — drop
-- ─────────────────────────────────────────────────────────────────────────────

-- Add columns to audit_logs that admin_audit_events has but audit_logs may not
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS old_data jsonb,
  ADD COLUMN IF NOT EXISTS new_data jsonb;

-- Merge admin_audit_events → audit_logs
INSERT INTO public.audit_logs (
  id, action, actor_id, actor_role, target_type, target_id,
  metadata, ip_address, created_at, entity_type, entity_id,
  old_data, new_data
)
SELECT
  id,
  action,
  COALESCE(actor_user_id, actor_id),
  actor_role,
  COALESCE(target_type, entity_type),
  COALESCE(target_id, entity_id),
  metadata,
  ip_address,
  created_at,
  entity_type,
  entity_id,
  old_data,
  new_data
FROM public.admin_audit_events
WHERE id NOT IN (SELECT id FROM public.audit_logs)
ON CONFLICT (id) DO NOTHING;

-- Drop empty/merged alias tables
DROP TABLE IF EXISTS public.admin_audit_events CASCADE;
DROP TABLE IF EXISTS public.admin_audit_log CASCADE;
DROP TABLE IF EXISTS public.ai_audit_log CASCADE;

-- View alias so any remaining admin_audit_events refs still work
CREATE OR REPLACE VIEW public.admin_audit_events AS
SELECT
  id,
  action,
  actor_id AS actor_user_id,
  actor_id,
  actor_role,
  target_type,
  target_id,
  metadata,
  ip_address,
  created_at,
  entity_type,
  entity_id,
  old_data,
  new_data
FROM public.audit_logs;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 3: PROFILES
-- Canonical: profiles (43 rows, full schema, auth.users FK)
-- user_profiles: 1 row, subset of profiles columns — merge in, drop
-- instructor_profiles: 0 rows — drop
-- student_profiles / staff_profiles / preparer_profiles: MISSING — nothing to do
-- ─────────────────────────────────────────────────────────────────────────────

-- Merge user_profiles → profiles (fill in any gaps)
UPDATE public.profiles p
SET
  bio        = COALESCE(p.bio, up.bio),
  avatar_url = COALESCE(p.avatar_url, up.avatar_url),
  phone      = COALESCE(p.phone, up.phone),
  address    = COALESCE(p.address, up.address),
  city       = COALESCE(p.city, up.city),
  state      = COALESCE(p.state, up.state),
  zip        = COALESCE(p.zip, up.zip_code),
  updated_at = now()
FROM public.user_profiles up
WHERE up.user_id = p.id
  AND (up.bio IS NOT NULL OR up.phone IS NOT NULL OR up.address IS NOT NULL);

DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.instructor_profiles CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 4: PROGRESS
-- Canonical: lesson_progress (LMS engine canonical, 0 rows but referenced by engine)
--            course_progress (1 row, different concern — keep separate)
-- module_progress: 0 rows — drop (lesson_progress covers this)
-- user_progress: 0 rows — drop (redundant with lesson_progress)
-- video_progress: 0 rows — drop (video state goes in lesson_progress metadata)
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.module_progress CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.video_progress CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 5: NOTIFICATIONS
-- Canonical: notifications (6 rows, full schema)
-- admin_notifications: 0 rows — drop, use notifications with type filter
-- apprentice_notifications: 0 rows — drop
-- alert_notifications: 0 rows — drop
-- announcement_recipients: 0 rows — drop (use announcements table)
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.admin_notifications CASCADE;
DROP TABLE IF EXISTS public.apprentice_notifications CASCADE;
DROP TABLE IF EXISTS public.alert_notifications CASCADE;
DROP TABLE IF EXISTS public.announcement_recipients CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 6: DOCUMENTS
-- Canonical: documents (135 rows, full schema with OCR, verification, metadata)
-- user_documents: 0 rows — drop (use documents with user_id filter)
-- enrollment_documents: 0 rows — drop (use documents with enrollment_id filter)
-- apprentice_documents: 0 rows — drop (use documents with owner_type='apprentice')
-- compliance_documents: 0 rows — drop (use documents with document_type='compliance')
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.user_documents CASCADE;
DROP TABLE IF EXISTS public.enrollment_documents CASCADE;
DROP TABLE IF EXISTS public.apprentice_documents CASCADE;
DROP TABLE IF EXISTS public.compliance_documents CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 7: APPRENTICE HOURS
-- Canonical: apprenticeship_hours (6 rows, full schema)
-- apprentice_hours: 0 rows — drop
-- apprentice_hours_log: 0 rows — drop
-- apprentice_hours_by_shop: 0 rows — drop (this is a view/aggregate concern)
-- apprentice_hours_by_source: 1 row (view/aggregate) — drop, recompute from apprenticeship_hours
-- apprentice_hour_totals: 1 row (view/aggregate) — drop, recompute from apprenticeship_hours
-- apprenticeship_hours_summary: 6 rows (materialized summary) — keep as view
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.apprentice_hours CASCADE;
DROP TABLE IF EXISTS public.apprentice_hours_log CASCADE;
DROP TABLE IF EXISTS public.apprentice_hours_by_shop CASCADE;
DROP TABLE IF EXISTS public.apprentice_hours_by_source CASCADE;
DROP TABLE IF EXISTS public.apprentice_hour_totals CASCADE;

-- Replace apprenticeship_hours_summary with a live view over apprenticeship_hours
DROP TABLE IF EXISTS public.apprenticeship_hours_summary CASCADE;
CREATE OR REPLACE VIEW public.apprenticeship_hours_summary AS
SELECT
  student_id,
  program_slug,
  date_trunc('week', COALESCE(date_worked, date))::date AS week_start,
  SUM(COALESCE(hours_worked, hours, 0))                  AS total_hours,
  SUM(CASE WHEN status = 'approved'  THEN COALESCE(hours_worked, hours, 0) ELSE 0 END) AS approved_hours,
  SUM(CASE WHEN status = 'pending'   THEN COALESCE(hours_worked, hours, 0) ELSE 0 END) AS pending_hours,
  SUM(CASE WHEN status = 'disputed'  THEN COALESCE(hours_worked, hours, 0) ELSE 0 END) AS disputed_hours,
  COUNT(*)                                               AS entry_count
FROM public.apprenticeship_hours
GROUP BY student_id, program_slug, date_trunc('week', COALESCE(date_worked, date));

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 8: COMPLIANCE
-- Canonical: compliance_items (24 rows — platform compliance checklist)
-- admin_compliance_status: 43 rows — this is a VIEW/report, not a table
--   Keep it but convert to a live view over profiles
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.admin_compliance_status CASCADE;
CREATE OR REPLACE VIEW public.admin_compliance_status AS
SELECT
  p.id                                                    AS user_id,
  p.email,
  p.full_name,
  p.role,
  CASE
    WHEN p.onboarding_completed THEN 'complete'
    WHEN p.onboarding_started   THEN 'in_progress'
    ELSE 'not_started'
  END                                                     AS onboarding_status,
  CASE WHEN p.agreements_signed_at IS NOT NULL THEN true ELSE false END AS agreements_signed,
  (SELECT COUNT(*) FROM public.documents d
   WHERE d.user_id = p.id)::int                           AS documents_uploaded,
  (SELECT COUNT(*) FROM public.documents d
   WHERE d.user_id = p.id AND d.verification_status = 'verified')::int AS documents_verified,
  p.onboarding_completed_at,
  CASE WHEN p.agreements_signed_at IS NOT NULL THEN 1 ELSE 0 END AS total_agreements_signed,
  (SELECT COUNT(*) FROM public.documents d
   WHERE d.user_id = p.id AND d.verification_status = 'verified')::int AS verified_documents_count,
  p.agreements_signed_at                                  AS last_agreement_signed
FROM public.profiles p
WHERE p.role IN ('student','learner','apprentice','staff','admin','instructor');

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 9: SETTINGS
-- Canonical: platform_settings (57 rows, key/value store)
-- user_preferences: 0 rows — drop (use profiles.notification_preferences jsonb)
-- notification_preferences: 0 rows — drop (same)
-- feature_flags: 0 rows — drop (use platform_settings with key prefix 'feature.')
-- system_settings: MISSING — nothing to do
-- user_settings: MISSING — nothing to do
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.feature_flags CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY 10: MISSING TABLES — create stubs for tables referenced in code
-- These were in migrations but never applied. Create minimal versions now.
-- ─────────────────────────────────────────────────────────────────────────────

-- wioa_cases (referenced by workforce board portal)
CREATE TABLE IF NOT EXISTS public.wioa_cases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  case_number     text UNIQUE,
  status          text NOT NULL DEFAULT 'open',
  program_id      uuid REFERENCES public.programs(id),
  assigned_staff  uuid REFERENCES public.profiles(id),
  opened_at       timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz,
  notes           text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wioa_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage wioa_cases"
  ON public.wioa_cases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));

-- workforce_board_cases (referenced by workforce board portal)
CREATE TABLE IF NOT EXISTS public.workforce_board_cases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wioa_case_id    uuid REFERENCES public.wioa_cases(id),
  participant_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'active',
  board_notes     text,
  review_date     date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workforce_board_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage workforce_board_cases"
  ON public.workforce_board_cases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));

-- workforce_board_participants (referenced by workforce board portal)
CREATE TABLE IF NOT EXISTS public.workforce_board_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         uuid REFERENCES public.workforce_board_cases(id) ON DELETE CASCADE,
  profile_id      uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'participant',
  joined_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workforce_board_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage workforce_board_participants"
  ON public.workforce_board_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));

-- workforce_board_notes (referenced by workforce board portal)
CREATE TABLE IF NOT EXISTS public.workforce_board_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         uuid REFERENCES public.workforce_board_cases(id) ON DELETE CASCADE,
  author_id       uuid REFERENCES public.profiles(id),
  note            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workforce_board_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage workforce_board_notes"
  ON public.workforce_board_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));

-- rag_embeddings (AI knowledge retrieval)
CREATE TABLE IF NOT EXISTS public.rag_embeddings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type     text NOT NULL,
  source_id       text NOT NULL,
  content         text NOT NULL,
  embedding       vector(1536),
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id)
);
ALTER TABLE public.rag_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage rag_embeddings"
  ON public.rag_embeddings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

-- ai_planner_tasks (AI planner)
CREATE TABLE IF NOT EXISTS public.ai_planner_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'pending',
  priority        text NOT NULL DEFAULT 'normal',
  assigned_to     uuid REFERENCES public.profiles(id),
  due_date        date,
  metadata        jsonb DEFAULT '{}',
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_planner_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage ai_planner_tasks"
  ON public.ai_planner_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- payout_queue (referenced in code, missing from DB)
CREATE TABLE IF NOT EXISTS public.payout_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   uuid REFERENCES public.program_enrollments(id),
  recipient_id    uuid REFERENCES public.profiles(id),
  amount_cents    integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending',
  payout_method   text,
  notes           text,
  paid_at         timestamptz,
  paid_by         uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payout_queue"
  ON public.payout_queue FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- tenant_configurations (platform engine)
CREATE TABLE IF NOT EXISTS public.tenant_configurations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text UNIQUE NOT NULL,
  brand_name      text NOT NULL,
  domain          text,
  industry        text,
  features        jsonb DEFAULT '[]',
  theme           jsonb DEFAULT '{}',
  config          jsonb DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage tenant_configurations"
  ON public.tenant_configurations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT tablename, 'TABLE' AS kind FROM pg_tables WHERE schemaname='public'
-- UNION ALL
-- SELECT viewname, 'VIEW' FROM pg_views WHERE schemaname='public'
-- ORDER BY 1;
