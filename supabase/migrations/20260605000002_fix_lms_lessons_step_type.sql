-- Migration: 20260605000002
--
-- Fixes lms_lessons view:
--   1. step_type: course_lessons uses lesson_type (enum), not step_type.
--      COALESCE(cl.lesson_type::text, cur.step_type::text, 'lesson')
--   2. content: course_lessons.content is jsonb; cast to text for UNION.
--   3. lesson_source: updated to 'course_lessons' (was hardcoded 'curriculum').
--   4. Non-existent columns on course_lessons replaced with NULL casts.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  NULL::integer                                                  AS lesson_number,
  cl.title,
  cl.content::text                                               AS content,
  cl.rendered_html,
  COALESCE(NULLIF(cl.video_url, ''), cur.video_file)            AS video_url,
  COALESCE(cl.lesson_type::text, cur.step_type::text, 'lesson') AS step_type,
  cl.lesson_type::text                                           AS content_type,
  cl.slug,
  cur.lesson_slug,
  COALESCE(cl.passing_score, cur.passing_score)                 AS passing_score,
  COALESCE(cl.quiz_questions, cur.quiz_questions)               AS quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cm.title                                                       AS module_title,
  cm.order_index                                                 AS module_order,
  cl.order_index                                                 AS lesson_order,
  cl.duration_minutes,
  cl.is_published,
  cl.status,
  'course_lessons'::text                                         AS lesson_source,
  cl.created_at,
  cl.updated_at,
  cl.partner_exam_code,
  NULL::uuid                                                     AS quiz_id,
  NULL::text                                                     AS description,
  NULL::jsonb                                                    AS resources,
  NULL::text                                                     AS scorm_package_id,
  NULL::text                                                     AS scorm_launch_path
FROM public.course_lessons cl
LEFT JOIN public.curriculum_lessons cur
  ON  cur.lesson_slug = cl.slug
  AND cur.course_id   = cl.course_id
LEFT JOIN public.course_modules cm
  ON  cm.id = cl.module_id

UNION ALL

SELECT
  tl.id,
  tl.course_id,
  tl.order_index,
  tl.lesson_number,
  tl.title,
  tl.content,
  NULL::text                                                     AS rendered_html,
  tl.video_url,
  COALESCE(tl.lesson_type::text, 'lesson')                      AS step_type,
  tl.content_type::text                                          AS content_type,
  NULL::text                                                     AS slug,
  NULL::text                                                     AS lesson_slug,
  tl.passing_score,
  tl.quiz_questions,
  NULL::jsonb                                                    AS activities,
  NULL::jsonb                                                    AS video_config,
  tl.module_id,
  NULL::text                                                     AS module_title,
  NULL::integer                                                  AS module_order,
  tl.order_index                                                 AS lesson_order,
  tl.duration_minutes,
  tl.is_published,
  NULL::text                                                     AS status,
  'training'::text                                               AS lesson_source,
  tl.created_at,
  tl.updated_at,
  NULL::text                                                     AS partner_exam_code,
  tl.quiz_id,
  tl.description,
  NULL::jsonb                                                    AS resources,
  NULL::text                                                     AS scorm_package_id,
  NULL::text                                                     AS scorm_launch_path
FROM public.training_lessons tl
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_lessons cl2
  WHERE cl2.course_id = tl.course_id
);

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;
