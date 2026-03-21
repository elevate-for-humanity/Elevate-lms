-- ============================================================
-- lms_lessons VIEW — add training fields
--
-- Exposes video_url, activity_type, scenario_prompt, key_terms
-- from course_lessons so the lesson page renderer can use them
-- without a separate query.
--
-- Idempotent — CREATE OR REPLACE.
-- Apply via Supabase Dashboard SQL Editor (already applied live).
-- ============================================================

CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  cl.order_index                                          AS lesson_number,
  cl.title,
  cl.content #>> '{}'::text[]                            AS content,
  cl.lesson_type                                          AS step_type,
  cl.lesson_type::text                                    AS content_type,
  cl.slug                                                 AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.module_id,
  cm.title                                                AS module_title,
  COALESCE(cm.order_index, cm."order")                   AS module_order,
  cl.order_index - COALESCE(cm.order_index, cm."order") * 1000 AS lesson_order,
  NULL::integer                                           AS duration_minutes,
  'canonical'::text                                       AS lesson_source,
  cl.created_at,
  cl.updated_at,
  -- Training fields (added in 20260505000001)
  cl.video_url,
  cl.activity_type,
  cl.scenario_prompt,
  cl.key_terms
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id;
