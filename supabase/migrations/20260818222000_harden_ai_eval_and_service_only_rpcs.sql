-- Harden AI evaluation RLS and restrict clearly service-only SECURITY DEFINER functions.

create policy "ai_eval_cases_admin_read" on public.ai_eval_cases
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')));

create policy "ai_eval_cases_admin_write" on public.ai_eval_cases
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')));

create policy "ai_eval_runs_admin_read" on public.ai_eval_runs
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')));

create policy "ai_eval_runs_admin_write" on public.ai_eval_runs
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')));

create policy "ai_eval_results_admin_read" on public.ai_eval_results
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')));

create policy "ai_eval_results_admin_write" on public.ai_eval_results
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')));

create policy "ai_eval_baselines_admin_read" on public.ai_eval_baselines
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')));

create policy "ai_eval_baselines_admin_write" on public.ai_eval_baselines
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')));

revoke all on function public.sync_barber_wage_obligation(uuid) from public, anon, authenticated;
grant execute on function public.sync_barber_wage_obligation(uuid) to service_role;
revoke all on function public.trg_sync_barber_wage_obligation() from public, anon, authenticated;
grant execute on function public.trg_sync_barber_wage_obligation() to service_role;

revoke all on function public.escalate_funding_verification_sla() from public, anon, authenticated;
grant execute on function public.escalate_funding_verification_sla() to service_role;
revoke all on function public.escalate_overdue_funding_verifications() from public, anon, authenticated;
grant execute on function public.escalate_overdue_funding_verifications() to service_role;
revoke all on function public.expire_stale_exam_authorizations() from public, anon, authenticated;
grant execute on function public.expire_stale_exam_authorizations() to service_role;
revoke all on function public.log_audit_table_ddl() from public, anon, authenticated;
grant execute on function public.log_audit_table_ddl() to service_role;
revoke all on function public.rls_test_report() from public, anon, authenticated;
grant execute on function public.rls_test_report() to service_role;
revoke all on function public.rls_two_tenant_test() from public, anon, authenticated;
grant execute on function public.rls_two_tenant_test() to service_role;
revoke all on function public.set_audit_context(text,text,text) from public, anon, authenticated;
grant execute on function public.set_audit_context(text,text,text) to service_role;
