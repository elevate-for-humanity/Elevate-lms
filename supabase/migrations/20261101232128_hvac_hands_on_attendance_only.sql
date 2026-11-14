create table public.hvac_hands_on_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  enrollment_id uuid not null references public.program_enrollments(id),
  clock_in_at timestamptz not null default now(),
  clock_out_at timestamptz,
  attendance_hours_id uuid unique references public.attendance_hours(id),
  attested_hands_on boolean not null default false check (attested_hands_on),
  check (clock_out_at is null or clock_out_at >= clock_in_at)
);
create unique index hvac_hands_on_one_open on public.hvac_hands_on_sessions(user_id) where clock_out_at is null;
create index hvac_hands_on_enrollment on public.hvac_hands_on_sessions(enrollment_id);
alter table public.hvac_hands_on_sessions enable row level security;
revoke all on public.hvac_hands_on_sessions from anon, authenticated;
grant select on public.hvac_hands_on_sessions to authenticated;
grant all on public.hvac_hands_on_sessions to service_role;
create policy hvac_hands_on_own_read on public.hvac_hands_on_sessions for select to authenticated using ((select auth.uid()) = user_id);

create function public.record_hvac_hands_on(p_user_id uuid, p_enrollment_id uuid, p_action text, p_attested boolean default false)
returns public.hvac_hands_on_sessions language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  e public.program_enrollments;
  s public.hvac_hands_on_sessions;
  stopped_at timestamptz := clock_timestamp();
  elapsed numeric;
  attendance_id uuid;
begin
  if p_action not in ('clock_in','clock_out') then raise exception 'Invalid hands-on clock action' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('hvac_hands_on:' || p_user_id::text, 0));
  select * into e from public.program_enrollments where id=p_enrollment_id and
    (user_id=p_user_id or student_id=p_user_id) and program_slug in ('hvac-technician','hvac','hvac-epa-608');
  if not found then raise exception 'HVAC enrollment required' using errcode='42501'; end if;
  select * into s from public.hvac_hands_on_sessions where user_id=p_user_id and clock_out_at is null for update;
  if p_action='clock_in' then
    if e.status not in ('active','enrolled','in_progress','confirmed') or
       e.revoked_at is not null or e.suspended_at is not null or e.cancelled_at is not null or p_attested is distinct from true
    then raise exception 'Active HVAC enrollment and hands-on attestation required' using errcode='42501'; end if;
    if s.id is not null then
      if s.enrollment_id<>p_enrollment_id then raise exception 'Close your existing hands-on session first'; end if;
      return s;
    end if;
    insert into public.hvac_hands_on_sessions(user_id,enrollment_id,attested_hands_on)
    values(p_user_id,p_enrollment_id,true) returning * into s;
    return s;
  end if;
  if s.id is null or s.enrollment_id<>p_enrollment_id then raise exception 'No open hands-on session for this enrollment'; end if;
  elapsed := round((extract(epoch from (stopped_at-s.clock_in_at))/3600)::numeric,4);
  insert into public.attendance_hours(user_id,enrollment_id,tenant_id,date,hours_logged,hours_worked,type,logged_by,verified,status,notes)
  values(p_user_id,p_enrollment_id,e.tenant_id,(s.clock_in_at at time zone 'America/Indiana/Indianapolis')::date,
    case when elapsed>12 then 0 else elapsed end,case when elapsed>12 then 0 else elapsed end,
    'practical',p_user_id,false,'pending',
    'HVAC hands-on session '||s.id::text||'. Student attestation; instructor verification required. Breaks excluded by separate clock-outs.'||
    case when elapsed>12 then ' Missed clock-out suspected. Hours held at zero for documented staff correction.' else '' end)
  returning id into attendance_id;
  update public.hvac_hands_on_sessions set clock_out_at=stopped_at,attendance_hours_id=attendance_id where id=s.id returning * into s;
  return s;
end;
$$;
revoke all on function public.record_hvac_hands_on(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.record_hvac_hands_on(uuid,uuid,text,boolean) to service_role;
