-- Backfill hour_entries from legacy hours tables
-- Idempotent: uses legacy_source + legacy_id to prevent duplicates on re-run.
-- As of 2026-03-01, all legacy tables contain 0 rows.
-- This migration exists for correctness if legacy data appears via direct DB inserts.

-- 1. training_hours → hour_entries
-- Schema: id, user_id, course_id, lesson_id, hours (numeric), completed, status, date, created_at
INSERT INTO public.hour_entries (
  user_id, source_type, work_date, hours_claimed, status,
  entered_by_email, entered_at,
  legacy_source, legacy_id
)
SELECT
  th.user_id,
  'rti',
  th.date,
  COALESCE(th.hours, 0),
  COALESCE(th.status, 'pending'),
  COALESCE(th.user_id::text, ''),
  COALESCE(th.created_at, now()),
  'training_hours',
  th.id
FROM public.training_hours th
WHERE th.id IS NOT NULL
  AND COALESCE(th.hours, 0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.hour_entries he
    WHERE he.legacy_source = 'training_hours' AND he.legacy_id = th.id
  );

-- 2. apprenticeship_hours → hour_entries
-- Schema: id, student_id, shop_id, partner_id, date_worked, date, week_ending,
--         hours (numeric), hours_worked (numeric), program_slug, program_id,
--         category, description, notes, approved (bool), approved_by, approved_at,
--         rejection_reason, status, submitted_by, submitted_at, created_at, updated_at
INSERT INTO public.hour_entries (
  user_id, source_type, work_date, hours_claimed, category, notes, status,
  entered_by_email, entered_at, approved_by, approved_at,
  rejection_reason, program_slug, legacy_source, legacy_id
)
SELECT
  ah.student_id,
  CASE WHEN ah.category = 'on-the-job' THEN 'ojt' ELSE 'rti' END,
  COALESCE(ah.date_worked, ah.date),
  COALESCE(ah.hours, ah.hours_worked, 0),
  ah.category,
  COALESCE(ah.notes, ah.description),
  CASE
    WHEN ah.approved = true THEN 'approved'
    WHEN ah.status IN ('approved', 'rejected', 'pending') THEN ah.status
    ELSE 'pending'
  END,
  COALESCE(ah.student_id::text, ''),
  COALESCE(ah.created_at, now()),
  ah.approved_by::text,
  ah.approved_at,
  ah.rejection_reason,
  ah.program_slug,
  'apprenticeship_hours',
  ah.id
FROM public.apprenticeship_hours ah
WHERE ah.id IS NOT NULL
  AND COALESCE(ah.hours, ah.hours_worked, 0) > 0
  AND ah.student_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.hour_entries he
    WHERE he.legacy_source = 'apprenticeship_hours' AND he.legacy_id = ah.id
  );

-- 3. hours_logs → SKIPPED
-- Schema: id, activity_type, date (timestamp), description, hours (integer), status, created_at, updated_at
-- This table has NO user_id column. The hour_entries table requires either user_id or
-- apprentice_application_id (CHECK constraint: user_or_apprentice). Without a user mapping,
-- these rows cannot be migrated. Table is empty as of 2026-03-01.
-- If data appears, a manual mapping step is required before backfill.

-- 4. apprentice_hours_log → hour_entries
-- Schema: id, user_id, action, details (jsonb), ip_address, created_at, updated_at,
--         description, funding_phase, hour_type, logged_date (timestamp), minutes (integer), status, verified_by
-- Note: minutes is integer → convert to hours. ROUND(m/60.0, 2) preserves precision.
-- Note: NO enrollment_id, log_date, start_at, end_at columns exist in production.
INSERT INTO public.hour_entries (
  user_id, source_type, work_date, hours_claimed, notes, status, category,
  entered_by_email, entered_at,
  legacy_source, legacy_id
)
SELECT
  ahl.user_id,
  CASE WHEN ahl.hour_type = 'OJT' THEN 'ojt' ELSE 'rti' END,
  COALESCE(ahl.logged_date::date, ahl.created_at::date),
  ROUND(COALESCE(ahl.minutes, 0) / 60.0, 2),
  ahl.description,
  CASE
    WHEN ahl.status = 'APPROVED' THEN 'approved'
    WHEN ahl.status = 'REJECTED' THEN 'rejected'
    WHEN ahl.status = 'LOCKED' THEN 'approved'
    ELSE 'pending'
  END,
  LOWER(COALESCE(ahl.funding_phase, '')),
  COALESCE(ahl.user_id::text, ''),
  COALESCE(ahl.created_at, now()),
  'apprentice_hours_log',
  ahl.id
FROM public.apprentice_hours_log ahl
WHERE ahl.id IS NOT NULL
  AND ahl.user_id IS NOT NULL
  AND COALESCE(ahl.minutes, 0) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.hour_entries he
    WHERE he.legacy_source = 'apprentice_hours_log' AND he.legacy_id = ahl.id
  );

-- Note: progress_entries (GPS timeclock shifts) are NOT backfilled.
-- They are shift-level telemetry, not certified training hours.
