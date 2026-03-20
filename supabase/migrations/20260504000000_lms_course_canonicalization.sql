-- ============================================================
-- LMS CANONICALIZATION MIGRATION (PRS + CRS + BOOKKEEPING)
-- This migration:
-- 1. Creates missing courses rows
-- 2. Backfills curriculum_lessons.course_id via program_id
-- 3. Enforces invariant: no NULL course_id for LMS programs
--
-- NOTE: curriculum_lessons uses program_id (UUID), not program_slug.
-- All joins go through programs.id resolved from programs.slug.
--
-- Apply manually via Supabase Dashboard SQL Editor.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- STEP 1 — Verify programs exist (fail fast if missing)
-- ------------------------------------------------------------
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.programs
  WHERE slug IN (
    'peer-recovery-specialist-jri',
    'certified-recovery-specialist',
    'bookkeeping'
  );

  RAISE NOTICE 'Found % of 3 expected programs', v_count;

  IF v_count < 1 THEN
    RAISE EXCEPTION 'CANONICALIZATION_BLOCKED: no target programs found. Check slugs.';
  END IF;
END $$;

-- ------------------------------------------------------------
-- STEP 2 — Create missing courses rows
-- ------------------------------------------------------------
INSERT INTO public.courses (id, program_id, slug, title, status, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  p.id,
  p.slug,
  p.title,
  'published'::public.course_status,
  true,
  now(),
  now()
FROM public.programs p
LEFT JOIN public.courses c ON c.program_id = p.id
WHERE p.slug IN (
  'peer-recovery-specialist-jri',
  'certified-recovery-specialist',
  'bookkeeping'
)
AND c.id IS NULL;

-- Report what was created
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.slug, c.id AS course_id
    FROM public.programs p
    JOIN public.courses c ON c.program_id = p.id
    WHERE p.slug IN (
      'peer-recovery-specialist-jri',
      'certified-recovery-specialist',
      'bookkeeping'
    )
  LOOP
    RAISE NOTICE 'courses row: slug=%, course_id=%', r.slug, r.course_id;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- STEP 3 — Backfill curriculum_lessons.course_id
-- Joins via program_id (UUID) — not program_slug (does not exist)
-- ------------------------------------------------------------
UPDATE public.curriculum_lessons cl
SET
  course_id  = c.id,
  updated_at = now()
FROM public.programs p
JOIN public.courses c ON c.program_id = p.id
WHERE cl.program_id = p.id
  AND cl.course_id IS NULL
  AND p.slug IN (
    'peer-recovery-specialist-jri',
    'certified-recovery-specialist',
    'bookkeeping'
  );

-- Report backfill counts
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.slug, COUNT(cl.id) AS lesson_count
    FROM public.programs p
    JOIN public.courses c ON c.program_id = p.id
    JOIN public.curriculum_lessons cl ON cl.course_id = c.id
    WHERE p.slug IN (
      'peer-recovery-specialist-jri',
      'certified-recovery-specialist',
      'bookkeeping'
    )
    GROUP BY p.slug
  LOOP
    RAISE NOTICE 'Backfilled: slug=%, lessons=%', r.slug, r.lesson_count;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- STEP 4 — HARD FAIL if any lessons still have NULL course_id
-- ------------------------------------------------------------
DO $$
DECLARE
  missing_count integer;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM public.curriculum_lessons cl
  JOIN public.programs p ON p.id = cl.program_id
  WHERE p.slug IN (
    'peer-recovery-specialist-jri',
    'certified-recovery-specialist',
    'bookkeeping'
  )
  AND cl.course_id IS NULL;

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'COURSE_ID_BACKFILL_FAILED: % lessons still have NULL course_id', missing_count;
  END IF;

  RAISE NOTICE 'STEP 4 PASSED: all lessons have course_id set';
END $$;

-- ------------------------------------------------------------
-- STEP 5 — Invariant trigger: prevent future NULL course_id
-- on lessons belonging to programs that have a courses row
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_course_id_not_null()
RETURNS trigger AS $$
DECLARE
  v_has_course boolean;
BEGIN
  -- Only enforce if the program already has a courses row
  SELECT EXISTS (
    SELECT 1 FROM public.courses WHERE program_id = NEW.program_id
  ) INTO v_has_course;

  IF v_has_course AND NEW.course_id IS NULL THEN
    RAISE EXCEPTION
      'COURSE_ID_REQUIRED: curriculum_lesson for program % must have course_id set. '
      'Program has a courses row — backfill course_id before inserting.',
      NEW.program_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_course_id_not_null ON public.curriculum_lessons;

CREATE TRIGGER trg_enforce_course_id_not_null
  BEFORE INSERT OR UPDATE ON public.curriculum_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_course_id_not_null();

-- ------------------------------------------------------------
-- STEP 6 — Final verification report
-- ------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== CANONICALIZATION VERIFICATION ===';
  FOR r IN
    SELECT
      p.slug,
      c.id        AS course_id,
      c.status    AS course_status,
      COUNT(cl.id) AS lesson_count
    FROM public.programs p
    LEFT JOIN public.courses c ON c.program_id = p.id
    LEFT JOIN public.curriculum_lessons cl ON cl.course_id = c.id
    WHERE p.slug IN (
      'peer-recovery-specialist-jri',
      'certified-recovery-specialist',
      'bookkeeping'
    )
    GROUP BY p.slug, c.id, c.status
    ORDER BY p.slug
  LOOP
    RAISE NOTICE 'slug=% | course_id=% | status=% | lessons=%',
      r.slug, r.course_id, r.course_status, r.lesson_count;
  END LOOP;
  RAISE NOTICE '=== END VERIFICATION ===';
END $$;

COMMIT;
