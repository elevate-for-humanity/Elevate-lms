-- Report verified RTI against the learner's confirmed schedule. Never invent
-- a weekly hours obligation or treat pending verification as no activity.
alter table public.reporting_verdicts
  add column if not exists enrollment_id uuid references public.program_enrollments(id),
  add column if not exists student_id uuid references auth.users(id),
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists status text,
  add column if not exists required_hours numeric,
  add column if not exists logged_hours numeric,
  add column if not exists required_sessions integer,
  add column if not exists completed_sessions integer;
create unique index if not exists reporting_verdicts_enrollment_period_key
  on public.reporting_verdicts(enrollment_id,period_start,period_end);
alter table public.reporting_verdicts enable row level security;
grant select,insert,update on public.reporting_verdicts to service_role;

create or replace function public.generate_reporting_verdicts(p_period_start date,p_period_end date)
returns table(total_enrollments integer,verdicts_created integer,on_track integer,behind integer,no_activity integer)
language plpgsql security invoker set search_path='' as $$
declare item record; outcome text; report_id uuid; key text; note text;
begin
 if coalesce(auth.role(),'') <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
 if p_period_start is null or p_period_end is null or p_period_end<p_period_start or p_period_end-p_period_start>6 then raise exception 'VALID_REPORTING_PERIOD_REQUIRED'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('theory-report:'||p_period_start::text||':'||p_period_end::text,0));
 total_enrollments:=0;verdicts_created:=0;on_track:=0;behind:=0;no_activity:=0;
 for item in
   select e.id,e.user_id,s.id as schedule_id,
    coalesce(s.timezone,'America/Indiana/Indianapolis') as timezone,s.end_time,
    coalesce(sessions.expected,0)::integer as expected_sessions,
    coalesce(sessions.expected * s.weekly_target_minutes::numeric / nullif(cardinality(s.days_of_week),0),0) as required_minutes,
    coalesce(logged.verified_minutes,0) as verified_minutes,coalesce(logged.pending_minutes,0) as pending_minutes,
    coalesce(logged.completed,0)::integer as completed
   from public.program_enrollments e
   left join lateral (
    select t.* from public.apprenticeship_theory_schedules t where t.user_id=e.user_id and t.program_slug=e.program_slug
     and t.active and t.learner_confirmed_at is not null and t.starts_on<=p_period_end
    order by t.updated_at desc limit 1
   ) s on true
   left join lateral (
    select count(*) as expected from pg_catalog.generate_series(greatest(p_period_start,s.starts_on)::timestamp,p_period_end::timestamp,interval '1 day') day
    where extract(isodow from day)::integer=any(s.days_of_week)
   ) sessions on s.id is not null
   left join lateral (
    select sum(case when r.status in ('verified','approved') then greatest(coalesce(r.minutes_verified,0),0) else 0 end) as verified_minutes,
     sum(case when r.status in ('submitted','pending') then greatest(coalesce(r.minutes_claimed,0),0) else 0 end) as pending_minutes,
     count(distinct r.instruction_date) filter(where r.status in ('verified','approved') and r.minutes_verified>0) as completed
    from public.apprenticeship_rti_entries r where r.enrollment_id=e.id and r.instruction_date between p_period_start and p_period_end
   ) logged on true
   where e.status in ('active','enrolled','in_progress') and e.user_id is not null
 loop
   total_enrollments:=total_enrollments+1;
   if item.schedule_id is null or item.required_minutes<=0 then outcome:='NO_SCHEDULE';
   elsif p_period_end>(now() at time zone item.timezone)::date or
     (p_period_end=(now() at time zone item.timezone)::date and (now() at time zone item.timezone)::time<item.end_time) then outcome:='PENDING_PERIOD';
   elsif item.verified_minutes>=item.required_minutes then outcome:='ON_TRACK';on_track:=on_track+1;
   elsif item.pending_minutes>0 then outcome:='PENDING_VERIFICATION';
   elsif item.verified_minutes=0 then outcome:='NO_ACTIVITY';no_activity:=no_activity+1;
   else outcome:='BEHIND';behind:=behind+1;
   end if;
   insert into public.reporting_verdicts(enrollment_id,student_id,period_start,period_end,status,required_hours,logged_hours,required_sessions,completed_sessions,name,period,data,updated_at)
   values(item.id,item.user_id,p_period_start,p_period_end,outcome,item.required_minutes/60,item.verified_minutes/60,
    item.expected_sessions,item.completed,'Confirmed theory schedule review',p_period_start::text||'/'||p_period_end::text,
    jsonb_build_object('hours_kind','verified_related_instruction','pending_minutes',item.pending_minutes,'schedule_id',item.schedule_id),now())
   on conflict(enrollment_id,period_start,period_end) do update set status=excluded.status,required_hours=excluded.required_hours,
    logged_hours=excluded.logged_hours,required_sessions=excluded.required_sessions,completed_sessions=excluded.completed_sessions,data=excluded.data,updated_at=now()
   returning id into report_id;
   verdicts_created:=verdicts_created+1;
   key:='theory-report:'||item.id::text||':'||p_period_start::text||':'||p_period_end::text;
   if outcome in ('BEHIND','NO_ACTIVITY') then
    note:='Your verified theory hours for '||p_period_start::text||' through '||p_period_end::text||' are '||round(item.verified_minutes/60,2)::text||' of '||round(item.required_minutes/60,2)::text||' scheduled hours. Review your progress or contact your instructor.';
    insert into public.notifications(user_id,type,title,message,action_url,idempotency_key,metadata)
      select item.user_id,'warning','Theory progress review',note,'https://lms.elevateforhumanity.org/lms/dashboard',key,
       jsonb_build_object('kind','theory_progress','verdict_id',report_id,'enrollment_id',item.id,'period_start',p_period_start,'period_end',p_period_end)
      where not exists(select 1 from public.notifications n where n.idempotency_key=key);
   else
    update public.notifications set read=true where idempotency_key=key and not read;
   end if;
 end loop;
 return next;
end $$;

create or replace function public.run_daily_attendance_alerts(p_date date)
returns table(processed_count integer,alert_count integer,critical_count integer)
language sql security invoker set search_path='' as $$
 select total_enrollments,behind+no_activity,0 from public.generate_reporting_verdicts(p_date,p_date);
$$;
revoke all on function public.generate_reporting_verdicts(date,date),public.run_daily_attendance_alerts(date) from public,anon,authenticated;
grant execute on function public.generate_reporting_verdicts(date,date),public.run_daily_attendance_alerts(date) to service_role;

-- Two UTC candidates plus the local-hour condition keep these Indiana jobs
-- correct across daylight saving transitions. They only create dashboard
-- notices; they do not email, text, debit or change a learner's hours.
do $schedule$
begin
 if to_regnamespace('cron') is not null then
  perform cron.schedule('confirmed-theory-daily-report','0 10,11 * * *', $job$
   do $run$ begin
    if extract(hour from now() at time zone 'America/Indiana/Indianapolis')=6 then
     perform set_config('request.jwt.claims','{"role":"service_role"}',true);
     perform public.run_daily_attendance_alerts((now() at time zone 'America/Indiana/Indianapolis')::date-1);
    end if;
   end $run$;
  $job$);
  perform cron.schedule('confirmed-theory-weekly-report','0 12,13 * * 1', $job$
   do $run$ declare today date:=(now() at time zone 'America/Indiana/Indianapolis')::date; begin
    if extract(hour from now() at time zone 'America/Indiana/Indianapolis')=8 then
     perform set_config('request.jwt.claims','{"role":"service_role"}',true);
     perform public.generate_reporting_verdicts(today-7,today-1);
    end if;
   end $run$;
  $job$);
 end if;
end $schedule$;
