grant select,insert,update,delete on public.tax_schedule_c to authenticated;
grant select on public.tax_1099_income,public.tax_itemized_deductions to authenticated;
create policy tax_1099_self_file_select on public.tax_1099_income for select to authenticated using (exists(select 1 from public.tax_returns r where r.id=tax_1099_income.tax_return_id and r.service_type='self_file' and r.created_by_user_id=(select auth.uid())));
create policy tax_itemized_self_file_select on public.tax_itemized_deductions for select to authenticated using (exists(select 1 from public.tax_returns r where r.id=tax_itemized_deductions.tax_return_id and r.service_type='self_file' and r.created_by_user_id=(select auth.uid())));
