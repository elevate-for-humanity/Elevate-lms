set local statement_timeout='8s'; set local lock_timeout='3s';
-- Historical incomplete records remain unresolved; they do not represent a live
-- overlapping shift forever. Retain current-day, recent and freshly seen shifts.
create or replace function rpc_private.has_active_ojl_session(p_user uuid,p_now timestamptz default now())
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'service_role' and auth.uid() is distinct from p_user then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
 return exists(select 1 from public.apprentices a join public.progress_entries pe on pe.apprentice_id=a.id
  where a.user_id=p_user and pe.clock_in_at is not null and pe.clock_out_at is null
  and (pe.work_date>=(p_now at time zone 'America/Indiana/Indianapolis')::date
   or pe.clock_in_at>=p_now-interval '24 hours' or pe.last_seen_at>=p_now-interval '15 minutes'));
end $$;
revoke all on function rpc_private.has_active_ojl_session(uuid,timestamptz) from public,anon,authenticated;
grant execute on function rpc_private.has_active_ojl_session(uuid,timestamptz) to service_role;
create or replace function public.has_active_ojl_session(p_user uuid)
returns boolean language sql stable security invoker set search_path='' as $$ select rpc_private.has_active_ojl_session(p_user,now()); $$;
revoke all on function public.has_active_ojl_session(uuid) from public,anon,authenticated;
grant execute on function public.has_active_ojl_session(uuid) to service_role;
do $patch$
declare source text; start_at integer; end_at integer; previous text;
begin
 select pg_get_functiondef('rpc_private.theory_access_status(uuid,uuid,timestamptz)'::regprocedure) into source;
 previous:='exists(select 1 from public.apprentices a join public.progress_entries pe on pe.apprentice_id=a.id where a.user_id=p_user and pe.clock_in_at is not null and pe.clock_out_at is null)';
 if position(previous in source)>0 then execute replace(source,previous,'rpc_private.has_active_ojl_session(p_user,p_now)');
 elsif position('has_active_ojl_session' in source)=0 then raise exception 'THEORY_WINDOW_OJL_TARGET_MISSING'; end if;
 select pg_get_functiondef('public.record_theory_activity_heartbeat(uuid,uuid)'::regprocedure) into source;
 if position('has_active_ojl_session' in source)=0 then
  start_at:=position('select exists(' in source);
  end_at:=position(') into v_has_open_ojl;' in source)+length(') into v_has_open_ojl;');
  if start_at<1 or end_at<=start_at then raise exception 'HEARTBEAT_OJL_TARGET_MISSING'; end if;
  previous:=substring(source from start_at for end_at-start_at);
  if position('public.progress_entries' in previous)=0 then raise exception 'HEARTBEAT_OJL_SCOPE_MISMATCH'; end if;
  execute overlay(source placing 'select rpc_private.has_active_ojl_session(p_user_id,now()) into v_has_open_ojl;' from start_at for end_at-start_at);
 end if;
end $patch$;

