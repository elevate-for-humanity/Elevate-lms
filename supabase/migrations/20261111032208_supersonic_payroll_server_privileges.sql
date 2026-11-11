-- Supabase default privileges can grant service_role ALL on new tables before
-- explicit grants run. Narrow those inherited defaults without changing data.
revoke all on public.sfc_payroll_companies,public.sfc_payroll_runs,public.sfc_payroll_events from service_role;
grant select,insert,update on public.sfc_payroll_companies,public.sfc_payroll_runs to service_role;
grant select,insert on public.sfc_payroll_events to service_role;
