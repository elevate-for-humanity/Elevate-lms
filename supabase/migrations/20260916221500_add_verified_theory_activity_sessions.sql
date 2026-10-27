-- Auditable active-learning evidence for apprenticeship related instruction.
-- Browser login/page-open time is never credited. The service-role-only RPC
-- measures short server intervals, rejects OJL overlap, and enforces 10h/week.

create table if not exists public.theory_activity_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  week_ending date not null,
  started_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  ended_at timestamptz,
  active_seconds integer not null default 0 check (active_seconds >= 0),
  status text not null default 'active' check (status in ('active','paused','completed','blocked')),
  last_block_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists theory_activity_one_active_per_user
  on public.theory_activity_sessions(user_id) where status='active';
create index if not exists theory_activity_user_week
  on public.theory_activity_sessions(user_id,week_ending);
create index if not exists theory_activity_lesson
  on public.theory_activity_sessions(user_id,lesson_id);

alter table public.theory_activity_sessions enable row level security;
revoke all on public.theory_activity_sessions from anon;
grant select on public.theory_activity_sessions to authenticated;
grant select,insert,update on public.theory_activity_sessions to service_role;

drop policy if exists theory_activity_owner_select on public.theory_activity_sessions;
create policy theory_activity_owner_select on public.theory_activity_sessions
for select to authenticated using (user_id=auth.uid());

create or replace function public.record_theory_activity_heartbeat(
  p_session_id uuid,
  p_user_id uuid
) returns table (
  session_id uuid,
  credited_seconds integer,
  weekly_active_seconds integer,
  session_status text,
  block_reason text
)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_session public.theory_activity_sessions%rowtype;
  v_elapsed integer;
  v_weekly integer;
  v_remaining integer;
  v_credit integer;
  v_has_open_ojl boolean;
begin
  select * into v_session
  from public.theory_activity_sessions
  where id=p_session_id and user_id=p_user_id
  for update;

  if not found then raise exception 'Theory session not found' using errcode='P0002'; end if;
  if v_session.status <> 'active' then
    return query select v_session.id,0,
      coalesce((select sum(s.active_seconds)::integer from public.theory_activity_sessions s where s.user_id=p_user_id and s.week_ending=v_session.week_ending),0),
      v_session.status,v_session.last_block_reason;
    return;
  end if;

  select exists(
    select 1 from public.apprentices a
    join public.progress_entries pe on pe.apprentice_id=a.id
    where a.user_id=p_user_id and pe.clock_in_at is not null and pe.clock_out_at is null
  ) into v_has_open_ojl;

  if v_has_open_ojl then
    update public.theory_activity_sessions
    set status='blocked',ended_at=now(),last_block_reason='Clock out of OJL before earning theory time',updated_at=now()
    where id=v_session.id;
    return query select v_session.id,0,
      coalesce((select sum(s.active_seconds)::integer from public.theory_activity_sessions s where s.user_id=p_user_id and s.week_ending=v_session.week_ending),0),
      'blocked'::text,'Clock out of OJL before earning theory time'::text;
    return;
  end if;

  v_elapsed := least(greatest(floor(extract(epoch from (now()-v_session.last_heartbeat_at)))::integer,0),75);
  select coalesce(sum(s.active_seconds),0)::integer into v_weekly
  from public.theory_activity_sessions s
  where s.user_id=p_user_id and s.week_ending=v_session.week_ending;
  v_remaining := greatest(36000-v_weekly,0);
  v_credit := least(v_elapsed,v_remaining);

  update public.theory_activity_sessions
  set active_seconds=active_seconds+v_credit,
      last_heartbeat_at=now(),
      status=case when v_remaining<=v_elapsed then 'paused' else status end,
      last_block_reason=case when v_remaining<=v_elapsed then 'Weekly 10-hour theory limit reached' else null end,
      updated_at=now()
  where id=v_session.id;

  return query select v_session.id,v_credit,v_weekly+v_credit,
    case when v_remaining<=v_elapsed then 'paused'::text else 'active'::text end,
    case when v_remaining<=v_elapsed then 'Weekly 10-hour theory limit reached'::text else null::text end;
end;
$$;

revoke all on function public.record_theory_activity_heartbeat(uuid,uuid) from public,anon,authenticated;
grant execute on function public.record_theory_activity_heartbeat(uuid,uuid) to service_role;
