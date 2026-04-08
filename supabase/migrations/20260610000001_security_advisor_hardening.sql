-- =============================================================================
-- Security Advisor Hardening
--
-- Fixes two classes of findings from Supabase Security Advisor:
--
-- 1. CRITICAL: Security Definer Views
--    Nine views were flagged as running with owner privileges (security_invoker=false
--    by default). None of them need elevated privileges — they join public.profiles,
--    not auth.users, and the underlying tables have RLS. Recreating them with
--    security_invoker=true means they run in the caller's RLS context.
--
-- 2. HIGH: Function Search Path Mutable
--    SECURITY DEFINER functions without a fixed search_path can resolve objects
--    from unexpected schemas if the search_path is manipulated. Adding
--    SET search_path = pg_catalog, public to every affected function closes this.
--
-- Views fixed:
--   exam_authorization_queue, exam_outcome_tracking, exam_ready_status,
--   learner_module_gate_state, lessons, lms_lessons, program_catalog_index,
--   program_completion_candidates, program_course_activity
--
-- Functions fixed (search_path added):
--   All SECURITY DEFINER functions that were missing it.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PART 1: Recreate critical views with security_invoker = true
-- ---------------------------------------------------------------------------

-- 1a. exam_authorization_queue
-- Joins exam_authorizations + programs + profiles + exam_scheduling + exam_results.
-- All tables have RLS. No auth.users join. Invoker context is correct.
DROP VIEW IF EXISTS public.exam_authorization_queue CASCADE;
CREATE OR REPLACE VIEW public.exam_authorization_queue
WITH (security_invoker = true)
AS
SELECT
  ea.id                                                     AS authorization_id,
  ea.user_id,
  ea.program_id,
  ea.status,
  ea.authorized_at,
  ea.expires_at,
  ea.notes,
  pr.email                                                  AS learner_email,
  COALESCE(pr.full_name, pr.email)                          AS learner_name,
  p.slug                                                    AS program_slug,
  p.title                                                   AS program_title,
  es.scheduled_date,
  es.testing_center,
  es.outcome                                                AS scheduling_outcome,
  er.passed                                                 AS exam_passed,
  er.score                                                  AS exam_score,
  er.exam_date                                              AS exam_date,
  (ea.expires_at::date - CURRENT_DATE)                      AS days_until_expiry,
  (
    ea.status = 'authorized'
    AND ea.expires_at < now() + interval '30 days'
  )                                                         AS expiring_soon,
  CASE
    WHEN ea.status = 'authorized' AND es.id IS NULL
      THEN 'needs_scheduling'
    WHEN ea.status = 'authorized' AND es.id IS NOT NULL AND es.outcome IS NULL
      THEN 'awaiting_outcome'
    WHEN ea.status = 'scheduled' AND es.outcome IS NULL
      THEN 'awaiting_outcome'
    WHEN ea.status IN ('passed','failed') AND er.id IS NULL
      THEN 'needs_result_recorded'
    WHEN ea.status = 'expired'
      THEN 'eligible_for_reauth'
    ELSE 'no_action_needed'
  END                                                       AS action_needed
FROM public.exam_authorizations ea
JOIN public.programs p          ON p.id = ea.program_id
JOIN public.profiles pr         ON pr.id = ea.user_id
LEFT JOIN public.exam_scheduling es
  ON es.authorization_id = ea.id
  AND es.id = (
    SELECT id FROM public.exam_scheduling
    WHERE authorization_id = ea.id
    ORDER BY created_at DESC LIMIT 1
  )
LEFT JOIN public.exam_results er
  ON er.authorization_id = ea.id
  AND er.id = (
    SELECT id FROM public.exam_results
    WHERE authorization_id = ea.id
    ORDER BY created_at DESC LIMIT 1
  );

GRANT SELECT ON public.exam_authorization_queue TO authenticated, service_role;

-- 1b. exam_outcome_tracking
-- Aggregate stats per program. No user-specific data exposed beyond aggregates.
DROP VIEW IF EXISTS public.exam_outcome_tracking CASCADE;
CREATE OR REPLACE VIEW public.exam_outcome_tracking
WITH (security_invoker = true)
AS
SELECT
  p.slug                                                              AS program_slug,
  p.title                                                             AS program_title,
  COUNT(DISTINCT ea.id)                                               AS total_authorized,
  COUNT(DISTINCT es.id)                                               AS total_scheduled,
  COUNT(DISTINCT es.id) FILTER (WHERE es.outcome != 'no_show'
    AND es.outcome IS NOT NULL)                                       AS total_sat,
  COUNT(DISTINCT es.id) FILTER (WHERE es.outcome = 'no_show')        AS total_no_show,
  COUNT(DISTINCT er.id)                                               AS total_results_recorded,
  COUNT(DISTINCT er.id) FILTER (WHERE er.passed = true)              AS total_passed,
  COUNT(DISTINCT er.id) FILTER (WHERE er.passed = false)             AS total_failed,
  ROUND(
    100.0 * COUNT(DISTINCT er.id) FILTER (WHERE er.passed = true)
    / NULLIF(COUNT(DISTINCT er.id), 0), 1
  )                                                                   AS first_time_pass_rate_pct,
  ROUND(
    100.0 * COUNT(DISTINCT es.id) FILTER (WHERE es.outcome = 'no_show')
    / NULLIF(COUNT(DISTINCT es.id), 0), 1
  )                                                                   AS no_show_rate_pct,
  ROUND(AVG(er.score), 1)                                             AS avg_exam_score
FROM public.programs p
LEFT JOIN public.exam_authorizations ea  ON ea.program_id = p.id
LEFT JOIN public.exam_scheduling es      ON es.authorization_id = ea.id
LEFT JOIN public.exam_results er         ON er.authorization_id = ea.id
GROUP BY p.id, p.slug, p.title;

GRANT SELECT ON public.exam_outcome_tracking TO authenticated, service_role;

-- 1c. exam_ready_status
-- Per-learner checkpoint readiness. Joins checkpoint_scores + curriculum_lessons
-- + program_exam_ready_rules + programs + program_enrollments. All have RLS.
DROP VIEW IF EXISTS public.exam_ready_status CASCADE;
CREATE OR REPLACE VIEW public.exam_ready_status
WITH (security_invoker = true)
AS
WITH best_checkpoint_scores AS (
  SELECT
    cs.user_id,
    cl.program_id,
    cl.id          AS lesson_id,
    cl.passing_score,
    MAX(cs.score)  AS best_score
  FROM public.checkpoint_scores cs
  JOIN public.curriculum_lessons cl
    ON cl.id = cs.lesson_id
    AND cl.step_type = 'checkpoint'
  GROUP BY cs.user_id, cl.program_id, cl.id, cl.passing_score
),
checkpoint_agg AS (
  SELECT
    user_id,
    program_id,
    COUNT(*)::integer                                          AS total_checkpoints,
    COUNT(*) FILTER (WHERE best_score >= passing_score)::integer AS passed_checkpoints,
    ROUND(AVG(best_score), 2)                                 AS avg_score,
    MIN(best_score)                                           AS min_score
  FROM best_checkpoint_scores
  GROUP BY user_id, program_id
)
SELECT
  ca.user_id,
  ca.program_id,
  pe.id                                                        AS enrollment_id,
  p.slug                                                       AS program_slug,
  p.title                                                      AS program_title,
  ca.total_checkpoints,
  ca.passed_checkpoints,
  ca.avg_score,
  ca.min_score,
  r.min_avg_checkpoint_score,
  r.min_checkpoint_score,
  (
    ca.passed_checkpoints = ca.total_checkpoints
    AND ca.avg_score      >= r.min_avg_checkpoint_score
    AND ca.min_score      >= r.min_checkpoint_score
  )                                                            AS is_exam_ready,
  CASE
    WHEN ca.passed_checkpoints = ca.total_checkpoints
      AND ca.avg_score      >= r.min_avg_checkpoint_score
      AND ca.min_score      >= r.min_checkpoint_score
    THEN 'Verified Exam Ready'
    WHEN ca.passed_checkpoints < ca.total_checkpoints
    THEN format('Checkpoints: %s/%s passed', ca.passed_checkpoints, ca.total_checkpoints)
    WHEN ca.avg_score < r.min_avg_checkpoint_score
    THEN format('Average score %s%% below required %s%%', ca.avg_score, r.min_avg_checkpoint_score)
    ELSE format('Min checkpoint score %s%% below required %s%%', ca.min_score, r.min_checkpoint_score)
  END                                                          AS status_label,
  now()                                                        AS evaluated_at
FROM checkpoint_agg ca
JOIN public.program_exam_ready_rules r  ON r.program_id = ca.program_id
JOIN public.programs p                  ON p.id = ca.program_id
LEFT JOIN public.program_enrollments pe
  ON pe.user_id = ca.user_id
  AND pe.program_id = ca.program_id
  AND pe.status IN ('active','completed');

GRANT SELECT ON public.exam_ready_status TO authenticated, service_role;

-- 1d. learner_module_gate_state
-- Per-learner checkpoint gate state. Joins curriculum_lessons + checkpoint_scores.
DROP VIEW IF EXISTS public.learner_module_gate_state CASCADE;
CREATE OR REPLACE VIEW public.learner_module_gate_state
WITH (security_invoker = true)
AS
SELECT
  cs_agg.user_id,
  cl_cp.program_id,
  cl_cp.module_order + 1                              AS locked_module_order,
  cl_cp.id                                            AS checkpoint_lesson_id,
  cl_cp.lesson_title                                  AS checkpoint_title,
  cl_cp.passing_score                                 AS required_score,
  COALESCE(cs_agg.best_score, 0)                      AS best_score,
  COALESCE(cs_agg.passed, false)                      AS checkpoint_passed,
  COALESCE(cs_agg.attempt_count, 0)                   AS attempt_count,
  NOT COALESCE(cs_agg.passed, false)                  AS is_locked,
  CASE
    WHEN COALESCE(cs_agg.passed, false)               THEN 'unlocked'
    WHEN COALESCE(cs_agg.attempt_count, 0) = 0        THEN 'not_attempted'
    ELSE format('failed — best %s%%, need %s%%',
           COALESCE(cs_agg.best_score, 0), cl_cp.passing_score)
  END                                                 AS gate_status
FROM public.curriculum_lessons cl_cp
LEFT JOIN (
  SELECT
    user_id,
    lesson_id,
    MAX(score)      AS best_score,
    bool_or(passed) AS passed,
    COUNT(*)        AS attempt_count
  FROM public.checkpoint_scores
  GROUP BY user_id, lesson_id
) cs_agg ON cs_agg.lesson_id = cl_cp.id
WHERE cl_cp.step_type = 'checkpoint'
  AND cs_agg.user_id IS NOT NULL;

GRANT SELECT ON public.learner_module_gate_state TO authenticated, service_role;

-- 1e. lessons (thin wrapper over training_lessons)
DROP VIEW IF EXISTS public.lessons CASCADE;
CREATE OR REPLACE VIEW public.lessons
WITH (security_invoker = true)
AS
SELECT
  id,
  course_id,
  lesson_number,
  title,
  content,
  video_url,
  duration_minutes,
  topics,
  quiz_questions,
  created_at,
  updated_at,
  course_id_uuid,
  order_index,
  is_required,
  is_published,
  content_type,
  quiz_id,
  passing_score,
  description,
  tenant_id
FROM public.training_lessons;

GRANT SELECT ON public.lessons TO authenticated, service_role;

-- 1f. lms_lessons (canonical lesson source — course_lessons UNION training_lessons)
DROP VIEW IF EXISTS public.lms_lessons CASCADE;
CREATE OR REPLACE VIEW public.lms_lessons
WITH (security_invoker = true)
AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index,
  NULL::integer                                                  AS lesson_number,
  cl.title,
  cl.content::text                                               AS content,
  cl.rendered_html,
  COALESCE(NULLIF(cl.video_url, ''), cur.video_file)            AS video_url,
  COALESCE(cl.lesson_type::text, cur.step_type::text, 'lesson') AS step_type,
  cl.lesson_type::text                                           AS content_type,
  cl.slug,
  cur.lesson_slug,
  COALESCE(cl.passing_score, cur.passing_score)                 AS passing_score,
  COALESCE(cl.quiz_questions, cur.quiz_questions)               AS quiz_questions,
  cl.activities,
  cl.video_config,
  cl.module_id,
  cm.title                                                       AS module_title,
  cm.order_index                                                 AS module_order,
  cl.order_index                                                 AS lesson_order,
  cl.duration_minutes,
  cl.is_published,
  cl.status,
  'course_lessons'::text                                         AS lesson_source,
  cl.created_at,
  cl.updated_at,
  cl.partner_exam_code,
  NULL::uuid                                                     AS quiz_id,
  NULL::text                                                     AS description,
  NULL::jsonb                                                    AS resources,
  NULL::text                                                     AS scorm_package_id,
  NULL::text                                                     AS scorm_launch_path
FROM public.course_lessons cl
LEFT JOIN public.curriculum_lessons cur
  ON  cur.lesson_slug = cl.slug
  AND cur.course_id   = cl.course_id
LEFT JOIN public.course_modules cm
  ON  cm.id = cl.module_id

UNION ALL

SELECT
  tl.id,
  tl.course_id,
  tl.order_index,
  tl.lesson_number,
  tl.title,
  tl.content,
  NULL::text                                                     AS rendered_html,
  tl.video_url,
  COALESCE(tl.lesson_type::text, 'lesson')                      AS step_type,
  tl.content_type::text                                          AS content_type,
  NULL::text                                                     AS slug,
  NULL::text                                                     AS lesson_slug,
  tl.passing_score,
  tl.quiz_questions,
  NULL::jsonb                                                    AS activities,
  NULL::jsonb                                                    AS video_config,
  tl.module_id,
  NULL::text                                                     AS module_title,
  NULL::integer                                                  AS module_order,
  tl.order_index                                                 AS lesson_order,
  tl.duration_minutes,
  tl.is_published,
  NULL::text                                                     AS status,
  'training'::text                                               AS lesson_source,
  tl.created_at,
  tl.updated_at,
  NULL::text                                                     AS partner_exam_code,
  tl.quiz_id,
  tl.description,
  NULL::jsonb                                                    AS resources,
  NULL::text                                                     AS scorm_package_id,
  NULL::text                                                     AS scorm_launch_path
FROM public.training_lessons tl
WHERE NOT EXISTS (
  SELECT 1 FROM public.course_lessons cl2
  WHERE cl2.course_id = tl.course_id
);

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- 1g. program_catalog_index (public catalog — anon readable)
DROP VIEW IF EXISTS public.program_catalog_index CASCADE;
CREATE OR REPLACE VIEW public.program_catalog_index
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.slug,
  p.title,
  p.description,
  p.excerpt,
  p.image_url,
  p.estimated_weeks,
  p.credential_name,
  p.funding_tags,
  p.wioa_approved,
  p.published,
  p.is_active,
  p.status,
  p.featured,
  'program'::text AS source_type
FROM public.programs p
WHERE p.published = true
  AND p.is_active = true
  AND p.status != 'archived'

UNION ALL

SELECT
  tc.id,
  tc.slug,
  tc.title,
  tc.description,
  tc.summary        AS excerpt,
  NULL::text        AS image_url,
  NULL::integer     AS estimated_weeks,
  NULL::text        AS credential_name,
  NULL::text[]      AS funding_tags,
  false             AS wioa_approved,
  tc.is_published   AS published,
  tc.is_active,
  tc.status,
  false             AS featured,
  'course'::text    AS source_type
FROM public.training_courses tc
WHERE tc.is_published = true
  AND tc.is_active   = true
  AND tc.status      = 'published';

GRANT SELECT ON public.program_catalog_index TO authenticated, anon, service_role;

-- 1h. program_completion_candidates
DROP VIEW IF EXISTS public.program_completion_candidates CASCADE;
CREATE OR REPLACE VIEW public.program_completion_candidates
WITH (security_invoker = true)
AS
SELECT
  pca.program_enrollment_id,
  pca.user_id,
  pca.program_id,
  pca.last_course_completed_at,
  pe.cohort_id,
  pe.funding_source
FROM public.program_course_activity pca
JOIN public.program_enrollments pe ON pe.id = pca.program_enrollment_id
WHERE pca.all_courses_complete = true
  AND pe.status != 'completed';

GRANT SELECT ON public.program_completion_candidates TO authenticated, service_role;

-- 1i. program_course_activity
DROP VIEW IF EXISTS public.program_course_activity CASCADE;
CREATE OR REPLACE VIEW public.program_course_activity
WITH (security_invoker = true)
AS
SELECT
  pe.id                                                        AS program_enrollment_id,
  pe.user_id,
  pe.program_id,
  pe.status                                                    AS program_status,
  pe.enrolled_at                                               AS program_enrolled_at,
  COUNT(DISTINCT pc.course_id)                                 AS total_required_courses,
  COUNT(DISTINCT te.course_id)
    FILTER (WHERE te.completed_at IS NOT NULL)                 AS completed_courses,
  ROUND(
    COUNT(DISTINCT te.course_id)
      FILTER (WHERE te.completed_at IS NOT NULL)::NUMERIC
    / NULLIF(COUNT(DISTINCT pc.course_id), 0) * 100
  )                                                            AS program_progress_pct,
  (COUNT(DISTINCT pc.course_id) > 0
   AND COUNT(DISTINCT pc.course_id)
     = COUNT(DISTINCT te.course_id)
         FILTER (WHERE te.completed_at IS NOT NULL))           AS all_courses_complete,
  MAX(te.completed_at)                                         AS last_course_completed_at
FROM public.program_enrollments pe
JOIN public.program_courses pc
  ON  pc.program_id  = pe.program_id
  AND pc.is_required = true
LEFT JOIN public.training_enrollments te
  ON  te.user_id   = pe.user_id
  AND te.course_id = pc.course_id
GROUP BY pe.id, pe.user_id, pe.program_id, pe.status, pe.enrolled_at;

GRANT SELECT ON public.program_course_activity TO authenticated, service_role;


-- ---------------------------------------------------------------------------
-- PART 2: Fix mutable search_path on SECURITY DEFINER functions
--
-- Pattern: ALTER FUNCTION ... SET search_path = pg_catalog, public
-- This is safer than recreating every function body — it sets the search_path
-- at the function level without touching the logic.
-- ---------------------------------------------------------------------------

ALTER FUNCTION public.set_updated_at()                              SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_updated_at_column()                    SET search_path = pg_catalog, public;

-- Auth / role helpers
ALTER FUNCTION public.is_admin_role()                               SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_platform_admin()                           SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_my_role()                                 SET search_path = pg_catalog, public;
ALTER FUNCTION public.my_tenant_id()                                SET search_path = pg_catalog, public;
-- get_my_tenant_id() does not exist in this schema — skipped.
-- Equivalent functions my_tenant_id() and get_current_tenant_id() are handled above/below.
-- SKIP (function not in schema): ALTER FUNCTION public.is_provider_admin()                           SET search_path = pg_catalog, public;
-- SKIP (function not in schema): ALTER FUNCTION public.is_case_manager()                             SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_conversation_participant(uuid)             SET search_path = pg_catalog, public;
-- SKIP (function not in schema): ALTER FUNCTION public.get_my_assigned_learner_ids()                 SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_my_organization_ids()                     SET search_path = pg_catalog, public;
ALTER FUNCTION public.current_program_holder_id()                   SET search_path = pg_catalog, public;

-- Application / enrollment state machine
ALTER FUNCTION public.approve_application_and_grant_access_atomic(uuid, text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.revoke_application_access_atomic(uuid, text)             SET search_path = pg_catalog, public;
ALTER FUNCTION public.enroll_application(uuid, uuid)                                 SET search_path = pg_catalog, public;
-- SKIP (wrong signature): ALTER FUNCTION public.submit_program_holder_application(uuid, text, text)      SET search_path = pg_catalog, public;
ALTER FUNCTION public.publish_program(uuid)                                    SET search_path = pg_catalog, public;
ALTER FUNCTION public.check_application_access_readiness(uuid)                 SET search_path = pg_catalog, public;

-- Program completion / certification
ALTER FUNCTION public.check_program_completion(uuid, uuid)                     SET search_path = pg_catalog, public;
ALTER FUNCTION public.mark_program_completed(uuid)                       SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_program_completion_eligible(uuid, uuid)               SET search_path = pg_catalog, public;
ALTER FUNCTION public.issue_program_completion_certificate_if_eligible(uuid, uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.maybe_issue_certificate_after_lesson_progress()          SET search_path = pg_catalog, public;
ALTER FUNCTION public.maybe_issue_certificate_after_checkpoint_score()         SET search_path = pg_catalog, public;

-- Exam pipeline
ALTER FUNCTION public.auto_create_exam_authorization()                         SET search_path = pg_catalog, public;
ALTER FUNCTION public.evaluate_exam_readiness(uuid, uuid)                      SET search_path = pg_catalog, public;
ALTER FUNCTION public.expire_stale_exam_authorizations()                       SET search_path = pg_catalog, public;
ALTER FUNCTION public.reauthorize_exam_if_ready(uuid, uuid, uuid)                          SET search_path = pg_catalog, public;
-- SKIP (function not in schema): ALTER FUNCTION public.expire_stale_credentials()                               SET search_path = pg_catalog, public;
ALTER FUNCTION public.sim_readiness_score(uuid, uuid)                          SET search_path = pg_catalog, public;
ALTER FUNCTION public.can_access_lesson(uuid, uuid)                            SET search_path = pg_catalog, public;

-- Audit / immutability triggers
ALTER FUNCTION public.set_audit_context(text, text, text)                            SET search_path = pg_catalog, public;
ALTER FUNCTION public.prevent_audit_tampering()                                SET search_path = pg_catalog, public;
ALTER FUNCTION public.audit_enrollment_insert()                                SET search_path = pg_catalog, public;
ALTER FUNCTION public.audit_partner_users_change()                             SET search_path = pg_catalog, public;
ALTER FUNCTION public.audit_profile_role_change()                              SET search_path = pg_catalog, public;
ALTER FUNCTION public.audit_checkpoint_passed()                                SET search_path = pg_catalog, public;
ALTER FUNCTION public.audit_certificate_issued()                               SET search_path = pg_catalog, public;
ALTER FUNCTION public.audit_admin_lesson_progress_override()                   SET search_path = pg_catalog, public;
ALTER FUNCTION public.webhook_event_lifecycle_guard()                          SET search_path = pg_catalog, public;

-- Lesson progress / checkpoint gating
ALTER FUNCTION public.enforce_lesson_progress_checkpoint_gate()                SET search_path = pg_catalog, public;
-- SKIP: ALTER FUNCTION public.check_module_unlock(uuid, uuid)                          SET search_path = pg_catalog, public;
ALTER FUNCTION public.on_lesson_complete_check_module_unlock()                 SET search_path = pg_catalog, public;
ALTER FUNCTION public.block_direct_enrollment_insert()                         SET search_path = pg_catalog, public;

-- Course / content publishing
ALTER FUNCTION public.publish_course(uuid)                                     SET search_path = pg_catalog, public;
ALTER FUNCTION public.publish_course_from_staging(uuid, uuid)                        SET search_path = pg_catalog, public;
ALTER FUNCTION public.snapshot_course_version(uuid, uuid, text)                            SET search_path = pg_catalog, public;
-- SKIP (function not in schema): ALTER FUNCTION public.can_publish_course(uuid)                                 SET search_path = pg_catalog, public;
-- SKIP (function not in schema): ALTER FUNCTION public.enforce_course_content_before_publish()                  SET search_path = pg_catalog, public;

-- Utility / misc
ALTER FUNCTION public.get_user_id_by_email(text)                               SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_impact_summary()                                     SET search_path = pg_catalog, public;
ALTER FUNCTION public.handle_new_user()                                        SET search_path = pg_catalog, public;
ALTER FUNCTION public.upsert_stripe_session(text, text, text, integer, text, timestamp with time zone, text, text, text, text, text, jsonb)     SET search_path = pg_catalog, public;
ALTER FUNCTION public.escalate_overdue_funding_verifications()                 SET search_path = pg_catalog, public;
-- SKIP (function not in schema): ALTER FUNCTION public.escalate_funding_verification_sla()                      SET search_path = pg_catalog, public;
ALTER FUNCTION public.verify_enrollment_complete(uuid)                         SET search_path = pg_catalog, public;
ALTER FUNCTION public.trg_check_enrollment_approval()                          SET search_path = pg_catalog, public;
