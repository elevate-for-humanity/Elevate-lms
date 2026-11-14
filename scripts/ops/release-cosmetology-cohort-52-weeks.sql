-- Authorized 2026-10-28: begin newly available instruction now, finish within
-- each active apprentice's original 52-week period. Never grant completion/hours.
begin;
set local statement_timeout='8s';
set local lock_timeout='3s';
do $$ begin
 if (select count(*) from public.course_lessons where course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec' and is_published and media_quality_status='approved')<>40 then raise exception '40_APPROVED_NATIVE_LESSONS_REQUIRED'; end if;
end $$;
with cohort as (
 select distinct a.user_id,
 greatest(1,least(52,1+floor(extract(epoch from ((date '2026-10-28'::timestamp at time zone 'America/Indiana/Indianapolis')-rpc_private.course_pacing_start(a.user_id,c.id)))/604800)::int)) as current_week
 from public.apprentices a join public.courses c on c.id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec'
 join public.program_enrollments e on e.id=a.enrollment_id
 where a.program_id=c.program_id and a.status='active' and e.status in('active','enrolled','in_progress','confirmed')
 and e.revoked_at is null and rpc_private.course_pacing_start(a.user_id,c.id) is not null
), ordered as (
 select l.id,l.course_id,row_number() over(order by l.order_index,l.id)-1 as position,count(*) over() as total
 from public.course_lessons l where l.course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec'
)
insert into public.course_learner_release_weeks(user_id,course_id,lesson_id,release_week,total_weeks,reason)
select c.user_id,l.course_id,l.id,
 case when exists(select 1 from public.lesson_progress p where p.user_id=c.user_id and p.lesson_id=l.id and p.completed)
 then least(coalesce(old.release_week,c.current_week),c.current_week)
 else c.current_week+floor(l.position*(52-c.current_week)::numeric/greatest(l.total-1,1))::int end,
 52,
 'Course first available 2026-10-28; distribute remaining lessons through original training week 52; no retrospective missed-work penalty or credit. Prior week='||coalesce(old.release_week::text,'default')||', prior total='||coalesce(old.total_weeks::text,'default')||'; '||coalesce(old.reason,'')
from cohort c cross join ordered l
left join public.course_learner_release_weeks old on old.user_id=c.user_id and old.course_id=l.course_id and old.lesson_id=l.id
where old.reason is null or old.reason not like 'Course first available 2026-10-28;%'
on conflict(user_id,course_id,lesson_id) do update set release_week=excluded.release_week,total_weeks=52,reason=excluded.reason;
-- Keep the visible maximum consistent with the existing 10-hour server limit.
update public.apprenticeship_theory_schedules set weekly_max_minutes=least(weekly_max_minutes,600),updated_at=now()
where course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec' and active and weekly_max_minutes>600;
-- Recipient set: active apprentices with an active enrollment in this exact program.
insert into public.notifications(user_id,type,title,message,action_url,action_label,metadata,idempotency_key)
select a.user_id,'reminder','Your online cosmetology training is available',
 'Your 40-lesson online training is ready. Begin with your next available lesson. Your plan runs through your original training week 52; you are not marked behind for lessons that were unavailable. Follow your weekly schedule and finish required activities before marking each lesson complete.',
 '/lms/courses/a6b0b712-1cf0-475a-ba79-ee2023dea8ec','Open online training',
 jsonb_build_object('course_id','a6b0b712-1cf0-475a-ba79-ee2023dea8ec','release_date','2026-10-28'),
 'cosmetology-online-ready:2026-10-28:'||a.user_id
from public.apprentices a join public.program_enrollments e on e.id=a.enrollment_id
where a.status='active' and a.program_id='0661bc6d-c748-4655-b11b-6d418a4ace4a' and e.status in('active','enrolled','in_progress','confirmed') and e.revoked_at is null
on conflict(idempotency_key) do nothing;
insert into public.notifications(user_id,type,title,message,action_url,action_label,metadata,idempotency_key)
select a.user_id,'reminder','Your cosmetology workbook is available',
 'Open your assigned digital workbook from your dashboard. It contains 40 sections. Read the current assigned section, type and save your answers, and return to continue. Saving workbook answers does not automatically complete a lesson or approve training hours.',
 '/workbooks/prestige-elevation-cosmetology','Open digital workbook',
 jsonb_build_object('workbook_slug','prestige-elevation-cosmetology'),
 'cosmetology-workbook-ready:2026-10-28:'||a.user_id
from public.apprentices a join public.program_enrollments e on e.id=a.enrollment_id
where a.status='active' and a.program_id='0661bc6d-c748-4655-b11b-6d418a4ace4a' and e.status in('active','enrolled','in_progress','confirmed') and e.revoked_at is null
and exists(select 1 from public.digital_workbooks w where w.slug='prestige-elevation-cosmetology' and w.program_id=a.program_id and w.is_active and (select count(*) from public.digital_workbook_sections s where s.workbook_id=w.id)=40)
on conflict(idempotency_key) do nothing;
commit;
