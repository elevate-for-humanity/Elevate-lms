-- Close legacy permissive tenant-membership RLS paths that OR around
-- tenant-aware policies. Tenant staff/admins may manage only their current
-- tenant; super-admin retains global authority; ordinary users may read only
-- their own membership rows.

-- Certificates already have complete tenant-aware admin policies.
DROP POLICY IF EXISTS admin_bypass_select ON public.certificates;
DROP POLICY IF EXISTS admin_bypass_insert ON public.certificates;
DROP POLICY IF EXISTS admin_bypass_update ON public.certificates;
DROP POLICY IF EXISTS admin_bypass_delete ON public.certificates;

-- tenant_members: retire unrestricted authenticated reads and broad admin bypass.
DROP POLICY IF EXISTS admin_bypass_select ON public.tenant_members;
DROP POLICY IF EXISTS admin_bypass_insert ON public.tenant_members;
DROP POLICY IF EXISTS admin_bypass_update ON public.tenant_members;
DROP POLICY IF EXISTS admin_bypass_delete ON public.tenant_members;
DROP POLICY IF EXISTS auth_read_tenant_members ON public.tenant_members;
DROP POLICY IF EXISTS tenant_members_tenant_select ON public.tenant_members;
DROP POLICY IF EXISTS tenant_members_tenant_insert ON public.tenant_members;
DROP POLICY IF EXISTS tenant_members_tenant_update ON public.tenant_members;
DROP POLICY IF EXISTS tenant_members_admin_select ON public.tenant_members;
DROP POLICY IF EXISTS tenant_members_admin_insert ON public.tenant_members;
DROP POLICY IF EXISTS tenant_members_admin_update ON public.tenant_members;
DROP POLICY IF EXISTS tenant_members_admin_delete ON public.tenant_members;

CREATE POLICY tenant_members_admin_select
ON public.tenant_members
FOR SELECT TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

CREATE POLICY tenant_members_admin_insert
ON public.tenant_members
FOR INSERT TO authenticated
WITH CHECK (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

CREATE POLICY tenant_members_admin_update
ON public.tenant_members
FOR UPDATE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

CREATE POLICY tenant_members_admin_delete
ON public.tenant_members
FOR DELETE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

-- tenant_memberships: same boundary, plus narrow the legacy own policy so a
-- regular tenant member cannot enumerate everybody else in that tenant.
DROP POLICY IF EXISTS admin_bypass_select ON public.tenant_memberships;
DROP POLICY IF EXISTS admin_bypass_insert ON public.tenant_memberships;
DROP POLICY IF EXISTS admin_bypass_update ON public.tenant_memberships;
DROP POLICY IF EXISTS admin_bypass_delete ON public.tenant_memberships;
DROP POLICY IF EXISTS auth_read_tenant_memberships ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_tenant_select ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_tenant_insert ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_tenant_update ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_own ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_admin_select ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_admin_insert ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_admin_update ON public.tenant_memberships;
DROP POLICY IF EXISTS tenant_memberships_admin_delete ON public.tenant_memberships;

CREATE POLICY tenant_memberships_own
ON public.tenant_memberships
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY tenant_memberships_admin_select
ON public.tenant_memberships
FOR SELECT TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

CREATE POLICY tenant_memberships_admin_insert
ON public.tenant_memberships
FOR INSERT TO authenticated
WITH CHECK (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

CREATE POLICY tenant_memberships_admin_update
ON public.tenant_memberships
FOR UPDATE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

CREATE POLICY tenant_memberships_admin_delete
ON public.tenant_memberships
FOR DELETE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);
