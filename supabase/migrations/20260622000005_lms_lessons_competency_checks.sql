-- Expose competency_checks in lms_lessons view.
--
-- The lesson page reads competency_checks to pass competencyKey to StepSubmissionForm.
-- Without this column in the view, the prop is always undefined → submissions stored
-- with competency_key=null → gate query never matches → lab lessons permanently blocked.
--
-- Both branches of the UNION are updated:
--   curriculum_lessons branch: cl.competency_checks (column added in 20260621000001)
--   course_lessons branch:     cl.competency_checks (same column on course_lessons)

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE VIEW public.lms_lessons AS

-- curriculum_lessons (priority) — published only
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
  NULL::TEXT                                   AS scorm_launch_path,
  cl.competency_checks                                                -- ← added
FROM public.curriculum_lessons cl
LEFT JOIN public.course_modules cm
  ON cm.course_id = cl.course_id
  AND cm.order_index = cl.module_order
WHERE cl.status = 'published'

UNION ALL

-- course_lessons fallback (courses not in curriculum_lessons) — published only
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
  NULL::TEXT                                   AS scorm_launch_path,
  cl.competency_checks                                                -- ← added
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id
WHERE cl.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM public.curriculum_lessons cur
    WHERE cur.course_id = cl.course_id
  );

-- Restore grants (CASCADE drop removed them)
REVOKE ALL ON public.lms_lessons FROM anon, public;
GRANT SELECT ON public.lms_lessons TO authenticated, service_role;

-- Verify:
-- SELECT id, title, competency_checks FROM public.lms_lessons WHERE competency_checks IS NOT NULL LIMIT 5;
