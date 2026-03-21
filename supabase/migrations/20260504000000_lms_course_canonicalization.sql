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
CREATE OR REPLACE VIEW public.lms_lessons AS
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
INSERT INTO public.course_modules (
  id, course_id, slug, title, description, order_index, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  c.id,
  m.slug,
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
ON CONFLICT (course_id, slug) DO NOTHING;

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
JOIN public.programs p ON p.id = cl.program_id
JOIN public.courses  c ON c.program_id = p.id
-- match to course_modules via the modules table slug
JOIN public.modules  m ON m.program_id = p.id AND m.order_index = cl.module_order
JOIN public.course_modules cm ON cm.course_id = c.id AND cm.slug = m.slug
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
-- STEP 5c — HARD FAIL if any program has zero course_lessons
-- ------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.slug, COUNT(cl2.id) AS lesson_count
    FROM public.programs p
    JOIN public.courses c ON c.program_id = p.id
    LEFT JOIN public.course_lessons cl2 ON cl2.course_id = c.id
    WHERE p.slug IN (
      'peer-recovery-specialist-jri',
      'certified-recovery-specialist',
      'bookkeeping'
    )
    GROUP BY p.slug
  LOOP
    IF r.lesson_count = 0 THEN
      RAISE EXCEPTION
        'PROMOTION_FAILED: % has 0 course_lessons after promotion. '
        'Ensure curriculum_lessons are seeded and status=published before running this migration.',
        r.slug;
    END IF;
    RAISE NOTICE 'STEP 5c PASSED: % has % course_lessons', r.slug, r.lesson_count;
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
