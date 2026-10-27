alter table public.pwa_alert_preferences add column if not exists enabled_at timestamptz;
create or replace function public.stamp_pwa_alert_opt_in() returns trigger language plpgsql set search_path='' as $$
begin
 if new.enabled and (tg_op='INSERT' or not old.enabled) then new.enabled_at=now(); else new.enabled_at=old.enabled_at; end if;
 return new;
end $$;
create trigger stamp_pwa_alert_opt_in before insert or update on public.pwa_alert_preferences for each row execute function public.stamp_pwa_alert_opt_in();
create index if not exists pwa_alert_deliveries_queued on public.pwa_alert_deliveries(status) where status in ('queued','processing');
create or replace function public.emit_recorded_student_alerts() returns void language plpgsql security definer set search_path='' as $$
begin
 -- Authentication timestamps are recorded by Supabase; merely closing a tab is not a logout.
 insert into public.notifications(user_id,type,title,message,action_url,idempotency_key,metadata)
 select pref.user_id,'announcement','Student sign-in recorded','A student sign-in was recorded. Review activity in the secure student dashboard.','/students',
 'pwa-signin:'||u.id||':'||u.last_sign_in_at::text||':'||pref.user_id,jsonb_build_object('alert_kind','sign_in')
 from public.pwa_alert_preferences pref join public.profiles owner on owner.id=pref.user_id and owner.role in ('admin','super_admin')
 cross join auth.users u join public.profiles student on student.id=u.id and student.role in ('student','learner','apprentice')
 where coalesce(u.email,'') not like '%@qa.invalid' and pref.enabled and pref.student_sign_in and u.last_sign_in_at>now()-interval '15 minutes'
 on conflict(idempotency_key) do nothing;
 insert into public.notifications(user_id,type,title,message,action_url,idempotency_key,metadata)
 select pref.user_id,'announcement','Student sign-out recorded','An explicit student sign-out action was recorded. This does not infer that every device session ended.','/students',
 'pwa-signout:'||a.id||':'||pref.user_id,jsonb_build_object('alert_kind','sign_out')
 from public.pwa_alert_preferences pref join public.profiles owner on owner.id=pref.user_id and owner.role in ('admin','super_admin')
 cross join public.user_activity a join public.profiles student on student.id=a.user_id and student.role in ('student','learner','apprentice')
 where coalesce(student.email,'') not like '%@qa.invalid' and pref.enabled and pref.student_sign_out and a.activity_type='sign_out' and a.created_at>now()-interval '15 minutes'
 on conflict(idempotency_key) do nothing;
 insert into public.notifications(user_id,type,title,message,action_url,idempotency_key,metadata)
 select pref.user_id,'reminder','Student activity check needed','A learner meets your saved inactivity threshold. Review the secure at-risk learner dashboard.','/at-risk',
 'pwa-inactive:'||risk.user_id||':'||(now() at time zone 'UTC')::date||':'||pref.user_id,jsonb_build_object('alert_kind','inactive')
 from public.pwa_alert_preferences pref join public.profiles owner on owner.id=pref.user_id and owner.role in ('admin','super_admin')
 cross join public.at_risk_learners risk where coalesce(risk.email,'') not like '%@qa.invalid' and pref.enabled and pref.student_inactive and risk.days_inactive>=pref.inactive_days
 on conflict(idempotency_key) do nothing;
end $$;
create or replace function public.claim_pwa_alert_deliveries(batch_size integer default 2)
returns table(notification_id uuid,user_id uuid,kind text) language plpgsql security definer set search_path='' as $$
begin
 update public.pwa_alert_deliveries set status='review_required',finished_at=now() where status='processing' and claimed_at<now()-interval '10 minutes';
 insert into public.pwa_alert_deliveries(notification_id)
 select n.id from public.notifications n join public.pwa_alert_preferences p on p.user_id=n.user_id
 join public.profiles profile on profile.id=n.user_id
 where p.enabled and n.created_at>greatest(now()-interval '1 day',coalesce(p.enabled_at,p.updated_at)) and not n.read and (
 (p.email_alerts and n.idempotency_key like 'email:%') or
 (profile.role in ('admin','super_admin') and ((p.student_sign_in and n.metadata->>'alert_kind'='sign_in') or (profile.role in ('admin','super_admin') and p.student_sign_out and n.metadata->>'alert_kind'='sign_out') or (profile.role in ('admin','super_admin') and p.student_inactive and n.metadata->>'alert_kind'='inactive'))))
 on conflict do nothing;
 return query with candidates as (
 select d.notification_id from public.pwa_alert_deliveries d join public.notifications n on n.id=d.notification_id
 join public.pwa_alert_preferences p on p.user_id=n.user_id
 join public.profiles profile on profile.id=n.user_id
 where d.status='queued' and p.enabled and not n.read and n.created_at>now()-interval '1 day'
 and ((p.email_alerts and n.idempotency_key like 'email:%') or (profile.role in ('admin','super_admin') and p.student_sign_in and n.metadata->>'alert_kind'='sign_in') or (profile.role in ('admin','super_admin') and p.student_sign_out and n.metadata->>'alert_kind'='sign_out') or (profile.role in ('admin','super_admin') and p.student_inactive and n.metadata->>'alert_kind'='inactive'))
 order by n.created_at for update of d skip locked limit least(greatest(batch_size,1),4)
 ), claimed as (update public.pwa_alert_deliveries d set status='processing',claimed_at=now() from candidates c where d.notification_id=c.notification_id returning d.notification_id)
 select n.id,n.user_id,case when n.idempotency_key like 'email:%' then 'email' else n.metadata->>'alert_kind' end
 from claimed c join public.notifications n on n.id=c.notification_id;
end $$;
revoke all on function public.emit_recorded_student_alerts(),public.claim_pwa_alert_deliveries(integer) from public,anon,authenticated;
grant execute on function public.emit_recorded_student_alerts(),public.claim_pwa_alert_deliveries(integer) to service_role;
