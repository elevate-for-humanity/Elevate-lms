set local lock_timeout='3s';
set local statement_timeout='10s';
alter table public.course_pacing_plans add column if not exists enforce_theory_schedule boolean not null default false;
alter table public.apprenticeship_theory_schedules add column if not exists learner_confirmed_at timestamptz;

create or replace function rpc_private.theory_window_contains(p_days smallint[],p_start time,p_end time,p_zone text,p_now timestamptz)
returns boolean language sql immutable set search_path='' as $$
 select extract(isodow from p_now at time zone p_zone)::smallint=any(p_days)
 and (p_now at time zone p_zone)::time>=p_start and (p_now at time zone p_zone)::time<p_end;
$$;
revoke all on function rpc_private.theory_window_contains(smallint[],time,time,text,timestamptz) from public,anon,authenticated;
grant execute on function rpc_private.theory_window_contains(smallint[],time,time,text,timestamptz) to service_role;

create or replace function rpc_private.theory_access_status(p_user uuid,p_course uuid,p_now timestamptz default now())
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s public.apprenticeship_theory_schedules%rowtype; enabled boolean; local_now timestamp; next_open timestamptz; used integer; maximum integer; reason text; week_end date;
begin
 if auth.role() is distinct from 'service_role' and auth.uid() is distinct from p_user then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
 select enforce_theory_schedule into enabled from public.course_pacing_plans where course_id=p_course and enabled;
 select * into s from public.apprenticeship_theory_schedules where user_id=p_user and course_id=p_course and active order by updated_at desc,id limit 1;
 if s.id is null then return jsonb_build_object('allowed',true,'enforced',false,'scheduled',false); end if;
 local_now:=p_now at time zone s.timezone;
 week_end:=date_trunc('week',local_now)::date+6;
 select coalesce(sum(active_seconds),0)::integer into used from public.theory_activity_sessions where user_id=p_user and week_ending=week_end;
 maximum:=least(s.weekly_max_minutes,600)*60;
 select min((d::date+s.start_time) at time zone s.timezone) into next_open from generate_series(local_now::date::timestamp,local_now::date::timestamp+interval '7 days',interval '1 day') d
 where extract(isodow from d)::smallint=any(s.days_of_week) and ((d::date+s.start_time) at time zone s.timezone)>p_now;
 if s.learner_confirmed_at is null then reason:='SCHEDULE_REQUIRED';
 elsif local_now::date<s.starts_on then reason:='THEORY_NOT_STARTED';
 elsif used>=maximum then reason:='WEEKLY_THEORY_LIMIT_REACHED';
 elsif not rpc_private.theory_window_contains(s.days_of_week,s.start_time,s.end_time,s.timezone,p_now) then reason:='OUTSIDE_THEORY_WINDOW';
 elsif exists(select 1 from public.apprentices a join public.progress_entries pe on pe.apprentice_id=a.id where a.user_id=p_user and pe.clock_in_at is not null and pe.clock_out_at is null) then reason:='OJL_OVERLAP';
 end if;
 return jsonb_build_object('allowed',not coalesce(enabled,false) or reason is null,'enforced',coalesce(enabled,false),'scheduled',s.learner_confirmed_at is not null,
 'reason',reason,'nextOpensAt',next_open,'weeklyActiveSeconds',used,'weeklyTargetMinutes',s.weekly_target_minutes,'weeklyMaxMinutes',least(s.weekly_max_minutes,600),
 'timezone',s.timezone,'daysOfWeek',s.days_of_week,'startTime',s.start_time,'endTime',s.end_time,'dueDay','Sunday','dueTime','23:59');
end $$;
revoke all on function rpc_private.theory_access_status(uuid,uuid,timestamptz) from public,anon,authenticated;
grant execute on function rpc_private.theory_access_status(uuid,uuid,timestamptz) to service_role;

create or replace function public.get_apprentice_theory_window(p_user uuid,p_course uuid)
returns jsonb language sql stable security invoker set search_path='' as $$ select rpc_private.theory_access_status(p_user,p_course,now()); $$;
revoke all on function public.get_apprentice_theory_window(uuid,uuid) from public,anon,authenticated;
grant execute on function public.get_apprentice_theory_window(uuid,uuid) to service_role;

-- Extend existing course, row-security, direct API and credit guards; retain all prerequisite checks.
do $patch$
declare source text;
begin
 select pg_get_functiondef('rpc_private.paced_lesson_access(uuid,uuid)'::regprocedure) into source;
 if position('theory_access_status' in source)=0 then
  source:=replace(source,'start_at:=rpc_private.course_pacing_start(p_user,l.course_id);',
   'start_at:=rpc_private.course_pacing_start(p_user,l.course_id); IF NOT coalesce((rpc_private.theory_access_status(p_user,l.course_id,now())->>''allowed'')::boolean,false) THEN RETURN false; END IF;');
  if position('theory_access_status' in source)=0 then raise exception 'PACING_GUARD_PATCH_TARGET_MISSING'; end if;
  execute source;
 end if;
 select pg_get_functiondef('public.get_my_course_pacing(uuid)'::regprocedure) into source;
 if position('''theoryWindow''' in source)=0 then
  source:=replace(source,'''startAt'',start_at,','''startAt'',start_at,''theoryWindow'',rpc_private.theory_access_status(actor,p_course_id,now()),');
  if position('''theoryWindow''' in source)=0 then raise exception 'PACING_READBACK_PATCH_TARGET_MISSING'; end if;
  execute source;
 end if;
 select pg_get_functiondef('public.record_theory_activity_heartbeat(uuid,uuid)'::regprocedure) into source;
 if position('Scheduled theory access is closed' in source)=0 then
  source:=replace(source,'v_has_open_ojl boolean;','v_has_open_ojl boolean; v_window jsonb;');
  source:=replace(source,'v_elapsed := least(',
   'v_window:=rpc_private.theory_access_status(p_user_id,v_session.course_id,now()); IF NOT coalesce((v_window->>''allowed'')::boolean,false) THEN UPDATE public.theory_activity_sessions SET status=''blocked'',ended_at=now(),last_block_reason=''Scheduled theory access is closed'',updated_at=now() WHERE id=v_session.id; RETURN QUERY SELECT v_session.id,0,coalesce((v_window->>''weeklyActiveSeconds'')::integer,0),''blocked''::text,''Scheduled theory access is closed''::text; RETURN; END IF; v_elapsed := least(');
  source:=replace(source,'greatest(36000-v_weekly,0)','greatest(least(36000,coalesce((v_window->>''weeklyMaxMinutes'')::integer,600)*60)-v_weekly,0)');
  if position('Scheduled theory access is closed' in source)=0 then raise exception 'THEORY_HEARTBEAT_PATCH_TARGET_MISSING'; end if;
  execute source;
 end if;
end $patch$;

