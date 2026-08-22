-- Remove legacy permissive tenant write paths that can OR around the newer
-- tenant-aware policies. Preserve learner-owned progress and intentionally
-- public catalog reads while requiring tenant admin/staff (or super-admin) for
-- administrative writes.

-- lesson_progress -----------------------------------------------------------
DROP POLICY IF EXISTS admin_bypass_select ON public.lesson_progress;
DROP POLICY IF EXISTS admin_bypass_insert ON public.lesson_progress;
DROP POLICY IF EXISTS admin_bypass_update ON public.lesson_progress;
DROP POLICY IF EXISTS admin_bypass_delete ON public.lesson_progress;
DROP POLICY IF EXISTS lesson_progress_admin ON public.lesson_progress;
DROP POLICY IF EXISTS lesson_progress_select ON public.lesson_progress;
DROP POLICY IF EXISTS lesson_progress_insert ON public.lesson_progress;
DROP POLICY IF EXISTS lesson_progress_update ON public.lesson_progress;
DROP POLICY IF EXISTS lesson_progress_admin_insert ON public.lesson_progress;
DROP POLICY IF EXISTS lesson_progress_admin_update ON public.lesson_progress;
DROP POLICY IF EXISTS lesson_progress_admin_delete ON public.lesson_progress;

CREATE POLICY lesson_progress_admin_insert
ON public.lesson_progress
FOR INSERT TO authenticated
WITH CHECK (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

CREATE POLICY lesson_progress_admin_update
ON public.lesson_progress
FOR UPDATE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

CREATE POLICY lesson_progress_admin_delete
ON public.lesson_progress
FOR DELETE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

-- shops --------------------------------------------------------------------
DROP POLICY IF EXISTS admin_bypass_select ON public.shops;
DROP POLICY IF EXISTS admin_bypass_insert ON public.shops;
DROP POLICY IF EXISTS admin_bypass_update ON public.shops;
DROP POLICY IF EXISTS admin_bypass_delete ON public.shops;
DROP POLICY IF EXISTS "Admins can manage shops" ON public.shops;
DROP POLICY IF EXISTS auth_read_shops ON public.shops;
DROP POLICY IF EXISTS shops_tenant_select ON public.shops;
DROP POLICY IF EXISTS shops_tenant_insert ON public.shops;
DROP POLICY IF EXISTS shops_tenant_update ON public.shops;

-- shops_admin_all is the canonical tenant-aware administrative policy.
-- Public active-shop and assigned/partner read policies remain unchanged.

-- programs -----------------------------------------------------------------
DROP POLICY IF EXISTS admin_bypass_select ON public.programs;
DROP POLICY IF EXISTS admin_bypass_insert ON public.programs;
DROP POLICY IF EXISTS admin_bypass_update ON public.programs;
DROP POLICY IF EXISTS admin_bypass_delete ON public.programs;
DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
DROP POLICY IF EXISTS admins_manage_programs ON public.programs;
DROP POLICY IF EXISTS programs_admin_write ON public.programs;
DROP POLICY IF EXISTS programs_select_admin ON public.programs;
DROP POLICY IF EXISTS programs_insert ON public.programs;
DROP POLICY IF EXISTS programs_update ON public.programs;
DROP POLICY IF EXISTS programs_admin_insert ON public.programs;
DROP POLICY IF EXISTS programs_admin_update ON public.programs;

CREATE POLICY programs_admin_insert
ON public.programs
FOR INSERT TO authenticated
WITH CHECK (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

CREATE POLICY programs_admin_update
ON public.programs
FOR UPDATE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

-- Existing programs_delete remains super-admin only. Existing public/published
-- SELECT policies are intentionally preserved because programs are public catalog
-- data; this migration narrows administrative mutation authority only.
