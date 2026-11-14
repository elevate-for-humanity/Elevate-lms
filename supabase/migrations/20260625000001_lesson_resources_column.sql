-- Add resources column to both lesson tables and fix lms_lessons view.
-- Previously both UNION branches returned NULL::JSONB AS resources,
-- making lesson resource attachments invisible to learners.

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS resources JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS resources JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Rebuild lms_lessons view with real resources from both branches.
-- Preserves all existing columns and grants.
DROP VIEW IF EXISTS public.lms_lessons;

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
  COALESCE(cl.resources, '[]'::jsonb)          AS resources,
  NULL::TEXT                                   AS scorm_package_id,
  NULL::TEXT                                   AS scorm_launch_path,
  cl.competency_checks
FROM public.curriculum_lessons cl
LEFT JOIN public.course_modules cm
  ON cm.course_id = cl.course_id
  AND cm.order_index = cl.module_order
WHERE cl.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM public.course_lessons ecl
    WHERE ecl.course_id = cl.course_id
      AND ecl.slug = cl.lesson_slug
  )

UNION ALL

-- course_lessons (canonical path for non-HVAC programs)
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
  COALESCE(cl.resources, '[]'::jsonb)          AS resources,
  NULL::TEXT                                   AS scorm_package_id,
  NULL::TEXT                                   AS scorm_launch_path,
  cl.competency_checks
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id
WHERE cl.is_published = true;

-- Restore grants
GRANT SELECT ON public.lms_lessons TO authenticated;
GRANT SELECT ON public.lms_lessons TO anon;
