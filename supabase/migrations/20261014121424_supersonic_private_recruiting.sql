-- Reuse the canonical job-application and staff-training tables.
alter table public.job_applications enable row level security;
revoke all on public.job_applications from anon;
create unique index if not exists supersonic_candidate_one_application on public.job_applications(user_id) where job_id='supersonic-tax-professional';
create policy supersonic_candidate_private_read on public.job_applications as restrictive for select to authenticated using(job_id is distinct from 'supersonic-tax-professional' or user_id=(select auth.uid()) or ((select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.tax_offices o where o.office_code='SFC-IND-001' and o.owner_id=(select auth.uid()))));
create policy supersonic_candidate_server_insert on public.job_applications as restrictive for insert to authenticated with check(job_id is distinct from 'supersonic-tax-professional');
create policy supersonic_candidate_server_update on public.job_applications as restrictive for update to authenticated using(job_id is distinct from 'supersonic-tax-professional') with check(job_id is distinct from 'supersonic-tax-professional');
create policy supersonic_candidate_server_delete on public.job_applications as restrictive for delete to authenticated using(job_id is distinct from 'supersonic-tax-professional');
