-- lesson_progress RLS policy cleanup
-- Removes 4 broken/redundant policies, replaces with 6 properly scoped ones.
-- Retains lesson_progress_admin_read (instructor) and lesson_progress_partner_read (placement chain).
--
-- Problems fixed:
--   lp_all: granted public (anon) role ALL ops, no tenant scope
--   lp_admin_read: inline profiles.role check, no tenant scope
--   lp_tenant_read: exact duplicate of lp_admin_read
--   lesson_progress_tenant_select: any tenant member could read all rows (no role gate)

-- Phase 1: Drop broken policies
DROP POLICY IF EXISTS lp_all ON lesson_progress;
DROP POLICY IF EXISTS lp_admin_read ON lesson_progress;
DROP POLICY IF EXISTS lp_tenant_read ON lesson_progress;
DROP POLICY IF EXISTS lesson_progress_tenant_select ON lesson_progress;

-- Phase 2: Owner policies (authenticated only, tenant-enforced on writes)
CREATE POLICY lp_owner_select ON lesson_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY lp_owner_insert ON lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

CREATE POLICY lp_owner_update ON lesson_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id = get_current_tenant_id());

CREATE POLICY lp_owner_delete ON lesson_progress
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Phase 3: Admin/super-admin read policies
CREATE POLICY lp_admin_select ON lesson_progress
  FOR SELECT TO authenticated
  USING (is_admin() AND tenant_id = get_current_tenant_id());

CREATE POLICY lp_super_admin_select ON lesson_progress
  FOR SELECT TO authenticated
  USING (is_super_admin());
