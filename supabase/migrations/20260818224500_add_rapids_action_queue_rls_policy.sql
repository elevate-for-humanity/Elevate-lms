create policy "rapids_action_queue_admin_read"
on public.rapids_action_queue
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role::text,'')) in ('super_admin','admin','staff')
  )
);

comment on policy "rapids_action_queue_admin_read" on public.rapids_action_queue is 'Administrative read-only visibility; queue mutations remain service-role controlled.';
