-- Service-only production integrity report for canonical portal data contracts.
-- This intentionally validates structure and referential integrity without
-- exposing internal metadata to browser roles.

CREATE OR REPLACE FUNCTION public.portal_data_integrity_report()
RETURNS TABLE(check_name text, ok boolean, issue_count bigint, details jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
WITH required_tables(table_name) AS (
  VALUES
    ('profiles'),('program_enrollments'),('programs'),('courses'),('course_modules'),('course_lessons'),('lesson_progress'),('documents'),
    ('partners'),('partner_users'),('shops'),('shop_staff'),('apprentice_placements'),('hour_entries'),('apprentice_competency_records'),
    ('employers'),('job_postings'),('job_applications'),('case_manager_assignments'),('case_manager_notes'),('learner_credentials'),('placement_records'),
    ('program_holders'),('program_holder_students'),('program_holder_programs'),('program_holder_documents'),
    ('provider_applications'),('provider_onboarding_steps'),('provider_compliance_artifacts'),
    ('instructor_profiles'),('instructor_assignments'),('instructor_attestations'),
    ('testing_providers'),('testing_slots'),('testing_appointments'),
    ('workforce_board_participants'),('workforce_board_cases'),('workforce_board_notes'),('certificates')
),
missing_tables AS (
  SELECT r.table_name
  FROM required_tables r
  LEFT JOIN information_schema.tables t
    ON t.table_schema='public' AND t.table_name=r.table_name
  WHERE t.table_name IS NULL
),
rls_required(table_name) AS (
  SELECT table_name FROM required_tables WHERE table_name NOT IN ('programs')
),
rls_missing AS (
  SELECT r.table_name
  FROM rls_required r
  LEFT JOIN pg_class c ON c.relname=r.table_name
  LEFT JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public'
  WHERE c.oid IS NULL OR n.oid IS NULL OR NOT c.relrowsecurity
),
policy_missing AS (
  SELECT r.table_name
  FROM rls_required r
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=r.table_name
  )
),
unvalidated_fks AS (
  SELECT c.conname
  FROM pg_constraint c
  JOIN pg_class t ON t.oid=c.conrelid
  JOIN pg_namespace n ON n.oid=t.relnamespace
  WHERE n.nspname='public' AND c.contype='f' AND NOT c.convalidated
),
active_user_orphans AS (
  SELECT pe.id
  FROM public.program_enrollments pe
  LEFT JOIN public.profiles p ON p.id=pe.user_id
  WHERE pe.status='active' AND pe.user_id IS NOT NULL AND p.id IS NULL
),
active_student_orphans AS (
  SELECT pe.id
  FROM public.program_enrollments pe
  LEFT JOIN public.profiles p ON p.id=pe.student_id
  WHERE pe.status='active' AND pe.student_id IS NOT NULL AND p.id IS NULL
),
identity_fk_missing AS (
  SELECT x.constraint_name
  FROM (VALUES
    ('program_enrollments_user_id_profiles_fkey'),
    ('program_enrollments_student_id_profiles_fkey')
  ) x(constraint_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname='public' AND t.relname='program_enrollments'
      AND c.conname=x.constraint_name AND c.contype='f' AND c.convalidated
  )
),
provider_contract_missing AS (
  SELECT x.column_name
  FROM (VALUES ('id'),('tenant_id'),('step'),('status'),('completed_at'),('created_at')) x(column_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema='public' AND c.table_name='provider_onboarding_steps' AND c.column_name=x.column_name
  )
),
provider_stale_completed AS (
  SELECT c.column_name
  FROM information_schema.columns c
  WHERE c.table_schema='public' AND c.table_name='provider_onboarding_steps' AND c.column_name='completed'
)
SELECT 'required_portal_tables'::text,
       NOT EXISTS(SELECT 1 FROM missing_tables),
       (SELECT count(*) FROM missing_tables)::bigint,
       jsonb_build_object('missing', coalesce((SELECT jsonb_agg(table_name ORDER BY table_name) FROM missing_tables),'[]'::jsonb))
UNION ALL
SELECT 'portal_rls_enabled',
       NOT EXISTS(SELECT 1 FROM rls_missing),
       (SELECT count(*) FROM rls_missing)::bigint,
       jsonb_build_object('missing_rls', coalesce((SELECT jsonb_agg(table_name ORDER BY table_name) FROM rls_missing),'[]'::jsonb))
UNION ALL
SELECT 'portal_rls_policies',
       NOT EXISTS(SELECT 1 FROM policy_missing),
       (SELECT count(*) FROM policy_missing)::bigint,
       jsonb_build_object('missing_policies', coalesce((SELECT jsonb_agg(table_name ORDER BY table_name) FROM policy_missing),'[]'::jsonb))
UNION ALL
SELECT 'validated_public_foreign_keys',
       NOT EXISTS(SELECT 1 FROM unvalidated_fks),
       (SELECT count(*) FROM unvalidated_fks)::bigint,
       jsonb_build_object('unvalidated', coalesce((SELECT jsonb_agg(conname ORDER BY conname) FROM unvalidated_fks),'[]'::jsonb))
UNION ALL
SELECT 'active_enrollment_user_identity',
       NOT EXISTS(SELECT 1 FROM active_user_orphans),
       (SELECT count(*) FROM active_user_orphans)::bigint,
       jsonb_build_object('orphan_enrollment_ids', coalesce((SELECT jsonb_agg(id ORDER BY id) FROM active_user_orphans),'[]'::jsonb))
UNION ALL
SELECT 'active_enrollment_student_identity',
       NOT EXISTS(SELECT 1 FROM active_student_orphans),
       (SELECT count(*) FROM active_student_orphans)::bigint,
       jsonb_build_object('orphan_enrollment_ids', coalesce((SELECT jsonb_agg(id ORDER BY id) FROM active_student_orphans),'[]'::jsonb))
UNION ALL
SELECT 'program_enrollment_identity_foreign_keys',
       NOT EXISTS(SELECT 1 FROM identity_fk_missing),
       (SELECT count(*) FROM identity_fk_missing)::bigint,
       jsonb_build_object('missing_or_unvalidated', coalesce((SELECT jsonb_agg(constraint_name ORDER BY constraint_name) FROM identity_fk_missing),'[]'::jsonb))
UNION ALL
SELECT 'provider_onboarding_runtime_contract',
       NOT EXISTS(SELECT 1 FROM provider_contract_missing) AND NOT EXISTS(SELECT 1 FROM provider_stale_completed),
       ((SELECT count(*) FROM provider_contract_missing) + (SELECT count(*) FROM provider_stale_completed))::bigint,
       jsonb_build_object(
         'missing_columns', coalesce((SELECT jsonb_agg(column_name ORDER BY column_name) FROM provider_contract_missing),'[]'::jsonb),
         'stale_completed_column_present', EXISTS(SELECT 1 FROM provider_stale_completed)
       );
$$;

REVOKE ALL ON FUNCTION public.portal_data_integrity_report() FROM public;
REVOKE ALL ON FUNCTION public.portal_data_integrity_report() FROM anon;
REVOKE ALL ON FUNCTION public.portal_data_integrity_report() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.portal_data_integrity_report() TO service_role;
