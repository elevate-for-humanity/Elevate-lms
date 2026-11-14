create or replace function public.emit_recorded_student_alerts() returns void language plpgsql security definer set search_path='' as $$
begin
 -- Authentication timestamps are recorded by Supabase; merely closing a tab is not a logout.
 insert into public.notifications(user_id,type,title,message,action_url,idempotency_key,metadata)
 select pref.user_id,'announcement','Student sign-in recorded','A student sign-in was recorded. Review activity in the secure student dashboard.','/students',
 'pwa-signin:'||u.id||':'||u.last_sign_in_at::text||':'||pref.user_id,jsonb_build_object('alert_kind','sign_in')
 from public.pwa_alert_preferences pref join public.profiles owner on owner.id=pref.user_id and owner.role in ('admin','super_admin')
 cross join auth.users u join public.profiles student on student.id=u.id and student.role in ('student','learner','apprentice')
 where pref.enabled and pref.student_sign_in and u.last_sign_in_at>now()-interval '15 minutes'
 on conflict(idempotency_key) do nothing;
 insert into public.notifications(user_id,type,title,message,action_url,idempotency_key,metadata)
 select pref.user_id,'announcement','Student sign-out recorded','An explicit student sign-out action was recorded. This does not infer that every device session ended.','/students',
 'pwa-signout:'||a.id||':'||pref.user_id,jsonb_build_object('alert_kind','sign_out')
 from public.pwa_alert_preferences pref join public.profiles owner on owner.id=pref.user_id and owner.role in ('admin','super_admin')
 cross join public.user_activity a join public.profiles student on student.id=a.user_id and student.role in ('student','learner','apprentice')
 where pref.enabled and pref.student_sign_out and a.activity_type='sign_out' and a.created_at>now()-interval '15 minutes'
 on conflict(idempotency_key) do nothing;
 insert into public.notifications(user_id,type,title,message,action_url,idempotency_key,metadata)
 select pref.user_id,'reminder','Student activity check needed','A learner meets your saved inactivity threshold. Review the secure at-risk learner dashboard.','/at-risk',
 'pwa-inactive:'||risk.user_id||':'||(now() at time zone 'UTC')::date||':'||pref.user_id,jsonb_build_object('alert_kind','inactive')
 from public.pwa_alert_preferences pref join public.profiles owner on owner.id=pref.user_id and owner.role in ('admin','super_admin')
 cross join public.at_risk_learners risk where pref.enabled and pref.student_inactive and risk.days_inactive>=pref.inactive_days
 on conflict(idempotency_key) do nothing;
end $$;
