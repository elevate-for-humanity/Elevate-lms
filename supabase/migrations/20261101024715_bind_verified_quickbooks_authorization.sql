-- A verified recovery must bind rotating tokens to their issuing application,
-- update the canonical Vault credentials atomically and preserve newer consent.
create or replace function public.save_verified_quickbooks_authorization(
 p_expected_refresh_token text, p_client_id text, p_client_secret text,
 p_realm_id text, p_tokens jsonb
) returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_refresh text; v_realm text; v_expires numeric;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Service role required' using errcode='42501'; end if;
 if coalesce(p_client_id,'')='' or coalesce(p_client_secret,'')='' or p_realm_id !~ '^\d+$'
   or coalesce(p_tokens->>'access_token','')='' or coalesce(p_tokens->>'refresh_token','')='' then
   raise exception 'Complete verified authorization required';
 end if;
 v_expires := (p_tokens->>'expires_in')::numeric;
 if v_expires is null or v_expires <= 0 or v_expires > 86400 then raise exception 'Invalid authorization expiry'; end if;
 perform pg_advisory_xact_lock(hashtextextended('elevate:quickbooks:authorization',0));
 select value into v_refresh from public.app_settings where key='QB_REFRESH_TOKEN' for update;
 select value into v_realm from public.app_settings where key='QB_REALM_ID' for update;
 if v_refresh is distinct from p_expected_refresh_token or v_realm is distinct from p_realm_id then return false; end if;
 perform public.set_platform_secret('QB_CLIENT_ID',p_client_id,null,'integrations');
 perform public.set_platform_secret('QB_CLIENT_SECRET',p_client_secret,null,'integrations');
 perform public.set_platform_secret('QB_ENVIRONMENT','production',null,'integrations');
 insert into public.app_settings(key,value,updated_at) values
  ('QB_CLIENT_ID',p_client_id,now()),('QB_CLIENT_SECRET',p_client_secret,now()),
  ('QB_ACCESS_TOKEN',p_tokens->>'access_token',now()),('QB_REFRESH_TOKEN',p_tokens->>'refresh_token',now()),
  ('QB_REALM_ID',p_realm_id,now()),('QB_TOKEN_EXPIRES',(now()+make_interval(secs=>v_expires::double precision))::text,now())
 on conflict(key) do update set value=excluded.value,updated_at=excluded.updated_at;
 return true;
end $$;
revoke all on function public.save_verified_quickbooks_authorization(text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_verified_quickbooks_authorization(text,text,text,text,jsonb) to service_role;
