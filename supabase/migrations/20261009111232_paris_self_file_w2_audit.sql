grant insert on public.tax_return_events to authenticated;
create policy tax_self_file_w2_event on public.tax_return_events for insert to authenticated with check (
  actor_user_id = (select auth.uid()) and event_type = 'w2_confirmed'
  and exists (select 1 from public.tax_returns r where r.id = return_id and r.service_type = 'self_file' and r.created_by_user_id = (select auth.uid()))
  and exists (select 1 from public.tax_w2_income w where w.tax_return_id = return_id and w.id::text = event_data->>'w2_id')
);
