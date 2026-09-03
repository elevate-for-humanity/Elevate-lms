-- Migration: 20260503000018_course_lessons_partner_exam_code.sql
--
-- Adds partner_exam_code to course_lessons and exposes it through lms_lessons.
-- Used by the lesson page to detect Certiport/external proctored exam steps
-- and redirect to /certiport-exam?exam=<code> instead of the internal quiz player.

-- 1. Add column
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS partner_exam_code TEXT;

-- 2. Set QB-ONLINE on the bookkeeping final exam
UPDATE public.course_lessons
SET    partner_exam_code = 'QB-ONLINE'
WHERE  id = 'c3251414-696b-45fe-9d3f-12a40d232329';

-- 3. Rebuild lms_lessons view to include partner_exam_code
-- Must drop first because CREATE OR REPLACE cannot change column order.
DROP VIEW IF EXISTS public.lms_lessons;
CREATE VIEW public.lms_lessons AS
SELECT
  id,
  course_id,
  module_id,
  order_index,
  order_index          AS lesson_number,
  title,
  slug,
  slug                 AS lesson_slug,
  status,
  is_published,
  is_required,
  lesson_type,
  lesson_type::text    AS step_type,
  lesson_type::text    AS content_type,
  content,
  passing_score,
  quiz_questions,
  video_url,
  video_url            AS video_file,
  key_terms,
  activity_type,
  scenario_prompt,
  partner_exam_code,
  NULL::text           AS module_title,
  NULL::integer        AS module_order,
  NULL::integer        AS lesson_order,
  NULL::integer        AS duration_minutes,
  'curriculum'::text   AS lesson_source,
  created_at,
  updated_at
FROM public.course_lessons cl
WHERE (is_published = true) OR (status = 'published');

-- 4. Verify
SELECT id, slug, partner_exam_code
FROM   public.lms_lessons
WHERE  course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND  partner_exam_code IS NOT NULL;
