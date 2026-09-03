-- =============================================================================
-- Align curriculum_lessons.module_id to modules table + rebuild lms_lessons view
--
-- The modules table already has 8 PRS rows (peer-mod-1 through peer-mod-8).
-- curriculum_lessons.module_id FK references modules(id).
-- This migration aligns the module_id values and rebuilds the view with
-- step_type and module_title exposed.
-- =============================================================================

BEGIN;

-- 1. Align curriculum_lessons.module_id to the correct modules(id) values
--    by joining on slug pattern (peer-mod-N matches module_order N)
UPDATE public.curriculum_lessons cl
SET module_id = m.id
FROM public.modules m
WHERE m.program_id = cl.program_id
  AND m.slug = 'peer-mod-' || cl.module_order::text
  AND cl.program_id = (SELECT id FROM public.programs WHERE slug = 'peer-recovery-specialist-jri');

-- 2. Rebuild lms_lessons view with step_type + module_title
DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS
  SELECT
    cl.id, cl.course_id,
    (cl.module_order * 1000 + cl.lesson_order) AS lesson_number,
    cl.lesson_title AS title,
    cl.script_text  AS content,
    cl.video_file   AS video_url,
    cl.duration_minutes,
    NULL::text[]    AS topics,
    NULL::jsonb     AS quiz_questions,
    cl.created_at,
    cl.updated_at,
    cl.course_id    AS course_id_uuid,
    (cl.module_order * 1000 + cl.lesson_order) AS order_index,
    true            AS is_required,
    (cl.status = 'published') AS is_published,
    cl.step_type::text AS content_type,
    NULL::uuid      AS quiz_id,
    NULL::integer   AS passing_score,
    NULL::text      AS description,
    NULL::uuid      AS tenant_id,
    NULL::text      AS html,
    cl.lesson_slug  AS idx,
    (cl.module_order * 1000 + cl.lesson_order)::text AS order_number,
    cl.module_id,
    cl.program_id,
    'curriculum'::text AS lesson_source,
    cl.credential_domain_id,
    cl.step_type::text AS step_type,
    m.title         AS module_title,
    cl.module_order,
    cl.lesson_order
  FROM curriculum_lessons cl
  LEFT JOIN modules m ON m.id = cl.module_id
  WHERE cl.course_id IS NOT NULL
    AND cl.lesson_slug NOT LIKE '%-smoke-%'

UNION ALL

  SELECT
    tl.id, tl.course_id, tl.lesson_number, tl.title, tl.content, tl.video_url,
    tl.duration_minutes, tl.topics, tl.quiz_questions, tl.created_at, tl.updated_at,
    tl.course_id_uuid, tl.order_index, tl.is_required, tl.is_published, tl.content_type,
    tl.quiz_id, tl.passing_score, tl.description, tl.tenant_id, tl.html,
    tl.idx, tl.order_number, tl.module_id, tl.program_id,
    'training'::text AS lesson_source,
    NULL::uuid       AS credential_domain_id,
    'lesson'::text   AS step_type,
    NULL::text       AS module_title,
    NULL::integer    AS module_order,
    NULL::integer    AS lesson_order
  FROM training_lessons tl
  WHERE NOT EXISTS (
    SELECT 1 FROM curriculum_lessons cl2
    WHERE cl2.course_id = tl.course_id
      AND cl2.status = 'published'
      AND cl2.lesson_slug NOT LIKE '%-smoke-%'
  );

GRANT SELECT ON public.lms_lessons TO authenticated, service_role, anon;

COMMIT;
