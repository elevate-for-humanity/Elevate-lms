-- Canonical Case Manager assignment identity
--
-- case_manager_assignments is application-scoped in the live schema:
--   application_id, case_manager_id, id
--
-- Earlier RLS incorrectly assumed a learner_id column existed on the assignment
-- table. Keep application_id as the single assignment identity and derive the
-- corresponding learner/profile id through applications.email -> profiles.email.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_my_assigned_application_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ARRAY_AGG(cma.application_id) FILTER (WHERE cma.application_id IS NOT NULL), ARRAY[]::uuid[])
  FROM public.case_manager_assignments AS cma
  WHERE cma.case_manager_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_assigned_learner_ids()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ARRAY_AGG(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL), ARRAY[]::uuid[])
  FROM public.case_manager_assignments AS cma
  JOIN public.applications AS a
    ON a.id = cma.application_id
  JOIN public.profiles AS p
    ON lower(p.email) = lower(a.email)
  WHERE cma.case_manager_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_assigned_application_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_assigned_learner_ids() TO authenticated;

COMMIT;
