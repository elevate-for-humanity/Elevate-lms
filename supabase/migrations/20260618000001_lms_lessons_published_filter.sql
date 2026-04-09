-- Enforce published-only visibility in lms_lessons view.
--
-- Previously the view exposed all curriculum_lessons and course_lessons rows
-- regardless of status. 119 non-published lessons were visible to learners
-- in course sidebars and landing pages. The access engine blocked them when
-- clicked, but they appeared in listings — a content leak.
--
-- Fix: add WHERE status = 'published' to both branches of the UNION.
-- Draft/archived lessons are now invisible at the DB layer, not just the
-- application layer. Any query against lms_lessons is safe by default.
--
-- Also adds DB-level constraint on program_holders:
-- status cannot be set to 'active' unless mou_signed = true.
-- Previously this was enforced only in application code.

-- ── 1. Rebuild lms_lessons view with published filter ─────────────────────────

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
  NULL::TEXT                                   AS scorm_launch_path
FROM public.curriculum_lessons cl
LEFT JOIN public.course_modules cm
  ON cm.course_id = cl.course_id
  AND cm.order_index = cl.module_order
WHERE cl.status = 'published'   -- ← enforced at DB layer

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
  NULL::TEXT                                   AS scorm_launch_path
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id
WHERE cl.status = 'published'   -- ← enforced at DB layer
  AND NOT EXISTS (
    SELECT 1 FROM public.curriculum_lessons cur
    WHERE cur.course_id = cl.course_id
  );

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- ── 2. MOU → active constraint on program_holders ────────────────────────────
--
-- Prevents status being set to 'active' unless mou_signed = true.
-- Application code already enforces this, but a DB constraint makes it
-- impossible to bypass via direct SQL or a future missed guard.

ALTER TABLE public.program_holders
  DROP CONSTRAINT IF EXISTS chk_active_requires_mou_signed;

ALTER TABLE public.program_holders
  ADD CONSTRAINT chk_active_requires_mou_signed
  CHECK (
    status != 'active' OR mou_signed = true
  );
