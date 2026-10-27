alter table public.tax_schedule_c add column if not exists income_owner text not null default 'primary' check (income_owner in ('primary','spouse'));
alter table public.tax_schedule_c add column if not exists principal_activity text;
alter table public.tax_schedule_c add column if not exists worksheet_details jsonb;
alter table public.tax_schedule_c add column if not exists updated_at timestamptz not null default now();
create policy tax_schedule_c_self_file_owner on public.tax_schedule_c for all to authenticated using (exists (select 1 from public.tax_returns r where r.id=tax_schedule_c.tax_return_id and r.service_type='self_file' and r.created_by_user_id=(select auth.uid()))) with check (exists (select 1 from public.tax_returns r where r.id=tax_schedule_c.tax_return_id and r.service_type='self_file' and r.created_by_user_id=(select auth.uid())));
