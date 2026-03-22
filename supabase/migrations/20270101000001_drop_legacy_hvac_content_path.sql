-- NO-OP DOCUMENTATION MIGRATION
-- Target retirement window: 2027-Q1
-- training_lessons remains read-only archive. No destructive DDL here.
-- Only the HVAC legacy content path in LessonContentRenderer.tsx is candidate for removal.
--
-- Run these queries in Supabase Dashboard SQL Editor to verify all prerequisites
-- before executing the retirement PR. All queries must return zero problem rows.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- CHECK 1: All HVAC video lessons have video_file set
-- Expected: missing_video_file = 0
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  'verify_hvac_video_coverage'                                          AS check_name,
  COUNT(*)  FILTER (WHERE lesson_type = 'video')                        AS total_video_lessons,
  COUNT(*)  FILTER (
    WHERE lesson_type = 'video'
      AND (video_file IS NULL OR btrim(video_file::text) = '')
  )                                                                     AS missing_video_file
FROM public.curriculum_lessons
WHERE course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0';

-- ─────────────────────────────────────────────────────────────────────────────
-- CHECK 2: All HVAC assessment lessons have quiz_questions backfilled
-- Expected: incomplete_assessments = 0
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  'verify_hvac_quiz_backfill'                                           AS check_name,
  COUNT(*)                                                              AS total_assessments,
  COUNT(*) FILTER (
    WHERE quiz_questions IS NULL
       OR jsonb_typeof(quiz_questions) <> 'array'
       OR jsonb_array_length(quiz_questions) = 0
  )                                                                     AS incomplete_assessments
FROM public.curriculum_lessons
WHERE course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
  AND lesson_type IN ('quiz', 'checkpoint', 'final_exam');

-- ─────────────────────────────────────────────────────────────────────────────
-- CHECK 3: lms_lessons view serves HVAC from curriculum_lessons only
-- Expected: no rows with lesson_source = 'training'
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  'verify_lms_lessons_hvac_source'                                      AS check_name,
  lesson_source,
  COUNT(*)                                                              AS row_count
FROM public.lms_lessons
WHERE course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
GROUP BY lesson_source;
-- Expected result: one row — curriculum | 95

-- ─────────────────────────────────────────────────────────────────────────────
-- CHECK 4: lms_lessons view definition no longer references training_lessons
-- Expected: definition contains 'curriculum_lessons', does NOT contain 'training_lessons'
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  'verify_lms_lessons_view_definition'                                  AS check_name,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname   = 'lms_lessons';

-- ─────────────────────────────────────────────────────────────────────────────
-- CHECK 5: No HVAC simulation keys reference legacy prefixes
-- Expected: invalid_legacy_keys = 0
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  'verify_hvac_simulation_keys'                                         AS check_name,
  COUNT(*)                                                              AS total_rows,
  COUNT(*) FILTER (
    WHERE simulation_key LIKE 'legacy_%'
       OR simulation_key LIKE '%training_lessons%'
  )                                                                     AS invalid_legacy_keys
FROM public.curriculum_lessons
WHERE course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
  AND simulation_key IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- POST-RETIREMENT: After the retirement PR merges, run this to confirm
-- training_lessons HVAC rows are archived and untouched.
-- Expected: 95 rows retained
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT COUNT(*) AS hvac_training_rows_retained
-- FROM public.training_lessons
-- WHERE course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0';
-- Uncomment and run after retirement to confirm archive integrity.

SELECT 'HVAC legacy retirement prerequisite queries — run each block above' AS instructions;
