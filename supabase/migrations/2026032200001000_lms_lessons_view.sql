-- lms_lessons view
--
-- Unified lesson source for LMS pages. Presents curriculum_lessons with the
-- same column shape as training_lessons. For courses that have published
-- curriculum_lessons, those rows are returned. For all other courses,
-- training_lessons rows are returned unchanged.
--
-- Smoke test lessons (slug contains '-smoke-') are excluded.
-- lesson_number = module_order * 1000 + lesson_order for global sort ordering.

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS

  -- Curriculum-seeded lessons (new source of truth)
  SELECT
    cl.id,
    cl.course_id,
    (cl.module_order * 1000 + cl.lesson_order)   AS lesson_number,
    cl.lesson_title                               AS title,
    cl.script_text                                AS content,
    cl.video_file                                 AS video_url,
    cl.duration_minutes,
    NULL::text[]                                  AS topics,
    NULL::jsonb                                   AS quiz_questions,
    cl.created_at,
    cl.updated_at,
    cl.course_id                                  AS course_id_uuid,
    (cl.module_order * 1000 + cl.lesson_order)   AS order_index,
    true                                          AS is_required,
    (cl.status = 'published')                     AS is_published,
    'reading'::text                               AS content_type,
    NULL::uuid                                    AS quiz_id,
    NULL::integer                                 AS passing_score,
    NULL::text                                    AS description,
    NULL::uuid                                    AS tenant_id,
    NULL::text                                    AS html,
    cl.lesson_slug                                AS idx,
    (cl.module_order * 1000 + cl.lesson_order)::text AS order_number,
    cl.module_id,
    cl.program_id,
    'curriculum'::text                            AS lesson_source,
    cl.credential_domain_id
  FROM curriculum_lessons cl
  WHERE cl.course_id IS NOT NULL
    AND cl.lesson_slug NOT LIKE '%-smoke-%'

UNION ALL

  -- Legacy training_lessons (fallback for courses without curriculum)
  SELECT
    tl.id,
    tl.course_id,
    tl.lesson_number,
    tl.title,
    tl.content,
    tl.video_url,
    tl.duration_minutes,
    tl.topics,
    tl.quiz_questions,
    tl.created_at,
    tl.updated_at,
    tl.course_id_uuid,
    tl.order_index,
    tl.is_required,
    tl.is_published,
    tl.content_type,
    tl.quiz_id,
    tl.passing_score,
    tl.description,
    tl.tenant_id,
    tl.html,
    tl.idx,
    tl.order_number,
    tl.module_id,
    tl.program_id,
    'training'::text  AS lesson_source,
    NULL::uuid        AS credential_domain_id
  FROM training_lessons tl
  WHERE NOT EXISTS (
    SELECT 1 FROM curriculum_lessons cl2
    WHERE cl2.course_id = tl.course_id
      AND cl2.status = 'published'
      AND cl2.lesson_slug NOT LIKE '%-smoke-%'
  );

GRANT SELECT ON public.lms_lessons TO authenticated, service_role, anon;
