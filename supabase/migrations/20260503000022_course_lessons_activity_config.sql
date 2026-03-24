-- Add video_config and activities columns to course_lessons.
--
-- video_config: stores the BlueprintVideoConfig for this lesson so the video
--   generator can produce consistent videos without manual per-lesson config.
--
-- activities: JSONB array of activity descriptors for the NHA-style lesson
--   activity menu. Each entry: { type, label, order, required, config? }
--   Types: 'video' | 'reading' | 'flashcards' | 'lab' | 'practice' | 'checkpoint'
--
-- Apply in Supabase Dashboard → SQL Editor before deploying.

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS video_config   JSONB,
  ADD COLUMN IF NOT EXISTS activities     JSONB;

-- Expose both columns through lms_lessons view.
-- The view is rebuilt here to add the two new columns.
-- This replaces the view from migration 20260503000018.

DROP VIEW IF EXISTS public.lms_lessons;
CREATE VIEW public.lms_lessons AS
  -- Canonical path: course_lessons (priority)
  SELECT
    cl.id,
    cl.course_id,
    cl.module_id,
    cl.slug,
    cl.title,
    cl.content,
    cl.lesson_type                                AS content_type,
    cl.lesson_type                                AS step_type,
    cl.order_index,
    cl.duration_minutes,
    cl.is_required,
    cl.is_published,
    cl.status,
    cl.video_url,
    cl.video_url                                  AS video_file,
    cl.quiz_questions,
    cl.passing_score,
    NULL::jsonb                                   AS resources,
    cl.partner_exam_code,
    cl.video_config,
    cl.activities,
    NULL::integer                                 AS lesson_number,
    NULL::integer                                 AS module_order,
    'canonical'                                   AS lesson_source,
    cl.created_at,
    cl.updated_at
  FROM public.course_lessons cl
  WHERE cl.is_published = true

  UNION ALL

  -- Legacy fallback: training_lessons (only when no course_lessons row exists for this course)
  SELECT
    tl.id,
    tl.course_id_uuid                             AS course_id,
    NULL::uuid                                    AS module_id,
    'legacy-' || tl.id::text                      AS slug,
    tl.title,
    to_jsonb(tl.content)                          AS content,
    tl.content_type::public.lesson_type           AS content_type,
    tl.content_type::public.lesson_type           AS step_type,
    tl.order_index,
    tl.duration_minutes,
    TRUE                                          AS is_required,
    TRUE                                          AS is_published,
    'published'                                   AS status,
    tl.video_url,
    tl.video_url                                  AS video_file,
    tl.quiz_questions,
    tl.passing_score,
    NULL::jsonb                                   AS resources,
    NULL::text                                    AS partner_exam_code,
    NULL::jsonb                                   AS video_config,
    NULL::jsonb                                   AS activities,
    tl.lesson_number,
    NULL::integer                                 AS module_order,
    'legacy'                                      AS lesson_source,
    tl.created_at,
    tl.updated_at
  FROM public.training_lessons tl
  WHERE NOT EXISTS (
    SELECT 1 FROM public.course_lessons cl2
    WHERE cl2.course_id = tl.course_id_uuid
  );
