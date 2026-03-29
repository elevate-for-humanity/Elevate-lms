-- Update lms_lessons view to include curriculum_lessons rows.
-- curriculum_lessons takes priority: if a course_id has rows in
-- curriculum_lessons, those are used. course_lessons rows for the
-- same course_id are excluded (NOT EXISTS guard).
--
-- Column mapping:
--   curriculum_lessons          → view column
--   lesson_slug                 → slug / lesson_slug
--   lesson_title                → title
--   step_type                   → step_type / content_type
--   module_order                → module_order
--   lesson_order                → lesson_order
--   (module_order*1000+lesson_order) → order_index
--   script_text                 → content
--   video_file                  → video_url
--   passing_score               → passing_score
--   quiz_questions              → quiz_questions
--   duration_minutes            → duration_minutes
--   status                      → status / is_published

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS

-- ── 1. curriculum_lessons (priority source) ───────────────────────────────────
SELECT
  cl.id,
  cl.course_id,
  (cl.module_order * 1000 + cl.lesson_order)  AS order_index,
  cl.lesson_order                              AS lesson_number,
  cl.lesson_title                              AS title,
  cl.script_text                               AS content,
  cl.step_type,
  cl.step_type::TEXT                           AS content_type,
  cl.lesson_slug                               AS slug,
  cl.lesson_slug                               AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  NULL::JSONB                                  AS activities,
  NULL::JSONB                                  AS video_config,
  cl.module_id,
  NULL::TEXT                                   AS module_title,
  cl.module_order,
  cl.lesson_order,
  cl.duration_minutes,
  (cl.status = 'published')                    AS is_published,
  cl.status,
  'curriculum'                                 AS lesson_source,
  cl.created_at,
  cl.updated_at,
  NULL::TEXT                                   AS partner_exam_code,
  cl.video_file                                AS video_url,
  NULL::UUID                                   AS quiz_id,
  NULL::TEXT                                   AS description,
  NULL::JSONB                                  AS resources,
  NULL::TEXT                                   AS scorm_package_id,
  NULL::TEXT                                   AS scorm_launch_path
FROM public.curriculum_lessons cl

UNION ALL

-- ── 2. course_lessons fallback (only for courses not in curriculum_lessons) ───
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.order_index                               AS lesson_number,
  cl.title,
  (cl.content#>>'{}')                          AS content,
  cl.lesson_type                               AS step_type,
  cl.lesson_type::TEXT                         AS content_type,
  cl.slug,
  cl.slug                                      AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cm.title                                     AS module_title,
  COALESCE(cm.order_index, 0)                  AS module_order,
  NULL::INTEGER                                AS lesson_order,
  NULL::INTEGER                                AS duration_minutes,
  cl.is_published,
  cl.status,
  'canonical'                                  AS lesson_source,
  cl.created_at,
  cl.updated_at,
  cl.partner_exam_code,
  NULL::TEXT                                   AS video_url,
  NULL::UUID                                   AS quiz_id,
  NULL::TEXT                                   AS description,
  NULL::JSONB                                  AS resources,
  NULL::TEXT                                   AS scorm_package_id,
  NULL::TEXT                                   AS scorm_launch_path
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.curriculum_lessons cur
  WHERE cur.course_id = cl.course_id
);

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;
