-- lms_lessons view — canonical projection from course_lessons
--
-- Source of truth: courses / course_modules / course_lessons
-- This view is the read interface for the LMS renderer.
-- curriculum_lessons and training_lessons are no longer the source.
--
-- Apply after: 20260402000007_enforce_canonical_pipeline.sql
-- Safe to re-apply: DROP + CREATE is idempotent.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  -- lesson_number: encoded as (module_order * 1000) + lesson_order
  -- matches the order_index convention used by createAndPublishProgram()
  cl.order_index                                                    AS lesson_number,
  cl.title,
  -- content is JSONB; expose as text for legacy callers that expect a string
  (cl.content #>> '{}')                                             AS content,
  cl.lesson_type                                                    AS step_type,
  cl.lesson_type                                                    AS content_type,
  cl.slug                                                           AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.module_id,
  cm.title                                                          AS module_title,
  -- module_order: derived from order_index encoding (integer division by 1000)
  (cl.order_index / 1000)                                           AS module_order,
  -- lesson_order: remainder after stripping module prefix
  (cl.order_index - ((cl.order_index / 1000) * 1000))              AS lesson_order,
  NULL::INTEGER                                                     AS duration_minutes,
  'canonical'::TEXT                                                 AS lesson_source,
  cl.is_required,
  TRUE                                                              AS is_published,
  cl.created_at,
  cl.updated_at
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id
LEFT JOIN public.courses c ON c.id = cl.course_id
WHERE c.status = 'published'
  AND c.is_active = TRUE;

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- Verify: run this in Supabase Dashboard SQL Editor after applying
-- SELECT lesson_source, count(*) FROM lms_lessons GROUP BY lesson_source;
-- Expected: one row with lesson_source = 'canonical'
