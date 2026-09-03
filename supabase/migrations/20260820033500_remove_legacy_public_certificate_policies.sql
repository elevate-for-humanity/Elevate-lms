-- Remove legacy PUBLIC certificate policies that predate explicit role-scoped policies.
-- They force anonymous SELECT evaluation through tenant/admin helpers and also expose
-- broader INSERT/UPDATE grants than the current certificate authorization model.
DROP POLICY IF EXISTS certificates_select ON public.certificates;
DROP POLICY IF EXISTS certificates_insert ON public.certificates;
DROP POLICY IF EXISTS certificates_update ON public.certificates;
