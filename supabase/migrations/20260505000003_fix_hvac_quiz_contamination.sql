-- ============================================================
-- FIX HVAC QUIZ CONTAMINATION
--
-- Root cause: migration 20260401000005 backfilled quiz_questions
-- into course_lessons by matching on slug pattern alone, without
-- a program_id guard. This allowed non-HVAC quiz questions
-- (QuickBooks, NRF, CPR) to be written into HVAC course_lessons rows.
--
-- This migration:
--   1. NULLs quiz_questions on all HVAC course_lessons rows
--      EXCEPT hvac-lesson-6 (manually seeded with correct data).
--   2. Restores correct quiz_questions from training_lessons
--      by matching lesson_number extracted from the slug.
--   3. Leaves hvac-lesson-6 untouched (already has correct data).
--
-- After this runs, every HVAC course_lesson with quiz_questions
-- will have questions sourced exclusively from training_lessons
-- for the hvac-technician program.
--
-- Apply via Supabase Dashboard SQL Editor.
-- ============================================================

DO $$
DECLARE
  v_hvac_course_id  UUID;
  v_hvac_program_id UUID;
  v_fixed           INTEGER := 0;
  v_nulled          INTEGER := 0;
  rec               RECORD;
  v_lesson_num      INTEGER;
  v_tl_questions    JSONB;
BEGIN
  -- Resolve HVAC program and course IDs
  SELECT id INTO v_hvac_program_id FROM public.programs WHERE slug = 'hvac-technician';
  IF v_hvac_program_id IS NULL THEN
    RAISE EXCEPTION 'hvac-technician program not found';
  END IF;

  SELECT id INTO v_hvac_course_id
  FROM public.courses WHERE program_id = v_hvac_program_id LIMIT 1;
  IF v_hvac_course_id IS NULL THEN
    RAISE EXCEPTION 'No course found for hvac-technician';
  END IF;

  -- Process every HVAC course_lesson that has quiz_questions,
  -- except hvac-lesson-6 which was manually seeded correctly.
  FOR rec IN
    SELECT cl.id, cl.slug
    FROM public.course_lessons cl
    WHERE cl.course_id = v_hvac_course_id
      AND cl.quiz_questions IS NOT NULL
      AND cl.slug != 'hvac-lesson-6'  -- already correct, skip
    ORDER BY cl.order_index
  LOOP
    -- Extract lesson number from slug: 'hvac-lesson-N' → N
    v_lesson_num := (regexp_match(rec.slug, 'hvac-lesson-(\d+)'))[1]::INTEGER;

    IF v_lesson_num IS NULL THEN
      RAISE NOTICE 'Could not extract lesson number from slug: %', rec.slug;
      CONTINUE;
    END IF;

    -- Look up quiz_questions from training_lessons by lesson_number + program_id
    -- This is the only safe join: program_id + lesson_number, never slug alone.
    SELECT tl.quiz_questions INTO v_tl_questions
    FROM public.training_lessons tl
    WHERE tl.program_id = v_hvac_program_id
      AND tl.lesson_number = v_lesson_num
      AND tl.quiz_questions IS NOT NULL
      AND jsonb_typeof(tl.quiz_questions) = 'array'
    LIMIT 1;

    IF v_tl_questions IS NOT NULL AND jsonb_array_length(v_tl_questions) > 0 THEN
      -- Restore from training_lessons source
      UPDATE public.course_lessons
      SET quiz_questions = v_tl_questions,
          updated_at     = now()
      WHERE id = rec.id;
      v_fixed := v_fixed + 1;
      RAISE NOTICE 'Restored: % (lesson_number=%)', rec.slug, v_lesson_num;
    ELSE
      -- No matching training_lessons row — NULL out the contaminated data
      -- rather than leave wrong questions in place.
      UPDATE public.course_lessons
      SET quiz_questions = NULL,
          updated_at     = now()
      WHERE id = rec.id;
      v_nulled := v_nulled + 1;
      RAISE NOTICE 'Nulled (no source): % (lesson_number=%)', rec.slug, v_lesson_num;
    END IF;
  END LOOP;

  RAISE NOTICE 'HVAC quiz fix complete: % restored from training_lessons, % nulled (no source)',
    v_fixed, v_nulled;
END $$;

-- ── Verification ──────────────────────────────────────────────────────────────
-- After running, confirm no non-HVAC questions remain.
-- Run this manually to verify:
--
-- SELECT cl.slug, (cl.quiz_questions->0->>'question') AS first_q
-- FROM course_lessons cl
-- JOIN courses c ON c.id = cl.course_id
-- JOIN programs p ON p.id = c.program_id
-- WHERE p.slug = 'hvac-technician'
--   AND cl.quiz_questions IS NOT NULL
--   AND (
--     (cl.quiz_questions->0->>'question') ILIKE '%quickbooks%'
--     OR (cl.quiz_questions->0->>'question') ILIKE '%accounting%'
--     OR (cl.quiz_questions->0->>'question') ILIKE '%payroll%'
--     OR (cl.quiz_questions->0->>'question') ILIKE '%nrf%'
--     OR (cl.quiz_questions->0->>'question') ILIKE '%cpr%'
--   );
-- Expected: 0 rows.
