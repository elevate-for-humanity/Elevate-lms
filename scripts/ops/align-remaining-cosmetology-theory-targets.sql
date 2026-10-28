begin; set local statement_timeout='5s'; set local lock_timeout='2s';
with plans as(
 select a.user_id,p.min_rti_hours,52-greatest(1,least(52,1+floor(extract(epoch from((date '2026-10-28'::timestamp at time zone 'America/Indiana/Indianapolis')-rpc_private.course_pacing_start(a.user_id,c.id)))/604800)::int))+1 as remaining_weeks,
 coalesce((select sum(r.minutes_verified) from public.apprenticeship_rti_entries r where r.user_id=a.user_id and r.status in('verified','approved')),0) as verified_minutes
 from public.apprentices a join public.programs p on p.id=a.program_id join public.courses c on c.program_id=p.id and c.id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec'
 where a.status='active' and a.program_id='0661bc6d-c748-4655-b11b-6d418a4ace4a' and p.min_rti_hours=154
) update public.apprenticeship_theory_schedules s
 set weekly_target_minutes=greatest(30,least(600,ceil(greatest(plans.min_rti_hours*60-plans.verified_minutes,0)::numeric/plans.remaining_weeks/15)*15))::int,updated_at=now()
 from plans where s.user_id=plans.user_id and s.course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec' and s.active;
commit;
