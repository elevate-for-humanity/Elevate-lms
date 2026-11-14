-- Canonical apprentice theory pacing and reminder schedule.
-- The schedule is shared by the apprentice and the assigned Host Shop.

create table if not exists public.apprenticeship_theory_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  placement_id uuid references public.apprentice_placements(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete cascade,
  program_slug text not null,
  course_id uuid references public.courses(id) on delete set null,
  timezone text not null default 'America/Indiana/Indianapolis',
  days_of_week smallint[] not null default array[1,2,3,4]::smallint[],
  start_time time not null default '18:00',
  end_time time not null default '18:45',
  weekly_target_minutes integer not null default 180,
  weekly_max_minutes integer not null default 600,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint theory_schedule_days_valid check (
    cardinality(days_of_week) between 1 and 7
    and days_of_week <@ array[1,2,3,4,5,6,7]::smallint[]
  ),
  constraint theory_schedule_time_valid check (end_time > start_time),
  constraint theory_schedule_target_valid check (weekly_target_minutes between 30 and 2400),
  constraint theory_schedule_max_valid check (
    weekly_max_minutes between weekly_target_minutes and 2400
  )
);

create unique index if not exists apprenticeship_theory_schedules_active_placement_uidx
  on public.apprenticeship_theory_schedules(placement_id)
  where active and placement_id is not null;
create index if not exists apprenticeship_theory_schedules_user_idx
  on public.apprenticeship_theory_schedules(user_id, active);
create index if not exists apprenticeship_theory_schedules_partner_idx
  on public.apprenticeship_theory_schedules(partner_id, active);
create index if not exists apprenticeship_theory_schedules_course_idx
  on public.apprenticeship_theory_schedules(course_id);
create index if not exists apprenticeship_theory_schedules_created_by_idx
  on public.apprenticeship_theory_schedules(created_by);

alter table public.apprenticeship_theory_schedules enable row level security;

drop policy if exists theory_schedule_apprentice_read on public.apprenticeship_theory_schedules;
create policy theory_schedule_apprentice_read
on public.apprenticeship_theory_schedules for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists theory_schedule_host_read on public.apprenticeship_theory_schedules;
create policy theory_schedule_host_read
on public.apprenticeship_theory_schedules for select to authenticated
using (
  exists (
    select 1 from public.partner_users pu
    where pu.partner_id = apprenticeship_theory_schedules.partner_id
      and pu.user_id = (select auth.uid())
      and pu.status = 'active'
  )
);

grant select on public.apprenticeship_theory_schedules to authenticated;

create or replace function public.ensure_apprentice_theory_schedule()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_partner_id uuid;
  v_course_id uuid;
begin
  if new.status <> 'active' or new.program_slug is null then
    return new;
  end if;

  select s.partner_id into v_partner_id
  from public.shops s where s.id = new.shop_id;

  select c.id into v_course_id
  from public.courses c
  where c.slug = new.program_slug
  order by (c.status = 'published') desc, c.published_at desc nulls last, c.updated_at desc
  limit 1;

  insert into public.apprenticeship_theory_schedules(
    user_id, placement_id, partner_id, program_slug, course_id
  ) values (
    new.student_id, new.id, v_partner_id, new.program_slug, v_course_id
  )
  on conflict (placement_id) where active and placement_id is not null
  do update set
    user_id = excluded.user_id,
    partner_id = excluded.partner_id,
    program_slug = excluded.program_slug,
    course_id = coalesce(excluded.course_id, apprenticeship_theory_schedules.course_id),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ensure_apprentice_theory_schedule on public.apprentice_placements;
create trigger trg_ensure_apprentice_theory_schedule
after insert or update of status, student_id, shop_id, program_slug
on public.apprentice_placements
for each row execute function public.ensure_apprentice_theory_schedule();

create or replace function public.queue_due_theory_schedule_notifications(p_now timestamptz default now())
returns integer
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_schedule record;
  v_local timestamp;
  v_event text;
  v_key text;
  v_notification_id uuid;
  v_count integer := 0;
begin
  for v_schedule in
    select s.*, p.email, coalesce(p.first_name, split_part(coalesce(p.full_name, ''), ' ', 1), 'Apprentice') as first_name
    from public.apprenticeship_theory_schedules s
    join public.profiles p on p.id = s.user_id
    where s.active and p.is_active is not false
  loop
    v_local := p_now at time zone v_schedule.timezone;
    if not extract(isodow from v_local)::smallint = any(v_schedule.days_of_week) then
      continue;
    end if;

    v_event := null;
    if v_local::time >= v_schedule.start_time
       and v_local::time < v_schedule.start_time + interval '5 minutes' then
      v_event := 'start';
    elsif v_local::time >= v_schedule.end_time
       and v_local::time < v_schedule.end_time + interval '5 minutes' then
      v_event := 'stop';
    end if;
    if v_event is null then continue; end if;

    v_key := 'theory:' || v_event || ':' || v_schedule.id || ':' || v_local::date;
    insert into public.notifications(user_id, type, title, message, action_url, action_label, metadata, idempotency_key)
    values (
      v_schedule.user_id,
      'reminder',
      case when v_event = 'start' then 'It is time to start theory' else 'Theory session complete' end,
      case when v_event = 'start'
        then 'Open your assigned theory course now. This week''s target is ' || round(v_schedule.weekly_target_minutes / 60.0, 1) || ' hours.'
        else 'Stop this scheduled theory block, save your work, and return at the next scheduled time. Do not exceed ' || round(v_schedule.weekly_max_minutes / 60.0, 1) || ' theory hours in one week.' end,
      '/apprentice', 'Open apprentice dashboard',
      jsonb_build_object('schedule_id', v_schedule.id, 'event', v_event, 'local_date', v_local::date),
      v_key
    ) on conflict (idempotency_key) do nothing
    returning id into v_notification_id;

    if v_notification_id is not null then
      insert into public.notification_outbox(
        to_email, channel, template_key, template_data, status,
        entity_type, entity_id, type, recipient_id, recipient_email, metadata
      ) values (
        v_schedule.email, 'email', 'theory_schedule_' || v_event,
        jsonb_build_object(
          'name', v_schedule.first_name,
          'weekly_target_hours', round(v_schedule.weekly_target_minutes / 60.0, 1),
          'weekly_max_hours', round(v_schedule.weekly_max_minutes / 60.0, 1),
          'dashboard_url', 'https://app.elevateforhumanity.org/apprentice'
        ),
        'queued', 'apprenticeship_theory_schedule', v_schedule.id,
        'theory_schedule_' || v_event, v_schedule.user_id, v_schedule.email,
        jsonb_build_object('idempotency_key', v_key)
      );
      v_count := v_count + 1;
    end if;
    v_notification_id := null;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.queue_due_theory_schedule_notifications(timestamptz) from public, anon, authenticated;
grant execute on function public.queue_due_theory_schedule_notifications(timestamptz) to service_role;

insert into public.apprenticeship_theory_schedules(user_id, placement_id, partner_id, program_slug, course_id)
select ap.student_id, ap.id, s.partner_id, ap.program_slug, c.id
from public.apprentice_placements ap
join public.shops s on s.id = ap.shop_id
left join lateral (
  select id from public.courses
  where slug = ap.program_slug
  order by (status = 'published') desc, published_at desc nulls last, updated_at desc
  limit 1
) c on true
where ap.status = 'active' and ap.program_slug is not null
on conflict (placement_id) where active and placement_id is not null do nothing;

do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'apprenticeship-theory-reminders';
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
  perform cron.schedule(
    'apprenticeship-theory-reminders',
    '*/5 * * * *',
    'select public.queue_due_theory_schedule_notifications();'
  );
end $$;
