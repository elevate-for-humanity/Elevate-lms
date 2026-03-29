-- Add rendered_html column to course_lessons
-- Stores pre-rendered HTML from transformLessonContent() at write time.
-- NULL for legacy rows — lesson page falls back to runtime transform.

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS rendered_html TEXT;

COMMENT ON COLUMN public.course_lessons.rendered_html IS
  'HTML produced by transformLessonContent() at write time. NULL for legacy rows — lesson page falls back to runtime transform.';

-- Rebuild lms_lessons view to expose rendered_html.
-- Must DROP first because CREATE OR REPLACE cannot reorder existing columns.
DROP VIEW IF EXISTS public.lms_lessons;

CREATE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.order_index                        AS lesson_number,
  cl.title,
  (cl.content ->> '{}'::text)           AS content,
  cl.rendered_html,
  cl.lesson_type                        AS step_type,
  (cl.lesson_type)::text                AS content_type,
  cl.slug                               AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cm.title                              AS module_title,
  COALESCE(cm.order_index, 0)           AS module_order,
  NULL::integer                         AS lesson_order,
  cl.duration_minutes,
  cl.is_published,
  cl.status,
  'canonical'::text                     AS lesson_source,
  cl.created_at,
  cl.updated_at
FROM course_lessons cl
LEFT JOIN course_modules cm ON cm.id = cl.module_id;
