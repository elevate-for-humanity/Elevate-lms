-- Restore the missing isolated-QA SCORM contract; never run on production.
-- Structure, constraints, policies and grants were read from the production
-- PostgreSQL catalog on 2026-11-24. No learner/progress records are copied.
-- Canonical policy sources: 20260822230400_harden_scorm_rls.sql and
-- 20261028025524_restore_learner_scorm_privileges.sql. The package registry is
-- scripts/sql/activate-job-ready.sql; it references the existing dispatch assets.
-- UUID defaults use built-in gen_random_uuid(), the same UUID-v4 contract used
-- throughout the isolated-QA bootstrap, without another extension dependency.
-- Kept outside supabase/migrations because this is an isolated-QA repair only.
BEGIN;
SET LOCAL search_path = public, extensions;
DO $qa$
BEGIN
  IF to_regclass('private.qa_environment_identity') IS NULL THEN
    RAISE EXCEPTION 'INDEPENDENT_QA_PROJECT_IDENTITY_REQUIRED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM private.qa_environment_identity
                 WHERE project_ref = 'isdgjcdabhxxozarmxta') THEN
    RAISE EXCEPTION 'UNAUTHORIZED_QA_PROJECT_IDENTITY';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'elevate-lms-qa') THEN
    RAISE EXCEPTION 'ISOLATED_QA_TENANT_REQUIRED';
  END IF;
  IF to_regclass('public.scorm_packages') IS NOT NULL
     OR to_regclass('public.scorm_enrollments') IS NOT NULL
     OR to_regclass('public.scorm_tracking') IS NOT NULL THEN
    RAISE EXCEPTION 'SCORM_CONTRACT_ALREADY_EXISTS_REVIEW_BEFORE_APPLY';
  END IF;
END; $qa$;

CREATE TABLE public."scorm_packages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "version" text DEFAULT '1.2'::text,
  "package_url" text NOT NULL,
  "manifest_url" text,
  "launch_url" text NOT NULL,
  "duration_minutes" integer,
  "passing_score" integer DEFAULT 80,
  "max_attempts" integer,
  "active" boolean DEFAULT true,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "scorm_version" text,
  "course_id" uuid,
  "status" text
);
ALTER TABLE public."scorm_packages" ADD FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE public."scorm_packages" ADD PRIMARY KEY (id);
ALTER TABLE public."scorm_packages" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."scorm_packages" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public."scorm_packages" TO service_role;

CREATE TABLE public."scorm_enrollments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "scorm_package_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "enrollment_id" uuid,
  "status" text DEFAULT 'not_attempted'::text,
  "progress_percentage" numeric DEFAULT 0,
  "score" numeric,
  "attempts" integer DEFAULT 0,
  "time_spent_seconds" integer DEFAULT 0,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "last_accessed_at" timestamp with time zone,
  "suspend_data" jsonb DEFAULT '{}'::jsonb,
  "cmi_data" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."scorm_enrollments" ADD PRIMARY KEY (id);
ALTER TABLE public."scorm_enrollments" ADD FOREIGN KEY (scorm_package_id) REFERENCES scorm_packages(id) ON DELETE CASCADE;
ALTER TABLE public."scorm_enrollments" ADD UNIQUE (scorm_package_id, user_id);
ALTER TABLE public."scorm_enrollments" ADD FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public."scorm_enrollments" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."scorm_enrollments" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public."scorm_enrollments" TO service_role;

CREATE TABLE public."scorm_tracking" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "scorm_enrollment_id" uuid NOT NULL,
  "element" text NOT NULL,
  "value" text,
  "timestamp" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."scorm_tracking" ADD PRIMARY KEY (id);
ALTER TABLE public."scorm_tracking" ADD FOREIGN KEY (scorm_enrollment_id) REFERENCES scorm_enrollments(id) ON DELETE CASCADE;
ALTER TABLE public."scorm_tracking" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."scorm_tracking" FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public."scorm_tracking" TO service_role;

CREATE INDEX idx_scorm_packages_active ON public.scorm_packages (active);
CREATE INDEX idx_scorm_packages_course_id ON public.scorm_packages (course_id);
CREATE INDEX idx_scorm_packages_created_at ON public.scorm_packages (created_at DESC);
CREATE INDEX idx_scorm_enrollments_package ON public.scorm_enrollments (scorm_package_id);
CREATE INDEX idx_scorm_enrollments_user ON public.scorm_enrollments (user_id);
CREATE INDEX idx_scorm_enrollments_status ON public.scorm_enrollments (status);
CREATE INDEX idx_scorm_tracking_enrollment_id ON public.scorm_tracking (scorm_enrollment_id);

CREATE POLICY "require_privileged_aal2" ON public."scorm_enrollments" AS RESTRICTIVE FOR ALL TO "authenticated"
USING (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied))
WITH CHECK (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));

CREATE POLICY "scorm_enrollments_admin_all" ON public."scorm_enrollments" AS PERMISSIVE FOR ALL TO "authenticated"
USING ((rpc_private.is_super_admin() OR (rpc_private.is_admin() AND (EXISTS ( SELECT 1
   FROM profiles subject
  WHERE ((subject.id = scorm_enrollments.user_id) AND (subject.tenant_id = rpc_private.get_current_tenant_id())))))))
WITH CHECK ((rpc_private.is_super_admin() OR (rpc_private.is_admin() AND (EXISTS ( SELECT 1
   FROM profiles subject
  WHERE ((subject.id = scorm_enrollments.user_id) AND (subject.tenant_id = rpc_private.get_current_tenant_id())))))));

CREATE POLICY "scorm_enrollments_owner_insert" ON public."scorm_enrollments" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "scorm_enrollments_owner_select" ON public."scorm_enrollments" AS PERMISSIVE FOR SELECT TO "authenticated"
USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "scorm_enrollments_owner_update" ON public."scorm_enrollments" AS PERMISSIVE FOR UPDATE TO "authenticated"
USING ((user_id = ( SELECT auth.uid() AS uid)))
WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "admin_bypass_delete" ON public."scorm_packages" AS PERMISSIVE FOR DELETE TO "authenticated"
USING (rpc_private.is_admin());

CREATE POLICY "admin_bypass_insert" ON public."scorm_packages" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK (rpc_private.is_admin());

CREATE POLICY "admin_bypass_select" ON public."scorm_packages" AS PERMISSIVE FOR SELECT TO "authenticated"
USING (rpc_private.is_admin());

CREATE POLICY "admin_bypass_update" ON public."scorm_packages" AS PERMISSIVE FOR UPDATE TO "authenticated"
USING (rpc_private.is_admin())
WITH CHECK (rpc_private.is_admin());

CREATE POLICY "admin_manage_scorm_packages" ON public."scorm_packages" AS PERMISSIVE FOR ALL TO "authenticated"
USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'staff'::text]))))));

CREATE POLICY "require_privileged_aal2" ON public."scorm_packages" AS RESTRICTIVE FOR ALL TO "authenticated"
USING (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied))
WITH CHECK (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));

CREATE POLICY "scorm_packages_admin" ON public."scorm_packages" AS PERMISSIVE FOR ALL TO "authenticated"
USING (rpc_private.is_admin())
WITH CHECK (rpc_private.is_admin());

CREATE POLICY "scorm_packages_view" ON public."scorm_packages" AS PERMISSIVE FOR SELECT TO "authenticated"
USING (true);

CREATE POLICY "require_privileged_aal2" ON public."scorm_tracking" AS RESTRICTIVE FOR ALL TO "authenticated"
USING (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied))
WITH CHECK (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));

CREATE POLICY "scorm_tracking_admin_all" ON public."scorm_tracking" AS PERMISSIVE FOR ALL TO "authenticated"
USING ((rpc_private.is_super_admin() OR (rpc_private.is_admin() AND (EXISTS ( SELECT 1
   FROM (scorm_enrollments se
     JOIN profiles subject ON ((subject.id = se.user_id)))
  WHERE ((se.id = scorm_tracking.scorm_enrollment_id) AND (subject.tenant_id = rpc_private.get_current_tenant_id())))))))
WITH CHECK ((rpc_private.is_super_admin() OR (rpc_private.is_admin() AND (EXISTS ( SELECT 1
   FROM (scorm_enrollments se
     JOIN profiles subject ON ((subject.id = se.user_id)))
  WHERE ((se.id = scorm_tracking.scorm_enrollment_id) AND (subject.tenant_id = rpc_private.get_current_tenant_id())))))));

CREATE POLICY "scorm_tracking_owner_insert" ON public."scorm_tracking" AS PERMISSIVE FOR INSERT TO "authenticated"
WITH CHECK ((EXISTS ( SELECT 1
   FROM scorm_enrollments se
  WHERE ((se.id = scorm_tracking.scorm_enrollment_id) AND (se.user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "scorm_tracking_owner_select" ON public."scorm_tracking" AS PERMISSIVE FOR SELECT TO "authenticated"
USING ((EXISTS ( SELECT 1
   FROM scorm_enrollments se
  WHERE ((se.id = scorm_tracking.scorm_enrollment_id) AND (se.user_id = ( SELECT auth.uid() AS uid))))));

-- Match current learner API privileges exactly; package mutation, enrollment
-- deletion and low-level tracking remain unavailable to authenticated clients.
GRANT SELECT ON public.scorm_packages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.scorm_enrollments TO authenticated;

-- Register the existing EmployIndy learner dispatch packages; never overwrite existing records.
INSERT INTO public.scorm_packages (id,title,version,scorm_version,package_url,launch_url,active,status,metadata) VALUES
('b73c9f10-a048-4600-8e93-000000000000', 'Job Ready Indy: Introduction to Job Ready Indy', '2004', '2004', '/scorm/job-ready/introduction/package.zip', '/lms/career/job-ready/introduction', true, 'published', '{"provider":"EmployIndy","catalog":"job-ready-indy","learner_module":true}'::jsonb),
('b73c9f10-a048-4600-8e93-000000000001', 'Job Ready Indy: Mindsets', '2004', '2004', '/scorm/job-ready/mindsets/package.zip', '/lms/career/job-ready/mindsets', true, 'published', '{"provider":"EmployIndy","catalog":"job-ready-indy","learner_module":true}'::jsonb),
('b73c9f10-a048-4600-8e93-000000000002', 'Job Ready Indy: Self-Management', '2004', '2004', '/scorm/job-ready/self-management/package.zip', '/lms/career/job-ready/self-management', true, 'published', '{"provider":"EmployIndy","catalog":"job-ready-indy","learner_module":true}'::jsonb),
('b73c9f10-a048-4600-8e93-000000000003', 'Job Ready Indy: Learning Strategies', '2004', '2004', '/scorm/job-ready/learning-strategies/package.zip', '/lms/career/job-ready/learning-strategies', true, 'published', '{"provider":"EmployIndy","catalog":"job-ready-indy","learner_module":true}'::jsonb),
('b73c9f10-a048-4600-8e93-000000000004', 'Job Ready Indy: Social Skills', '2004', '2004', '/scorm/job-ready/social-skills/package.zip', '/lms/career/job-ready/social-skills', true, 'published', '{"provider":"EmployIndy","catalog":"job-ready-indy","learner_module":true}'::jsonb),
('b73c9f10-a048-4600-8e93-000000000005', 'Job Ready Indy: Workplace Skills', '2004', '2004', '/scorm/job-ready/workplace-skills/package.zip', '/lms/career/job-ready/workplace-skills', true, 'published', '{"provider":"EmployIndy","catalog":"job-ready-indy","learner_module":true}'::jsonb),
('b73c9f10-a048-4600-8e93-000000000006', 'Job Ready Indy: Launch a Career', '2004', '2004', '/scorm/job-ready/launch-a-career/package.zip', '/lms/career/job-ready/launch-a-career', true, 'published', '{"provider":"EmployIndy","catalog":"job-ready-indy","learner_module":true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
COMMIT;
