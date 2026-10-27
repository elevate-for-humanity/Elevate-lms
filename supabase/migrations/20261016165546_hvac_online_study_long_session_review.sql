-- Preserve the session but require staff correction for missed clock-outs.
create or replace function public.record_hvac_online_study(p_user_id uuid, p_enrollment_id uuid, p_action text)
returns public.online_study_sessions language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  e public.program_enrollments;
  s public.online_study_sessions;
  attendance_id uuid;
  stopped_at timestamptz := clock_timestamp();
  elapsed numeric;
begin
  if p_action not in ('clock_in', 'clock_out') or p_action is null then raise exception 'Invalid action'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select * into e from public.program_enrollments where id=p_enrollment_id and user_id=p_user_id and program_slug='hvac-technician';
  if not found then raise exception 'Enrollment not authorized' using errcode='42501'; end if;
  if p_action='clock_in' then
    if coalesce(e.status, '') not in ('active','enrolled','in_progress') or e.revoked_at is not null or e.suspended_at is not null or e.cancelled_at is not null then
      raise exception 'Enrollment not active' using errcode='42501';
    end if;
    select * into s from public.online_study_sessions where user_id=p_user_id and clock_out_at is null;
    if found then
      if s.enrollment_id <> p_enrollment_id then raise exception 'Another study session is open'; end if;
      return s;
    end if;
    insert into public.online_study_sessions(user_id,enrollment_id) values(p_user_id,p_enrollment_id) returning * into s;
    return s;
  end if;
  select * into s from public.online_study_sessions where user_id=p_user_id and enrollment_id=p_enrollment_id and clock_out_at is null for update;
  if not found then raise exception 'No open session. Refresh attendance.'; end if;
  elapsed := round((extract(epoch from (stopped_at-s.clock_in_at))/3600)::numeric, 2);
  insert into public.attendance_hours(user_id,enrollment_id,tenant_id,date,hours_logged,hours_worked,type,logged_by,verified,status,notes)
  values(p_user_id,p_enrollment_id,e.tenant_id,(s.clock_in_at at time zone 'America/Indiana/Indianapolis')::date,case when elapsed>12 then 0 else elapsed end,case when elapsed>12 then 0 else elapsed end,'online',p_user_id,false,'pending',
    'Online study session '||s.id::text||'. Staff verification required.'||case when elapsed>12 then ' Elapsed session: '||elapsed::text||' hours. Missed clock-out suspected; logged hours held at zero until staff correct actual attendance.' else '' end)
  returning id into attendance_id;
  update public.online_study_sessions set clock_out_at=stopped_at,attendance_hours_id=attendance_id where id=s.id returning * into s;
  return s;
end;
$$;
revoke all on function public.record_hvac_online_study(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.record_hvac_online_study(uuid,uuid,text) to service_role;
