-- =============================================================================
-- Security hardening: RLS gaps, storage policies, login reliability
-- =============================================================================
-- Findings from 2026-07-02 audit:
--   1. 4 tables with RLS disabled: ai_plan_executions, platform_events,
--      platform_snapshots, program_holder_call_log
--   2. Storage policies using {public} role on private buckets (should be
--      {authenticated} or {service_role})
--   3. Duplicate/redundant SELECT policies on profiles (cosmetic, not harmful)
--   4. demo-audio bucket is public with no mime-type restriction
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enable RLS on the 4 tables that had it disabled
-- -----------------------------------------------------------------------------

ALTER TABLE public.ai_plan_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_call_log ENABLE ROW LEVEL SECURITY;

-- ai_plan_executions: admin-only (internal AI planner state)
DROP POLICY IF EXISTS "ai_plan_executions_admin" ON public.ai_plan_executions;
CREATE POLICY "ai_plan_executions_admin" ON public.ai_plan_executions
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- platform_events: admin-only (internal platform telemetry)
DROP POLICY IF EXISTS "platform_events_admin" ON public.platform_events;
CREATE POLICY "platform_events_admin" ON public.platform_events
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- platform_snapshots: admin-only (internal snapshots)
DROP POLICY IF EXISTS "platform_snapshots_admin" ON public.platform_snapshots;
CREATE POLICY "platform_snapshots_admin" ON public.platform_snapshots
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- program_holder_call_log: admin + own program holder rows
DROP POLICY IF EXISTS "program_holder_call_log_admin" ON public.program_holder_call_log;
CREATE POLICY "program_holder_call_log_admin" ON public.program_holder_call_log
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "program_holder_call_log_own" ON public.program_holder_call_log;
CREATE POLICY "program_holder_call_log_own" ON public.program_holder_call_log
  FOR SELECT TO authenticated
  USING (
    called_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_call_log.program_holder_id
        AND ph.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 2. Fix storage policies using {public} role on private buckets
--    {public} = unauthenticated access. These should be {authenticated}.
-- -----------------------------------------------------------------------------

-- wioa_exports: admin-only private bucket, was {public}
DROP POLICY IF EXISTS "wioa_exports_admin" ON storage.objects;
CREATE POLICY "wioa_exports_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'wioa-exports' AND is_admin())
  WITH CHECK (bucket_id = 'wioa-exports' AND is_admin());

-- partners can upload/view own documents — was {public}, fix to {authenticated}
DROP POLICY IF EXISTS "Partners can upload own documents" ON storage.objects;
CREATE POLICY "Partners can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'partner-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Partners can view own documents" ON storage.objects;
CREATE POLICY "Partners can view own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'partner-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Partners can delete own documents" ON storage.objects;
CREATE POLICY "Partners can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'partner-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload/view own documents — was {public}, fix to {authenticated}
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
CREATE POLICY "Users can read own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all documents — was {public}, fix to {authenticated}
DROP POLICY IF EXISTS "Admins can read all documents" ON storage.objects;
CREATE POLICY "Admins can read all documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('documents', 'enrollment-documents', 'files')
    AND is_admin()
  );

-- users_upload_storage_objects / users_view_own_storage_objects — was {public}
DROP POLICY IF EXISTS "users_upload_storage_objects" ON storage.objects;
CREATE POLICY "users_upload_storage_objects" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_view_own_storage_objects" ON storage.objects;
CREATE POLICY "users_view_own_storage_objects" ON storage.objects
  FOR SELECT TO authenticated
  USING ((storage.foldername(name))[1] = auth.uid()::text);

-- Shop staff upload — was {public}
DROP POLICY IF EXISTS "Shop staff can upload documents 60c2tu_0" ON storage.objects;
-- (duplicate of authenticated version — just drop it)

-- Partners can view own shop onboarding docs — was {public}
DROP POLICY IF EXISTS "Partners can view own shop onboarding docs" ON storage.objects;
CREATE POLICY "Partners can view own shop onboarding docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'shop-onboarding'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can manage all partner documents — was {public}
DROP POLICY IF EXISTS "Admins can manage all partner documents" ON storage.objects;
CREATE POLICY "Admins can manage all partner documents" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'partner-documents' AND is_admin())
  WITH CHECK (bucket_id = 'partner-documents' AND is_admin());

-- -----------------------------------------------------------------------------
-- 3. Remove duplicate SELECT policies on profiles (cosmetic cleanup)
--    Keep: profiles_own_read (canonical), admin_bypass_select, profiles_admin_all
--    Drop: redundant duplicates
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_select_own"          ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
-- Keep: profiles_own_read, admin_bypass_select, profiles_admin_all, profiles_service_role

-- -----------------------------------------------------------------------------
-- 4. Ensure profiles_own_read exists (idempotent)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_own_read" ON public.profiles;
CREATE POLICY "profiles_own_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- -----------------------------------------------------------------------------
-- 5. Add file size limit and mime-type restriction to demo-audio bucket
--    (currently public with no restrictions — risk of abuse)
-- -----------------------------------------------------------------------------
UPDATE storage.buckets
SET
  file_size_limit   = 52428800,  -- 50 MB
  allowed_mime_types = ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/webm']
WHERE id = 'demo-audio';

-- Also restrict curriculum bucket (currently public, no mime restriction)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf','text/html','application/zip',
  'video/mp4','video/webm','image/jpeg','image/png','image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
WHERE id = 'curriculum';
