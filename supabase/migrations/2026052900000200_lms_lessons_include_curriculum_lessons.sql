-- Rebuild lms_lessons view to prioritize curriculum_lessons over course_lessons.
--
-- Key fixes vs previous version:
-- 1. Cast step_type to TEXT (curriculum_lessons uses an enum, course_lessons uses text)
-- 2. Resolve module_id from course_modules via module_order join — curriculum_lessons
--    has a FK to the 'modules' table, not 'course_modules', so we can't store
--    course_modules.id directly. The view resolves it at query time.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE VIEW public.lms_lessons AS

-- ── 1. curriculum_lessons (priority) ─────────────────────────────────────────
SELECT
  cl.id,
  cl.course_id,
  (cl.module_order * 1000 + cl.lesson_order)  AS order_index,
  cl.lesson_order                              AS lesson_number,
  cl.lesson_title                              AS title,
  cl.script_text                               AS content,
  NULL::TEXT                                   AS rendered_html,
  cl.step_type::TEXT                           AS step_type,
  cl.step_type::TEXT                           AS content_type,
  cl.lesson_slug                               AS slug,
  cl.lesson_slug                               AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  NULL::JSONB                                  AS activities,
  NULL::JSONB                                  AS video_config,
  cm.id                                        AS module_id,
  cm.title                                     AS module_title,
  cl.module_order,
  cl.lesson_order,
  cl.duration_minutes,
  (cl.status = 'published')                    AS is_published,
  cl.status,
  'curriculum'::TEXT                           AS lesson_source,
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
LEFT JOIN public.course_modules cm
  ON cm.course_id = cl.course_id
  AND cm.order_index = cl.module_order

UNION ALL

-- ── 2. course_lessons fallback (courses not in curriculum_lessons) ────────────
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.order_index                               AS lesson_number,
  cl.title,
  (cl.content#>>'{}')                          AS content,
  cl.rendered_html,
  cl.lesson_type::TEXT                         AS step_type,
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
  'canonical'::TEXT                            AS lesson_source,
  cl.created_at,
  cl.updated_at,
  cl.partner_exam_code,
  cl.video_url,
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
