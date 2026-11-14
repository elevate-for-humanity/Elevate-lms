-- Staff hiring review uses the MFA and office-scoped server endpoint.
-- Candidate reads must not require direct access to the private offices table.
alter policy supersonic_candidate_private_read on public.job_applications using (job_id is distinct from 'supersonic-tax-professional' or user_id=(select auth.uid()));
