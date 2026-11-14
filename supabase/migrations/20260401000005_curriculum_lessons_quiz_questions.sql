-- Add quiz_questions to curriculum_lessons and backfill HVAC data.
--
-- Background: curriculum_lessons had no quiz_questions column. The lms_lessons
-- view returned NULL for this field on curriculum_lessons rows, breaking the
-- quiz player for HVAC checkpoint lessons after the training_lessons migration.
--
-- This migration:
--   1. Adds quiz_questions jsonb column (nullable)
--   2. Backfills HVAC rows from training_lessons by matching lesson_number to slug suffix
--   3. Recreates lms_lessons view to expose cl.quiz_questions and cl.passing_score

-- 1. Add column
ALTER TABLE curriculum_lessons
  ADD COLUMN IF NOT EXISTS quiz_questions jsonb;

-- 2. Backfill HVAC quiz_questions from training_lessons
--    Match: curriculum_lessons.lesson_slug = 'hvac-lesson-' || training_lessons.lesson_number
UPDATE curriculum_lessons cl
SET quiz_questions = tl.quiz_questions
FROM training_lessons tl
WHERE cl.lesson_slug = 'hvac-lesson-' || tl.lesson_number::text
  AND tl.quiz_questions IS NOT NULL
  AND cl.quiz_questions IS NULL;

-- 3. Recreate lms_lessons view with quiz_questions and passing_score from curriculum_lessons
CREATE OR REPLACE VIEW lms_lessons AS
  SELECT
    cl.id,
    cl.course_id,
    ((cl.module_order * 1000) + cl.lesson_order) AS lesson_number,
    cl.lesson_title                               AS title,
    cl.script_text                                AS content,
    cl.video_file                                 AS video_url,
    cl.duration_minutes,
    NULL::text[]                                  AS topics,
    cl.quiz_questions,
    cl.created_at,
    cl.updated_at,
    cl.course_id                                  AS course_id_uuid,
    ((cl.module_order * 1000) + cl.lesson_order)  AS order_index,
    true                                          AS is_required,
    (cl.status = 'published')                     AS is_published,
    cl.step_type::text                            AS content_type,
    NULL::uuid                                    AS quiz_id,
    cl.passing_score,
    NULL::text                                    AS description,
    NULL::uuid                                    AS tenant_id,
    NULL::text                                    AS html,
    cl.lesson_slug                                AS idx,
    ((cl.module_order * 1000) + cl.lesson_order)::text AS order_number,
    cl.module_id,
    cl.program_id,
    'curriculum'::text                            AS lesson_source,
    cl.credential_domain_id,
    cl.step_type::text                            AS step_type,
    m.title                                       AS module_title,
    cl.module_order,
    cl.lesson_order
  FROM curriculum_lessons cl
  LEFT JOIN modules m ON m.id = cl.module_id
  WHERE cl.course_id IS NOT NULL
    AND cl.lesson_slug NOT LIKE '%-smoke-%'

UNION ALL

  SELECT
    tl.id,
    tl.course_id,
    tl.lesson_number,
    tl.title,
    tl.content,
    tl.video_url,
    tl.duration_minutes,
    tl.topics,
    tl.quiz_questions,
    tl.created_at,
    tl.updated_at,
    tl.course_id_uuid,
    tl.order_index,
    tl.is_required,
    tl.is_published,
    tl.content_type,
    tl.quiz_id,
    tl.passing_score,
    tl.description,
    tl.tenant_id,
    tl.html,
    tl.idx,
    tl.order_number,
    tl.module_id,
    tl.program_id,
    'training'::text                              AS lesson_source,
    NULL::uuid                                    AS credential_domain_id,
    'lesson'::text                                AS step_type,
    NULL::text                                    AS module_title,
    NULL::integer                                 AS module_order,
    NULL::integer                                 AS lesson_order
  FROM training_lessons tl
  WHERE NOT EXISTS (
    SELECT 1 FROM curriculum_lessons cl2
    WHERE cl2.course_id = tl.course_id
      AND cl2.status = 'published'
      AND cl2.lesson_slug NOT LIKE '%-smoke-%'
  );
