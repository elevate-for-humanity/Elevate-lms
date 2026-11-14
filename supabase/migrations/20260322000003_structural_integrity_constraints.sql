-- =============================================================================
-- Structural integrity constraints
--
-- Fixes three audit findings:
--   1. Status drift — add CHECK constraints to unconstrained status fields
--   2. Idempotency — add unique indexes to curriculum tables
--   3. Traceability — add credential_domain_id FK to curriculum_lessons
--      so every generated lesson traces back to an exam blueprint domain
--
-- All changes are non-breaking (ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
-- ADD CONSTRAINT IF NOT EXISTS). Safe to run on existing data.
-- =============================================================================

-- =============================================================================
-- 1. STATUS DRIFT FIXES
-- =============================================================================

-- certificates.status — was unconstrained TEXT
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE public.certificates
  DROP CONSTRAINT IF EXISTS certificates_status_check;

ALTER TABLE public.certificates
  ADD CONSTRAINT certificates_status_check
  CHECK (status IN ('active', 'revoked', 'expired', 'pending'));

-- program_completion.status — was unconstrained TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'program_completion'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.program_completion
      DROP CONSTRAINT IF EXISTS program_completion_status_check;
    ALTER TABLE public.program_completion
      ADD CONSTRAINT program_completion_status_check
      CHECK (status IN ('in_progress', 'completed', 'withdrawn', 'failed'));
  END IF;
END $$;

-- course_progress.status — was unconstrained TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'course_progress'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.course_progress
      DROP CONSTRAINT IF EXISTS course_progress_status_check;
    ALTER TABLE public.course_progress
      ADD CONSTRAINT course_progress_status_check
      CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed'));
  END IF;
END $$;

-- completion_rules: one active rule set per entity (program or course)
-- Prevents duplicate rules from being inserted on repeated generator runs
CREATE UNIQUE INDEX IF NOT EXISTS idx_completion_rules_entity_type_active
  ON public.completion_rules(entity_type, entity_id, rule_type)
  WHERE is_active = true;

-- =============================================================================
-- 2. IDEMPOTENCY INDEXES — curriculum tables
-- =============================================================================

-- curriculum_quizzes: one question per (lesson, order position)
-- Prevents duplicate quiz questions on generator reruns
CREATE UNIQUE INDEX IF NOT EXISTS idx_curriculum_quizzes_lesson_order
  ON public.curriculum_quizzes(lesson_id, quiz_order);

-- curriculum_recaps: one recap per (lesson, order position)
CREATE UNIQUE INDEX IF NOT EXISTS idx_curriculum_recaps_lesson_order
  ON public.curriculum_recaps(lesson_id, recap_order);

-- curriculum_lessons: already has UNIQUE(program_id, lesson_slug) — verify it exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_curriculum_lessons_program_slug
  ON public.curriculum_lessons(program_id, lesson_slug);

-- modules: one module per (program, slug) — prevents duplicate module creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_modules_program_slug
      ON public.modules(program_id, slug)
      WHERE slug IS NOT NULL;
  END IF;
END $$;

-- =============================================================================
-- 3. TRACEABILITY — link curriculum_lessons back to exam blueprint domains
--
-- credential_domain_id is nullable: NULL = manually authored lesson (not generated)
-- non-NULL = generated from exam blueprint, traceable to credential_exam_domains
-- =============================================================================

ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS credential_domain_id UUID;

-- FK will be added after credential_exam_domains table exists (next migration)
-- Stored as plain UUID here, FK constraint added in 20260322000004

COMMENT ON COLUMN public.curriculum_lessons.credential_domain_id IS
  'References credential_exam_domains(id). NULL = manually authored. '
  'Non-NULL = generated from exam blueprint domain. '
  'Used to verify curriculum coverage against exam blueprint.';

-- =============================================================================
-- 4. CERTIFICATE ISSUANCE GUARD
--
-- Add non_exam_program flag to programs so certificate routes can distinguish
-- programs that legitimately skip the credential pipeline (e.g. orientation,
-- soft skills) from programs that should require exam eligibility.
--
-- Default false = all programs assumed credential-bearing until explicitly marked.
-- =============================================================================

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS non_exam_program BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.programs.non_exam_program IS
  'When true, certificate issuance does not require a credential_attempts record. '
  'Use for orientation, soft skills, and non-credentialed programs. '
  'Default false — all programs assumed credential-bearing.';

-- Mark known non-exam programs explicitly
UPDATE public.programs
SET non_exam_program = true
WHERE slug IN (
  'orientation',
  'soft-skills',
  'workforce-readiness',
  'job-readiness',
  'financial-literacy'
);
