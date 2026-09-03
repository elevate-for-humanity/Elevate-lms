-- Fix lms_lessons view: expose slug (not lesson_slug), add missing columns
-- that the lesson page reads: resources, video_url, quiz_id, description,
-- partner_exam_code, scorm_package_id, scorm_launch_path.
--
-- course_lessons does not have all of these columns natively; NULL-cast
-- placeholders are used for columns that don't exist on the table so the
-- view contract is stable and the lesson page never gets undefined.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

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
  -- expose as both slug (what lesson page reads) and lesson_slug (legacy)
  cl.slug                                 AS slug,
  cl.slug                                 AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cm.title                                AS module_title,
  COALESCE(cm.order_index, 0)             AS module_order,
  NULL::INTEGER                           AS lesson_order,
  NULL::INTEGER                           AS duration_minutes,
  cl.is_published,
  cl.status,
  'canonical'                             AS lesson_source,
  cl.created_at,
  cl.updated_at,
  -- columns the lesson page reads that are not on course_lessons base table
  -- partner_exam_code added by migration 20260503000018
  cl.partner_exam_code,
  -- placeholders for columns not yet on course_lessons
  NULL::TEXT                              AS video_url,
  NULL::UUID                              AS quiz_id,
  NULL::TEXT                              AS description,
  NULL::JSONB                             AS resources,
  NULL::TEXT                              AS scorm_package_id,
  NULL::TEXT                              AS scorm_launch_path
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id;

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;
