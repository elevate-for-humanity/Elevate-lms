-- audit_logs hardening
--
-- The original migration (20260118000001) created audit_logs with columns:
--   actor_id, target_type, target_id, metadata
--
-- The codebase already writes: user_id, resource_type, resource_id, details,
--   ip_address, user_agent, success
--
-- This migration reconciles the two by:
--   1. Adding missing columns (idempotent — IF NOT EXISTS)
--   2. Adding tenant_id + role for cross-tenant enforcement
--   3. Tightening RLS: only admins/staff can read; service role writes
--   4. Adding indexes for common query patterns
--
-- Apply in Supabase Dashboard → SQL Editor.

-- ── Column additions (idempotent) ────────────────────────────────────────────

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tenant_id     uuid,
  ADD COLUMN IF NOT EXISTS role          text,
  ADD COLUMN IF NOT EXISTS resource_type text,
  ADD COLUMN IF NOT EXISTS resource_id   text,
  ADD COLUMN IF NOT EXISTS details       jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ip_address    text,
  ADD COLUMN IF NOT EXISTS user_agent    text,
  ADD COLUMN IF NOT EXISTS success       boolean DEFAULT true;

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id       ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id     ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource      ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_ts     ON public.audit_logs(action, created_at DESC);

-- ── RLS policies ─────────────────────────────────────────────────────────────

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins and staff can read all logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Authenticated users can read their own logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT
  USING (user_id = auth.uid() OR actor_id = auth.uid());

-- Inserts: service role bypasses RLS entirely.
-- For anon/authenticated JWT callers, restrict to inserting their own user_id only.
-- This prevents a compromised user session from forging audit entries for other users.
DROP POLICY IF EXISTS "Users can create own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role inserts audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users insert own audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users insert own audit logs" ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()   -- own entries only
    OR user_id IS NULL     -- system/webhook entries have no user_id
  );

-- No updates or deletes — audit logs are immutable
DROP POLICY IF EXISTS "No updates to audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No updates to audit logs" ON public.audit_logs;
CREATE POLICY "No updates to audit logs" ON public.audit_logs
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No deletes from audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No deletes from audit logs" ON public.audit_logs;
CREATE POLICY "No deletes from audit logs" ON public.audit_logs
  FOR DELETE USING (false);

COMMENT ON TABLE public.audit_logs IS
  'Immutable audit trail. Columns user_id/resource_type/resource_id/details are canonical. '
  'actor_id/target_type/target_id/metadata retained for backward compatibility.';

-- ── Post-migration verification (run in SQL Editor after applying) ────────────
--
-- 1. Confirm new columns exist:
--
--    SELECT column_name, data_type, is_nullable
--    FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'audit_logs'
--      AND column_name IN ('user_id','tenant_id','role','resource_type','resource_id',
--                          'details','ip_address','user_agent','success')
--    ORDER BY column_name;
--
--    Expected: 9 rows returned.
--
-- 2. Confirm indexes exist:
--
--    SELECT indexname FROM pg_indexes
--    WHERE tablename = 'audit_logs'
--      AND indexname LIKE 'idx_audit_logs_%';
--
--    Expected: idx_audit_logs_action_ts, idx_audit_logs_resource,
--              idx_audit_logs_tenant_id, idx_audit_logs_user_id
--
-- 3. Confirm RLS policies:
--
--    SELECT policyname, cmd FROM pg_policies
--    WHERE tablename = 'audit_logs'
--    ORDER BY policyname;
--
--    Expected policies:
--      Admins can view audit logs          SELECT
--      Authenticated users insert own ...  INSERT
--      No deletes from audit logs          DELETE
--      No updates to audit logs            UPDATE
--      Users can view own audit logs       SELECT
--
-- 4. Smoke-test insert (replace with a real user_id from auth.users):
--
--    INSERT INTO public.audit_logs
--      (user_id, tenant_id, role, action, resource_type, resource_id, details, success)
--    VALUES
--      (NULL, NULL, 'system', 'MIGRATION_VERIFY', 'audit_logs', 'smoke-test',
--       '{"note":"post-migration smoke test"}'::jsonb, true);
--
--    SELECT * FROM public.audit_logs
--    WHERE action = 'MIGRATION_VERIFY' ORDER BY created_at DESC LIMIT 1;
--
--    Then delete the smoke-test row:
--    -- Note: deletes are blocked by RLS for non-service-role.
--    -- Run as service role or via Dashboard table editor.
-- ─────────────────────────────────────────────────────────────────────────────
