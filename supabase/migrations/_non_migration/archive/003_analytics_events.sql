-- Creates core analytics tables and helpers for dashboard visibility.
create extension if not exists "uuid-ossp";

create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  actor jsonb,
  properties jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.analytics_events is 'Normalized event log used for analytics dashboards and KPIs.';
comment on column public.analytics_events.event_type is 'Domain event identifier, e.g. course.enrolled or video.completed.';
comment on column public.analytics_events.actor is 'JSON object capturing user metadata at time of event (id, role, email).';
comment on column public.analytics_events.properties is 'Arbitrary JSON payload describing the event context.';

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_type_idx on public.analytics_events (event_type);

create or replace view public.analytics_daily_activity as
with days as (
  select generate_series(current_date - interval '29 days', current_date, interval '1 day')::date as day
),
counts as (
  select date_trunc('day', created_at)::date as day,
         count(*) as events,
         count(distinct actor ->> 'id') as unique_actors
  from public.analytics_events
  where created_at >= current_date - interval '29 days'
  group by 1
)
select d.day,
       coalesce(c.events, 0) as events,
       coalesce(c.unique_actors, 0) as unique_actors
from days d
left join counts c on d.day = c.day
order by d.day asc;

comment on view public.analytics_daily_activity is '30 day rolling window of total events and unique actors.';

create or replace function public.analytics_dashboard_metrics()
returns jsonb
language sql
stable
as
$$
  with series as (
    select * from public.analytics_daily_activity
  ),
  top_events as (
    select event_type, count(*) as total
    from public.analytics_events
    where created_at >= now() - interval '30 days'
    group by event_type
    order by total desc
    limit 5
  ),
  recent_students as (
    select count(distinct actor ->> 'id')::integer as total
    from public.analytics_events
    where created_at >= now() - interval '30 days'
      and coalesce(actor ->> 'role', '') = 'student'
  )
  select jsonb_build_object(
    'totalEvents', (select count(*) from public.analytics_events),
    'eventsLast7Days', (
      select count(*)
      from public.analytics_events
      where created_at >= now() - interval '7 days'
    ),
    'activeStudentsLast30Days', coalesce((select total from recent_students), 0),
    'series', (
      select jsonb_agg(
        jsonb_build_object('date', day, 'events', events, 'uniqueActors', unique_actors)
        order by day
      )
      from series
    ),
    'topEvents', coalesce((
      select jsonb_agg(jsonb_build_object('eventType', event_type, 'total', total))
      from top_events
    ), '[]'::jsonb)
  );
$$;

comment on function public.analytics_dashboard_metrics is 'Bundles headline KPI metrics for the admin analytics dashboard.';
