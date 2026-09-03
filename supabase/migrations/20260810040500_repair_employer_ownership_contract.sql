-- Canonical employer ownership contract.
-- employers.owner_user_id identifies the authenticated account.
-- job_postings.employer_id and apprenticeships.employer_id identify employers.id.

DROP POLICY IF EXISTS auth_read_employers ON public.employers;
DROP POLICY IF EXISTS employer_public_policy ON public.employers;
DROP POLICY IF EXISTS employer_own_record_select ON public.employers;
DROP POLICY IF EXISTS employer_own_record_insert ON public.employers;
DROP POLICY IF EXISTS employer_own_record_update ON public.employers;
CREATE POLICY employer_own_record_select ON public.employers FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY employer_own_record_insert ON public.employers FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY employer_own_record_update ON public.employers FOR UPDATE TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE ON TABLE public.employers TO authenticated;

DROP POLICY IF EXISTS employer_own_postings ON public.job_postings;
CREATE POLICY employer_own_postings ON public.job_postings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.employers e WHERE e.id = job_postings.employer_id AND e.owner_user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.employers e WHERE e.id = job_postings.employer_id AND e.owner_user_id = auth.uid()));

DROP POLICY IF EXISTS employer_see_own_job_apps ON public.job_applications;
CREATE POLICY employer_see_own_job_apps ON public.job_applications FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.job_postings jp
  JOIN public.employers e ON e.id = jp.employer_id
  WHERE jp.id = job_applications.job_posting_id
    AND e.owner_user_id = auth.uid()
));
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_applications TO authenticated;

DROP POLICY IF EXISTS apprenticeship_public_policy ON public.apprenticeships;
DROP POLICY IF EXISTS auth_read_apprenticeships ON public.apprenticeships;
DROP POLICY IF EXISTS employer_own_apprenticeships_select ON public.apprenticeships;
DROP POLICY IF EXISTS employer_own_apprenticeships_insert ON public.apprenticeships;
DROP POLICY IF EXISTS employer_own_apprenticeships_update ON public.apprenticeships;
DROP POLICY IF EXISTS employer_own_apprenticeships_delete ON public.apprenticeships;
CREATE POLICY employer_own_apprenticeships_select ON public.apprenticeships FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.employers e WHERE e.id = apprenticeships.employer_id AND e.owner_user_id = auth.uid())
);
CREATE POLICY employer_own_apprenticeships_insert ON public.apprenticeships FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.employers e WHERE e.id = apprenticeships.employer_id AND e.owner_user_id = auth.uid())
);
CREATE POLICY employer_own_apprenticeships_update ON public.apprenticeships FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.employers e WHERE e.id = apprenticeships.employer_id AND e.owner_user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.employers e WHERE e.id = apprenticeships.employer_id AND e.owner_user_id = auth.uid())
);
CREATE POLICY employer_own_apprenticeships_delete ON public.apprenticeships FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.employers e WHERE e.id = apprenticeships.employer_id AND e.owner_user_id = auth.uid())
);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.apprenticeships TO authenticated;
