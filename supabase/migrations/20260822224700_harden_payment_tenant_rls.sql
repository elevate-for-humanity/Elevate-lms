-- Consolidate payment RLS so privileged writes cannot cross tenant boundaries
-- and admin reads are not accidentally blocked by a legacy restrictive owner policy.

-- payments -----------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS users_own ON public.payments;
DROP POLICY IF EXISTS admin_bypass_select ON public.payments;
DROP POLICY IF EXISTS admin_bypass_insert ON public.payments;
DROP POLICY IF EXISTS admin_bypass_update ON public.payments;
DROP POLICY IF EXISTS admin_bypass_delete ON public.payments;
DROP POLICY IF EXISTS payments_admin_select ON public.payments;
DROP POLICY IF EXISTS payments_admin_insert ON public.payments;
DROP POLICY IF EXISTS payments_admin_update ON public.payments;
DROP POLICY IF EXISTS payments_admin_delete ON public.payments;
DROP POLICY IF EXISTS payments_user_read_own ON public.payments;

CREATE POLICY payments_user_read_own ON public.payments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY payments_admin_select ON public.payments
FOR SELECT TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles subject
      WHERE subject.id = payments.user_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
);

CREATE POLICY payments_admin_insert ON public.payments
FOR INSERT TO authenticated
WITH CHECK (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles subject
      WHERE subject.id = payments.user_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
);

CREATE POLICY payments_admin_update ON public.payments
FOR UPDATE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles subject
      WHERE subject.id = payments.user_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles subject
      WHERE subject.id = payments.user_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
);

CREATE POLICY payments_admin_delete ON public.payments
FOR DELETE TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles subject
      WHERE subject.id = payments.user_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
);

-- payment_transactions ------------------------------------------------------
DROP POLICY IF EXISTS admin_all_payment_transactions ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_admin_all ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_staff_read ON public.payment_transactions;

CREATE POLICY payment_transactions_admin_all ON public.payment_transactions
FOR ALL TO authenticated
USING (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles subject
      WHERE subject.id = payment_transactions.user_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
)
WITH CHECK (
  rpc_private.is_super_admin()
  OR (
    rpc_private.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles subject
      WHERE subject.id = payment_transactions.user_id
        AND subject.tenant_id = rpc_private.get_current_tenant_id()
    )
  )
);

CREATE POLICY payment_transactions_staff_read ON public.payment_transactions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles caller
    JOIN public.profiles subject
      ON subject.id = payment_transactions.user_id
    WHERE caller.id = auth.uid()
      AND caller.role = 'staff'
      AND caller.tenant_id = rpc_private.get_current_tenant_id()
      AND subject.tenant_id = rpc_private.get_current_tenant_id()
  )
);
