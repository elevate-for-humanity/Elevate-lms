-- ============================================================
-- LMS CANONICALIZATION MIGRATION (PRS + CRS + BOOKKEEPING)
-- This migration:
-- 1. Creates missing courses rows (one per program, idempotent)
-- 2. Backfills curriculum_lessons.course_id via program_id
--    — fixes both NULL course_id AND ghost course_id values
--      (e.g. PRS lessons seeded with a hardcoded UUID that was
--       never inserted into the courses table)
-- 3. Enforces invariant: no NULL course_id for LMS programs
--
-- NOTE: curriculum_lessons uses program_id (UUID), not program_slug.
-- All joins go through programs.id resolved from programs.slug.
--
-- Apply manually via Supabase Dashboard SQL Editor.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- STEP 0 — Fix lms_lessons view: expose order_index by name
--
-- The view created in 20260402000007 aliases cl.order_index as
-- lesson_number. The course page queries .order('order_index') and
-- the Lesson interface expects order_index — both break silently
-- when the column is only available as lesson_number.
--
-- This replacement keeps lesson_number for backward compatibility
-- and adds order_index as a direct alias so sort and interface work.
-- ------------------------------------------------------------
DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.order_index                          AS lesson_number,
  cl.title,
  (cl.content#>>'{}')                     AS content,
  cl.lesson_type                          AS step_type,
  cl.lesson_type::TEXT                    AS content_type,
  cl.slug                                 AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.module_id,
  cm.title                                AS module_title,
  COALESCE(cm.order_index, cm."order")    AS module_order,
  cl.order_index - (COALESCE(cm.order_index, cm."order") * 1000) AS lesson_order,
  NULL::INTEGER                           AS duration_minutes,
  'canonical'                             AS lesson_source,
  cl.created_at,
  cl.updated_at
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id;

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

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
-- STEP 2 — Create missing courses rows (one per program)
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

-- Report what exists after insert
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
--
-- Fixes two cases:
--   a) course_id IS NULL — lesson was seeded without a course row
--   b) course_id references a UUID not in the courses table —
--      lesson was seeded with a hardcoded ghost ID (e.g. PRS seed
--      script previously used a constant that was never inserted)
--
-- Joins via program_id (UUID) — not program_slug.
-- ------------------------------------------------------------
UPDATE public.curriculum_lessons cl
SET
  course_id  = c.id,
  updated_at = now()
FROM public.programs p
JOIN public.courses c ON c.program_id = p.id
WHERE cl.program_id = p.id
  AND p.slug IN (
    'peer-recovery-specialist-jri',
    'certified-recovery-specialist',
    'bookkeeping'
  )
  AND (
    cl.course_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM public.courses WHERE id = cl.course_id
    )
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
    RAISE NOTICE 'Bound: slug=%, lessons=%', r.slug, r.lesson_count;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- STEP 4 — HARD FAIL if any lessons still have NULL or ghost course_id
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
  AND (
    cl.course_id IS NULL
    OR NOT EXISTS (SELECT 1 FROM public.courses WHERE id = cl.course_id)
  );

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'COURSE_ID_BACKFILL_FAILED: % lessons still have NULL or ghost course_id', missing_count;
  END IF;

  RAISE NOTICE 'STEP 4 PASSED: all lessons have a valid course_id';
END $$;

-- ------------------------------------------------------------
-- STEP 5 — Promote curriculum_lessons → course_modules + course_lessons
--
-- lms_lessons view reads from course_lessons (not curriculum_lessons).
-- This step makes PRS, CRS, and Bookkeeping lessons visible in the LMS.
--
-- Promotion is idempotent:
--   course_modules: ON CONFLICT (course_id, slug) DO NOTHING
--   course_lessons: ON CONFLICT (course_id, slug) DO NOTHING
-- ------------------------------------------------------------

-- 5a. Promote modules table rows → course_modules
-- course_modules has no slug column; use (course_id, order_index) as identity.
INSERT INTO public.course_modules (
  id, course_id, title, description, order_index, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  c.id,
  m.title,
  COALESCE(m.description, m.summary),
  m.order_index,
  now(),
  now()
FROM public.modules m
JOIN public.programs p ON p.id = m.program_id
JOIN public.courses  c ON c.program_id = p.id
WHERE p.slug IN (
  'peer-recovery-specialist-jri',
  'certified-recovery-specialist',
  'bookkeeping'
)
-- Skip if a module with this order_index already exists for this course
AND NOT EXISTS (
  SELECT 1 FROM public.course_modules cm
  WHERE cm.course_id = c.id AND cm.order_index = m.order_index
);

-- 5b. Promote curriculum_lessons → course_lessons
-- order_index encodes position as (module_order * 1000 + lesson_order)
-- matching the convention used by the HVAC promotion in 20260402000006.
INSERT INTO public.course_lessons (
  id, course_id, module_id, legacy_lesson_id, slug, title,
  content, lesson_type, order_index, passing_score, quiz_questions,
  is_required, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  c.id,
  cm.id,
  cl.id,
  cl.lesson_slug,
  cl.lesson_title,
  CASE
    WHEN cl.script_text IS NOT NULL THEN to_jsonb(cl.script_text)
    ELSE NULL
  END,
  CASE cl.step_type
    WHEN 'quiz'          THEN 'quiz'::public.lesson_type
    WHEN 'checkpoint'    THEN 'checkpoint'::public.lesson_type
    WHEN 'lab'           THEN 'lab'::public.lesson_type
    WHEN 'assignment'    THEN 'assignment'::public.lesson_type
    WHEN 'exam'          THEN 'exam'::public.lesson_type
    WHEN 'certification' THEN 'certification'::public.lesson_type
    ELSE 'lesson'::public.lesson_type
  END,
  (cl.module_order * 1000 + cl.lesson_order),
  cl.passing_score,
  cl.quiz_questions,
  true,
  now(),
  now()
FROM public.curriculum_lessons cl
JOIN public.programs p  ON p.id  = cl.program_id
JOIN public.courses  c  ON c.program_id = p.id
-- Join through modules.id (curriculum_lessons.module_id is always set for these programs)
-- then match to course_modules by order_index — avoids 0-based vs 1-based offset ambiguity
JOIN public.modules  m  ON m.id  = cl.module_id
JOIN public.course_modules cm ON cm.course_id = c.id AND cm.order_index = m.order_index
WHERE p.slug IN (
  'peer-recovery-specialist-jri',
  'certified-recovery-specialist',
  'bookkeeping'
)
AND cl.status = 'published'
ON CONFLICT (course_id, slug) DO NOTHING;

-- Report promotion counts
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.slug, COUNT(DISTINCT cm.id) AS module_count, COUNT(cl2.id) AS lesson_count
    FROM public.programs p
    JOIN public.courses c ON c.program_id = p.id
    LEFT JOIN public.course_modules cm ON cm.course_id = c.id
    LEFT JOIN public.course_lessons cl2 ON cl2.course_id = c.id
    WHERE p.slug IN (
      'peer-recovery-specialist-jri',
      'certified-recovery-specialist',
      'bookkeeping'
    )
    GROUP BY p.slug
  LOOP
    RAISE NOTICE 'Promoted: slug=% | course_modules=% | course_lessons=%',
      r.slug, r.module_count, r.lesson_count;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- STEP 5c — Correctness assertions (not just existence)
--
-- Checks, per program:
--   1. course row exists and program_id is correctly linked
--   2. course_modules exist and their course_id matches the course
--   3. course_lessons exist and their course_id matches the course
--   4. every course_lesson has a non-null module_id pointing to a
--      course_modules row in the same course (no orphaned lessons)
--   5. every course_module has at least one lesson (no empty modules)
--   6. course_lessons.slug matches the source curriculum_lessons.lesson_slug
--      (detects slug drift / wrong-program promotion)
--   7. lesson count matches the published curriculum_lessons count
--      (detects partial promotion)
-- ------------------------------------------------------------
DO $$
DECLARE
  r              RECORD;
  v_course_id    UUID;
  v_prog_id      UUID;
  v_mod_count    INTEGER;
  v_lesson_count INTEGER;
  v_orphans      INTEGER;
  v_empty_mods   INTEGER;
  v_slug_drift   INTEGER;
  v_expected     INTEGER;
BEGIN
  FOR r IN
    SELECT p.id AS program_id, p.slug AS program_slug, c.id AS course_id
    FROM public.programs p
    JOIN public.courses c ON c.program_id = p.id
    WHERE p.slug IN (
      'peer-recovery-specialist-jri',
      'certified-recovery-specialist',
      'bookkeeping'
    )
  LOOP
    v_prog_id   := r.program_id;
    v_course_id := r.course_id;

    -- 1. course.program_id must equal programs.id
    IF v_course_id IS NULL THEN
      RAISE EXCEPTION 'INTEGRITY_FAIL [%]: no courses row linked to program', r.program_slug;
    END IF;

    -- 2. course_modules count
    SELECT COUNT(*) INTO v_mod_count
    FROM public.course_modules
    WHERE course_id = v_course_id;

    IF v_mod_count = 0 THEN
      RAISE EXCEPTION
        'INTEGRITY_FAIL [%]: 0 course_modules — modules were not promoted',
        r.program_slug;
    END IF;

    -- 3. course_lessons count
    SELECT COUNT(*) INTO v_lesson_count
    FROM public.course_lessons
    WHERE course_id = v_course_id;

    IF v_lesson_count = 0 THEN
      RAISE EXCEPTION
        'INTEGRITY_FAIL [%]: 0 course_lessons — curriculum_lessons were not promoted. '
        'Run the seed script for this program before applying this migration.',
        r.program_slug;
    END IF;

    -- 4. Orphaned lessons: course_lesson.module_id is NULL or points outside this course
    SELECT COUNT(*) INTO v_orphans
    FROM public.course_lessons cl
    WHERE cl.course_id = v_course_id
      AND (
        cl.module_id IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM public.course_modules cm
          WHERE cm.id = cl.module_id AND cm.course_id = v_course_id
        )
      );

    IF v_orphans > 0 THEN
      RAISE EXCEPTION
        'INTEGRITY_FAIL [%]: % course_lessons have NULL or cross-course module_id',
        r.program_slug, v_orphans;
    END IF;

    -- 5. Empty modules: every course_module must have at least one lesson
    SELECT COUNT(*) INTO v_empty_mods
    FROM public.course_modules cm
    WHERE cm.course_id = v_course_id
      AND NOT EXISTS (
        SELECT 1 FROM public.course_lessons cl
        WHERE cl.module_id = cm.id
      );

    IF v_empty_mods > 0 THEN
      RAISE EXCEPTION
        'INTEGRITY_FAIL [%]: % course_modules have 0 lessons',
        r.program_slug, v_empty_mods;
    END IF;

    -- 6. Slug drift: every course_lesson.slug must exist in curriculum_lessons.lesson_slug
    --    for this program — detects wrong-program promotion
    SELECT COUNT(*) INTO v_slug_drift
    FROM public.course_lessons cl
    WHERE cl.course_id = v_course_id
      AND NOT EXISTS (
        SELECT 1 FROM public.curriculum_lessons src
        WHERE src.program_id = v_prog_id
          AND src.lesson_slug = cl.slug
      );

    IF v_slug_drift > 0 THEN
      RAISE EXCEPTION
        'INTEGRITY_FAIL [%]: % course_lessons have slugs not found in curriculum_lessons '
        'for this program — possible wrong-program promotion',
        r.program_slug, v_slug_drift;
    END IF;

    -- 7. Count parity: course_lessons must equal published curriculum_lessons
    SELECT COUNT(*) INTO v_expected
    FROM public.curriculum_lessons
    WHERE program_id = v_prog_id
      AND status = 'published';

    IF v_lesson_count <> v_expected THEN
      RAISE EXCEPTION
        'INTEGRITY_FAIL [%]: course_lessons=% but published curriculum_lessons=% — partial promotion',
        r.program_slug, v_lesson_count, v_expected;
    END IF;

    RAISE NOTICE 'STEP 5c PASSED [%]: course_id=% | modules=% | lessons=% | orphans=0 | slug_drift=0',
      r.program_slug, v_course_id, v_mod_count, v_lesson_count;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- STEP 6 — Invariant trigger: prevent future NULL course_id
-- on curriculum_lessons belonging to programs that have a courses row
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
-- STEP 7 — Final verification report (full chain)
-- Counts course_lessons (the serving layer read by lms_lessons view).
-- ------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== CANONICALIZATION VERIFICATION ===';
  FOR r IN
    SELECT
      p.slug,
      c.id                          AS course_id,
      c.status                      AS course_status,
      COUNT(DISTINCT cm.id)         AS module_count,
      COUNT(cl2.id)                 AS lesson_count
    FROM public.programs p
    LEFT JOIN public.courses       c   ON c.program_id  = p.id
    LEFT JOIN public.course_modules cm ON cm.course_id  = c.id
    LEFT JOIN public.course_lessons cl2 ON cl2.course_id = c.id
    WHERE p.slug IN (
      'peer-recovery-specialist-jri',
      'certified-recovery-specialist',
      'bookkeeping'
    )
    GROUP BY p.slug, c.id, c.status
    ORDER BY p.slug
  LOOP
    RAISE NOTICE 'slug=% | course_id=% | status=% | modules=% | course_lessons=%',
      r.slug, r.course_id, r.course_status, r.module_count, r.lesson_count;
  END LOOP;
  RAISE NOTICE '=== END VERIFICATION ===';
END $$;

COMMIT;
