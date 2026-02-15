-- 20260214_partner_visibility_policies.sql
--
-- Partner visibility on enrollments, lesson_progress, certificates.
-- Also adds tenant-scoped policies to shops and shop_staff.
--
-- Scope chain (all direct tenant_id checks, no cross-table tenant joins):
--   auth.uid() -> profiles (role gate)
--   -> shop_staff (active + tenant_id match)
--   -> shops (active + tenant_id match)
--   -> apprentice_placements (tenant_id match)
--   -> student_id -> target table (tenant_id match)
--
-- Enforces per policy:
--   1. Target row tenant_id = caller's tenant
--   2. Caller has partner/admin/super_admin role
--   3. Caller's shop_staff row is active AND same tenant
--   4. Shop is active
--   5. Student is placed at that shop
--
-- Relationship table write-lock audit (2026-02-14):
--   shops:                  No non-admin write policies. Blocked.
--   shop_staff:             No non-admin write policies. Blocked.
--   apprentice_placements:  Only admin write policy. Blocked for partners.
--   All three have RLS enabled and enforced.

-- ============================================================
-- shops: add tenant-scoped policies
-- ============================================================

-- Partners can read their own shops (via shop_staff membership)
CREATE POLICY "shops_partner_read" ON shops
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM shop_staff ss
      WHERE ss.shop_id = shops.id
        AND ss.user_id = auth.uid()
        AND ss.active = true
    )
  );

-- Admin can manage shops within their tenant
CREATE POLICY "shops_admin_all" ON shops
  FOR ALL TO authenticated
  USING (
    (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- shop_staff: add tenant-scoped admin write policy
-- ============================================================

-- Existing SELECT policy (shop_staff_read) uses is_admin() + user_id check.
-- Add tenant-scoped admin write policy.
CREATE POLICY "shop_staff_admin_write" ON shop_staff
  FOR ALL TO authenticated
  USING (
    (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- enrollments: partner can read their placed students' enrollments
-- ============================================================

CREATE POLICY "enrollments_partner_read" ON training_enrollments
  FOR SELECT TO authenticated
  USING (
    -- Tenant match on target row (direct column, O(1))
    tenant_id = public.get_current_tenant_id()
    -- Caller is a partner-eligible role
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('partner', 'admin', 'super_admin')
    )
    -- Student is placed at caller's active shop (all tables now have tenant_id)
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = training_enrollments.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- ============================================================
-- lesson_progress: partner can read their placed students' progress
-- ============================================================

CREATE POLICY "lesson_progress_partner_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('partner', 'admin', 'super_admin')
    )
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = lesson_progress.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- ============================================================
-- certificates: partner can read their placed students' certificates
-- ============================================================

CREATE POLICY "certificates_partner_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('partner', 'admin', 'super_admin')
    )
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = certificates.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- ============================================================
-- Indexes for partner policy performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_shop_staff_user_active
  ON shop_staff(user_id, active, shop_id);

CREATE INDEX IF NOT EXISTS idx_placements_shop_student
  ON apprentice_placements(shop_id, student_id);

CREATE INDEX IF NOT EXISTS idx_shops_active
  ON shops(id) WHERE active = true;
