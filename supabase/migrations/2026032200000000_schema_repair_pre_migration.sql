-- =============================================================================
-- Pre-migration schema repair
--
-- Adds columns and constraints that migrations 000003–000007 require but are
-- absent from the live database. Run this BEFORE 000003–000007.
--
-- Verified against live DB (cuxzzpsyufcewtmicszk) on 2026-03-22.
-- All statements use IF NOT EXISTS — safe to run multiple times.
-- No existing columns, constraints, or data are modified or dropped.
--
-- What is NOT done here (handled by numbered migrations):
--   exam_funding_authorizations  → 000006 (new table)
--   credential_exam_domains      → 000004 (new table)
--   credential_registry seed     → 000007 (new rows)
--
-- Do NOT touch the credentials table. It is an API keys table, not the
-- workforce registry. The workforce registry is credential_registry.
-- =============================================================================

-- =============================================================================
-- 1. completion_rules — add missing columns
--
-- Live: id, entity_type, entity_id, rule_type, config (jsonb), is_active, created_at
-- Missing: threshold_value, is_required, notes
-- Required by: migration 000003 (CHECK constraints), migration 000005 (seed)
-- =============================================================================

ALTER TABLE public.completion_rules
  ADD COLUMN IF NOT EXISTS threshold_value INTEGER,
  ADD COLUMN IF NOT EXISTS is_required     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes           TEXT;

-- Partial unique index required by migration 000005 ON CONFLICT clause.
-- Live index covers only (entity_type, entity_id) — missing rule_type.
CREATE UNIQUE INDEX IF NOT EXISTS uq_completion_rules_active
  ON public.completion_rules (entity_type, entity_id, rule_type)
  WHERE is_active = true;

-- =============================================================================
-- 2. modules — add slug column + unique constraint
--
-- Live: id, program_id, title, summary, order_index, created_at, updated_at,
--       description, tenant_id, course_id
-- Missing: slug
-- Required by: migration 000003 (UNIQUE index), curriculum-generator.ts
-- =============================================================================

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slug for existing rows before adding NOT NULL + unique constraint.
-- Derives slug from title; appends 8-char UUID prefix to prevent collisions
-- between modules with identical titles across different programs.
UPDATE public.modules
SET slug = LOWER(
             REGEXP_REPLACE(
               REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'),
               '\s+', '-', 'g'
             )
           ) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

ALTER TABLE public.modules
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_modules_program_slug
  ON public.modules (program_id, slug);

-- =============================================================================
-- 3. curriculum_lessons — add credential_domain_id column
--
-- Live: 22 columns, no credential_domain_id
-- Required by: migration 000004 (adds FK), curriculum-generator.ts
-- =============================================================================

ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS credential_domain_id UUID;

-- =============================================================================
-- 4. curriculum_quizzes — add (lesson_id, quiz_order) unique constraint
--
-- Live: pkey + non-unique index on lesson_id only
-- Required by: migration 000003, curriculum-generator.ts ON CONFLICT
--
-- IMPORTANT: If duplicate (lesson_id, quiz_order) pairs exist in the live DB,
-- this statement will fail. Resolve duplicates manually before running.
-- Check with:
--   SELECT lesson_id, quiz_order, COUNT(*)
--   FROM public.curriculum_quizzes
--   GROUP BY lesson_id, quiz_order HAVING COUNT(*) > 1;
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_curriculum_quizzes_order
  ON public.curriculum_quizzes (lesson_id, quiz_order);

-- =============================================================================
-- 5. curriculum_recaps — add (lesson_id, recap_order) unique constraint
--
-- Live: pkey only
-- Required by: migration 000003, curriculum-generator.ts ON CONFLICT
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_curriculum_recaps_order
  ON public.curriculum_recaps (lesson_id, recap_order);

-- =============================================================================
-- 6. program_credentials — add missing columns
--
-- Live: id, program_id, credential_id, is_required, sort_order, notes, created_at
-- Missing: is_primary, exam_fee_payer, exam_fee_cents, passing_score
-- Required by: migration 000005 (seed), checkCertificateIssuanceEligibility()
-- =============================================================================

ALTER TABLE public.program_credentials
  ADD COLUMN IF NOT EXISTS is_primary     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exam_fee_payer TEXT
    CHECK (exam_fee_payer IN ('self_pay','elevate','grant','employer','partner','scholarship'))
    DEFAULT 'self_pay',
  ADD COLUMN IF NOT EXISTS exam_fee_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS passing_score  INTEGER DEFAULT 70;

-- =============================================================================
-- 7. programs — add non_exam_program column
--
-- Live: column does not exist
-- Required by: migration 000003, checkCertificateIssuanceEligibility()
-- =============================================================================

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS non_exam_program BOOLEAN NOT NULL DEFAULT false;

-- =============================================================================
-- 8. credential_attempts — add attempt_status column
--
-- Live: id, learner_id, credential_id, program_id, attempt_number,
--       attempted_at, completed_at, score, passed, proctor_id,
--       proctor_notes, credential_issued_id, metadata
-- Missing: attempt_status
-- Required by: credential-pipeline.ts (SELECT includes this column)
-- =============================================================================

ALTER TABLE public.credential_attempts
  ADD COLUMN IF NOT EXISTS attempt_status TEXT
    CHECK (attempt_status IN ('scheduled','in_progress','completed','no_show','cancelled'))
    DEFAULT 'scheduled';
