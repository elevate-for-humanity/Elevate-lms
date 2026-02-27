-- ============================================================
-- Harden admin_audit_events immutability
--
-- The audit trail must be append-only. No authenticated user
-- should be able to update or delete rows. INSERT is restricted
-- to service_role only (RLS is bypassed by service_role, so
-- the INSERT policy is tightened to reject authenticated users).
-- ============================================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "service_insert_audit" ON public.admin_audit_events;

-- New INSERT policy: reject all authenticated inserts.
-- service_role bypasses RLS entirely, so it can still insert.
-- This prevents any authenticated user from writing fake audit entries.
CREATE POLICY "deny_authenticated_insert_audit" ON public.admin_audit_events
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- Explicit DENY for UPDATE (defense-in-depth, RLS already blocks by default)
CREATE POLICY "deny_update_audit" ON public.admin_audit_events
  FOR UPDATE TO authenticated
  USING (false)
  WITH CHECK (false);

-- Explicit DENY for DELETE (defense-in-depth, RLS already blocks by default)
CREATE POLICY "deny_delete_audit" ON public.admin_audit_events
  FOR DELETE TO authenticated
  USING (false);

-- Also deny anon role explicitly
CREATE POLICY "deny_anon_all_audit" ON public.admin_audit_events
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);

-- Verify: after this migration, the only way to insert into
-- admin_audit_events is via service_role (which bypasses RLS).
-- No authenticated or anonymous user can insert, update, or delete.
