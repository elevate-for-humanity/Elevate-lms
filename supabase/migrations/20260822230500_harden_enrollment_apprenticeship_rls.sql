-- Enforce tenant-aware authority on enrollment, apprenticeship, attendance,
-- and placement records while preserving owner/partner workflows.

-- program_enrollments -------------------------------------------------------
DROP POLICY IF EXISTS program_enrollments_admin_write ON public.program_enrollments;
DROP POLICY IF EXISTS program_enrollments_staff_read ON public.program_enrollments;
CREATE POLICY program_enrollments_admin_write ON public.program_enrollments
FOR ALL TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);
CREATE POLICY program_enrollments_staff_read ON public.program_enrollments
FOR SELECT TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (
    tenant_id = rpc_private.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY (ARRAY['admin'::text,'staff'::text,'instructor'::text])
    )
  )
);

-- apprentice_placements ----------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage placements" ON public.apprentice_placements;
DROP POLICY IF EXISTS "Admins can view all placements" ON public.apprentice_placements;
DROP POLICY IF EXISTS admin_bypass_select ON public.apprentice_placements;
DROP POLICY IF EXISTS admin_bypass_insert ON public.apprentice_placements;
DROP POLICY IF EXISTS admin_bypass_update ON public.apprentice_placements;
DROP POLICY IF EXISTS admin_bypass_delete ON public.apprentice_placements;
DROP POLICY IF EXISTS apprentice_placements_tenant_select ON public.apprentice_placements;
DROP POLICY IF EXISTS apprentice_placements_tenant_insert ON public.apprentice_placements;
DROP POLICY IF EXISTS apprentice_placements_tenant_update ON public.apprentice_placements;
-- placements_admin_all already enforces admin plus current-tenant/super-admin.

-- attendance_hours ---------------------------------------------------------
DROP POLICY IF EXISTS admin_bypass_select ON public.attendance_hours;
DROP POLICY IF EXISTS admin_bypass_insert ON public.attendance_hours;
DROP POLICY IF EXISTS admin_bypass_update ON public.attendance_hours;
DROP POLICY IF EXISTS admin_bypass_delete ON public.attendance_hours;
DROP POLICY IF EXISTS attendance_hours_tenant_select ON public.attendance_hours;
DROP POLICY IF EXISTS attendance_hours_tenant_insert ON public.attendance_hours;
DROP POLICY IF EXISTS attendance_hours_tenant_update ON public.attendance_hours;
DROP POLICY IF EXISTS hours_admin_delete ON public.attendance_hours;
DROP POLICY IF EXISTS hours_admin_update ON public.attendance_hours;
DROP POLICY IF EXISTS hours_instructor_insert ON public.attendance_hours;
DROP POLICY IF EXISTS attendance_hours_user_read ON public.attendance_hours;
DROP POLICY IF EXISTS attendance_hours_staff_select ON public.attendance_hours;
DROP POLICY IF EXISTS attendance_hours_staff_insert ON public.attendance_hours;
DROP POLICY IF EXISTS attendance_hours_staff_update ON public.attendance_hours;
DROP POLICY IF EXISTS attendance_hours_admin_delete ON public.attendance_hours;

CREATE POLICY attendance_hours_user_read ON public.attendance_hours
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY attendance_hours_staff_select ON public.attendance_hours
FOR SELECT TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (
    tenant_id = rpc_private.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY (ARRAY['admin'::text,'staff'::text,'instructor'::text])
    )
  )
);

CREATE POLICY attendance_hours_staff_insert ON public.attendance_hours
FOR INSERT TO authenticated
WITH CHECK (
  rpc_private.is_super_admin()
  OR (
    tenant_id = rpc_private.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY (ARRAY['admin'::text,'staff'::text,'instructor'::text])
    )
  )
);

CREATE POLICY attendance_hours_staff_update ON public.attendance_hours
FOR UPDATE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (
    tenant_id = rpc_private.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY (ARRAY['admin'::text,'staff'::text,'instructor'::text])
    )
  )
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (
    tenant_id = rpc_private.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = ANY (ARRAY['admin'::text,'staff'::text,'instructor'::text])
    )
  )
);

CREATE POLICY attendance_hours_admin_delete ON public.attendance_hours
FOR DELETE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);

-- job_placements -----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own job placements" ON public.job_placements;
DROP POLICY IF EXISTS admin_all ON public.job_placements;
DROP POLICY IF EXISTS admin_bypass_select ON public.job_placements;
DROP POLICY IF EXISTS admin_bypass_insert ON public.job_placements;
DROP POLICY IF EXISTS admin_bypass_update ON public.job_placements;
DROP POLICY IF EXISTS admin_bypass_delete ON public.job_placements;
DROP POLICY IF EXISTS job_placements_select ON public.job_placements;
DROP POLICY IF EXISTS job_placements_insert ON public.job_placements;
DROP POLICY IF EXISTS job_placements_update ON public.job_placements;
DROP POLICY IF EXISTS job_placements_admin_all ON public.job_placements;
CREATE POLICY job_placements_admin_all ON public.job_placements
FOR ALL TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (rpc_private.is_admin() AND tenant_id = rpc_private.get_current_tenant_id())
);
-- Existing user SELECT and employer-owned SELECT/INSERT/UPDATE policies remain.
