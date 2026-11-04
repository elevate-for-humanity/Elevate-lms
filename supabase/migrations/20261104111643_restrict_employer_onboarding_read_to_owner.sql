-- Applied and verified against the existing QA employer with a rollback-only ownership test.
alter policy auth_read_employer_onboarding on public.employer_onboarding to authenticated using (exists (select 1 from public.employers e where e.id = employer_onboarding.employer_id and e.owner_user_id = (select auth.uid())));
