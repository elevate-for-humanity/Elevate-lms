create or replace function rpc_private.theory_access_status(p_user uuid,p_course uuid,p_now timestamptz default now())
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s public.apprenticeship_theory_schedules%rowtype; v_enforced boolean; local_now timestamp; next_open timestamptz; used integer; maximum integer; reason text; week_end date;
begin
 if auth.role() is distinct from 'service_role' and auth.uid() is distinct from p_user then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
 select cp.enforce_theory_schedule into v_enforced from public.course_pacing_plans cp where cp.course_id=p_course and cp.enabled;
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
 return jsonb_build_object('allowed',not coalesce(v_enforced,false) or reason is null,'enforced',coalesce(v_enforced,false),'scheduled',s.learner_confirmed_at is not null,
 'reason',reason,'nextOpensAt',next_open,'weeklyActiveSeconds',used,'weeklyTargetMinutes',s.weekly_target_minutes,'weeklyMaxMinutes',least(s.weekly_max_minutes,600),
 'timezone',s.timezone,'daysOfWeek',s.days_of_week,'startTime',s.start_time,'endTime',s.end_time,'dueDay','Sunday','dueTime','23:59');
end $$;

