set local lock_timeout='3s'; set local statement_timeout='10s';
create or replace function public.queue_weekly_theory_due_reminders(p_now timestamptz default now())
returns integer language plpgsql security invoker set search_path='' as $$
declare s record; local_now timestamp; week_end date; used integer; notification_id uuid; queued integer:=0; key text;
begin
 for s in select ts.*,p.email,p.full_name from public.apprenticeship_theory_schedules ts join public.profiles p on p.id=ts.user_id
 where ts.active and p.is_active is not false and ts.learner_confirmed_at is not null
 and exists(select 1 from public.apprentices a join public.program_enrollments e on e.id=a.enrollment_id where a.user_id=ts.user_id and a.status='active' and e.course_id=ts.course_id and e.status in('active','enrolled','in_progress','confirmed') and e.revoked_at is null)
 loop
  local_now:=p_now at time zone s.timezone;
  if local_now::date<s.starts_on or extract(isodow from local_now)<>7 or local_now::time<time '18:00' or local_now::time>=time '18:05' then continue; end if;
  week_end:=local_now::date;
  select coalesce(sum(active_seconds),0)::integer into used from public.theory_activity_sessions where user_id=s.user_id and week_ending=week_end;
  if used>=s.weekly_target_minutes*60 then continue; end if;
  key:='theory:weekly_due:'||s.id||':'||week_end;
  notification_id:=null;
  insert into public.notifications(user_id,type,title,message,action_url,action_label,metadata,idempotency_key)
  values(s.user_id,'reminder','Finish this week''s assigned theory',
   'Your assigned theory is due tonight by 11:59 PM ('||s.timezone||'). Your weekly target is '||round(s.weekly_target_minutes/60.0,2)||' hours; '||round(used/3600.0,2)||' active hours are recorded. Work only in your saved study windows, keep theory separate from OJL, and save required activities. Recorded activity remains subject to RTI review.',
   '/apprentice/theory-schedule','Review my theory plan',jsonb_build_object('schedule_id',s.id,'event','weekly_due','week_ending',week_end),key)
  on conflict(idempotency_key) do nothing returning id into notification_id;
  if notification_id is not null then
   insert into public.notification_outbox(to_email,channel,template_key,template_data,status,entity_type,entity_id,type,recipient_id,recipient_email,metadata)
   values(s.email,'email','theory_schedule_due',jsonb_build_object('name',coalesce(s.full_name,'Apprentice'),'weekly_target_hours',round(s.weekly_target_minutes/60.0,2),'weekly_max_hours',least(s.weekly_max_minutes,600)/60.0,'recorded_hours',round(used/3600.0,2),'timezone',s.timezone,'dashboard_url','https://app.elevateforhumanity.org/apprentice/theory-schedule'),
   'queued','apprenticeship_theory_schedule',s.id,'theory_schedule_due',s.user_id,s.email,jsonb_build_object('idempotency_key',key));
   queued:=queued+1;
  end if;
 end loop;
 return queued;
end $$;
revoke all on function public.queue_weekly_theory_due_reminders(timestamptz) from public,anon,authenticated;
grant execute on function public.queue_weekly_theory_due_reminders(timestamptz) to service_role;
-- Extend the existing reminder job instead of creating a duplicate schedule.
select cron.schedule('apprenticeship-theory-reminders','*/5 * * * *',
 'select public.queue_due_theory_schedule_notifications(); select public.queue_weekly_theory_due_reminders();');

