-- Enable row level security and define baseline policies for analytics events.
alter table public.analytics_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_events'
      and policyname = 'allow_insert_from_authenticated_clients'
  ) then
    create policy allow_insert_from_authenticated_clients
      on public.analytics_events
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'analytics_events'
      and policyname = 'allow_service_role_full_access'
  ) then
    create policy allow_service_role_full_access
      on public.analytics_events
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

alter function public.analytics_dashboard_metrics() security definer;
alter function public.analytics_dashboard_metrics() set search_path = public;
comment on function public.analytics_dashboard_metrics is 'Bundles headline KPI metrics for the admin analytics dashboard (executes as definer to avoid RLS friction).';
