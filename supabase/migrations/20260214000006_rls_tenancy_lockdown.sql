-- 20260214_rls_tenancy_lockdown.sql
--
-- Priority 1: Lock down USING(true) / WITH CHECK(true) policies
-- Priority 2: Enable RLS on 12 live scoped tables that lack it
-- Priority 3: Add tenant predicates to key tables
--
-- Depends on: get_current_tenant_id(), is_admin(), is_super_admin()
--   (all confirmed live via RPC test 2026-02-14)
--
-- Run each statement individually in Supabase SQL Editor.
-- Statements are separated by blank lines for easy copy-paste.

-- ============================================================
-- PRIORITY 1: Lock down dangerous USING(true) policies
-- ============================================================

-- 1a. sfc_tax_returns: was FOR ALL USING(true) WITH CHECK(true)
DROP POLICY IF EXISTS "sfc_tax_returns_service_all" ON sfc_tax_returns;

-- sfc_tax_returns has no user_id column; admin-only access
CREATE POLICY "sfc_tax_returns_own_read" ON sfc_tax_returns
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "sfc_tax_returns_admin_all" ON sfc_tax_returns;
CREATE POLICY "sfc_tax_returns_admin_all" ON sfc_tax_returns
  FOR ALL TO authenticated
  USING (is_admin());

-- 1b. sfc_tax_documents: was FOR ALL USING(true) WITH CHECK(true)
DROP POLICY IF EXISTS "sfc_tax_documents_service_all" ON sfc_tax_documents;

CREATE POLICY "sfc_tax_documents_own_read" ON sfc_tax_documents
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "sfc_tax_documents_admin_all" ON sfc_tax_documents;
CREATE POLICY "sfc_tax_documents_admin_all" ON sfc_tax_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 1c. licenses: was SELECT USING(true) — exposes all license keys
DROP POLICY IF EXISTS "licenses_select" ON licenses;

CREATE POLICY "licenses_own_tenant" ON licenses
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

-- 1d. audit_logs INSERT: was WITH CHECK(true) — anyone could poison audit trail
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;

CREATE POLICY "audit_logs_insert_own" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ============================================================
-- PRIORITY 2: Enable RLS on live scoped tables without it
-- ============================================================

-- 2a. programs (55 rows, tenant_id + organization_id)
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "programs_public_read" ON programs;
CREATE POLICY "programs_public_read" ON programs
  FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "programs_admin_write" ON programs;
CREATE POLICY "programs_admin_write" ON programs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 2b. users (669 rows, organization_id)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_read" ON users;
CREATE POLICY "users_own_read" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 2c. organization_users (1 row, organization_id)
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_users_own_read" ON organization_users;
CREATE POLICY "org_users_own_read" ON organization_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "org_users_admin_all" ON organization_users;
CREATE POLICY "org_users_admin_all" ON organization_users
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 2d. marketing_campaigns (5 rows, tenant_id)
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_campaigns_tenant" ON marketing_campaigns;
CREATE POLICY "marketing_campaigns_tenant" ON marketing_campaigns
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

-- 2e. marketing_contacts (5 rows, tenant_id)
ALTER TABLE marketing_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketing_contacts_tenant" ON marketing_contacts;
CREATE POLICY "marketing_contacts_tenant" ON marketing_contacts
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

-- 2f. tenant_licenses (1 row, tenant_id)
ALTER TABLE tenant_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_licenses_own" ON tenant_licenses;
CREATE POLICY "tenant_licenses_own" ON tenant_licenses
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "tenant_licenses_admin_write" ON tenant_licenses;
CREATE POLICY "tenant_licenses_admin_write" ON tenant_licenses
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 2g. tenant_memberships (1 row, tenant_id)
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_memberships_own" ON tenant_memberships;
CREATE POLICY "tenant_memberships_own" ON tenant_memberships
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "tenant_memberships_admin_write" ON tenant_memberships;
CREATE POLICY "tenant_memberships_admin_write" ON tenant_memberships
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 2h. license_usage is a VIEW — skip RLS (enforced on base table)

-- 2i. license_events (1 row, tenant_id + organization_id)
ALTER TABLE license_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "license_events_tenant" ON license_events;
CREATE POLICY "license_events_tenant" ON license_events
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "license_events_admin_write" ON license_events;
CREATE POLICY "license_events_admin_write" ON license_events
  FOR ALL TO authenticated
  USING (public.is_super_admin());

-- 2j. v_active_programs (43 rows, organization_id) — view, may need special handling
-- Views inherit RLS from base tables. With programs now having RLS, this is covered.

-- 2k. v_published_programs (43 rows, organization_id) — same as above

-- ============================================================
-- PRIORITY 3: Add tenant predicates to key table policies
-- ============================================================

-- 3a. profiles: existing policies use auth.uid() but no tenant scope.
--     The profiles_update_own_row_tenant_immutable policy from
--     20260130_protect_tenant_id.sql already handles UPDATE.
--     Add tenant-scoped admin policy.
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
      )
      AND (
        -- Admin sees own tenant only; super_admin sees all
        public.is_super_admin()
        OR tenant_id = public.get_current_tenant_id()
        OR tenant_id IS NULL
      )
    )
  );

-- 3b. enrollments: direct tenant_id check (column added by 20260214_add_tenant_id_to_core_tables)
DROP POLICY IF EXISTS "enrollments_admin_all" ON training_enrollments;

CREATE POLICY "enrollments_admin_all" ON training_enrollments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );

-- 3c. certificates: direct tenant_id check (column added by 20260214_add_tenant_id_to_core_tables)
--     INSERT/UPDATE/DELETE already admin-only (20260214_tighten_certificates_rls.sql).
--     Replace with tenant-scoped versions.
DROP POLICY IF EXISTS "certificates_admin_insert" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_update" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_delete" ON certificates;

CREATE POLICY "certificates_admin_insert" ON certificates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );

DROP POLICY IF EXISTS "certificates_admin_update" ON certificates;
CREATE POLICY "certificates_admin_update" ON certificates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );

DROP POLICY IF EXISTS "certificates_admin_delete" ON certificates;
CREATE POLICY "certificates_admin_delete" ON certificates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );

-- 3d. apprentice_placements: direct tenant_id check (column added by 20260214_add_tenant_id_to_core_tables)
--     RLS already enabled (from earlier migration). Add tenant-scoped policies.
DROP POLICY IF EXISTS "placements_admin_all" ON apprentice_placements;
CREATE POLICY "placements_admin_all" ON apprentice_placements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );

DROP POLICY IF EXISTS "placements_partner_read" ON apprentice_placements;
CREATE POLICY "placements_partner_read" ON apprentice_placements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shop_staff
      WHERE shop_staff.user_id = auth.uid()
      AND shop_staff.shop_id = apprentice_placements.shop_id
      AND shop_staff.active = true
    )
  );

-- 3e. lesson_progress: direct tenant_id check (column added by 20260214_add_tenant_id_to_core_tables)
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON lesson_progress;

CREATE POLICY "lesson_progress_admin_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
      OR tenant_id IS NULL
    )
  );
