-- =============================================================================
-- Harden api_keys RLS
-- Migration: 20260611000001_harden_api_keys_rls.sql
--
-- Problem: 20260124200000_admin_tables_v2.sql created:
--   CREATE POLICY "Admin full access to api_keys" ON api_keys FOR ALL USING (true);
-- This allows ANY authenticated user to read, write, and delete all API keys.
--
-- Fix: Replace with service_role-only access + admin-role SELECT.
-- API keys must never be readable by end users or non-admin staff.
-- =============================================================================

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys FORCE ROW LEVEL SECURITY;

-- Drop the permissive catch-all policy
DROP POLICY IF EXISTS "Admin full access to api_keys" ON public.api_keys;

-- Service role: full access (server-side key management)
CREATE POLICY "api_keys_service_role"
  ON public.api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins and super_admins: read-only (for the admin dashboard key list)
CREATE POLICY "api_keys_admin_select"
  ON public.api_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- All other roles (authenticated, anon): no access — denied by default via RLS.
