create or replace function public.configure_quickbooks_oauth_application(
 p_client_id text, p_client_secret text, p_redirect_uri text
) returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare changed boolean;
begin
 if current_user not in ('service_role','postgres') then raise exception 'Service role required' using errcode='42501'; end if;
 if coalesce(p_client_id,'') !~ '^[A-Za-z0-9]{20,128}$' or coalesce(p_client_secret,'') !~ '^[A-Za-z0-9]+$' or length(coalesce(p_client_secret,'')) not between 20 and 256
 or p_redirect_uri is distinct from 'https://www.elevateforhumanity.org/api/auth/quickbooks/callback' then
  raise exception 'INVALID_PRODUCTION_APPLICATION';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('elevate:quickbooks:authorization',0));
 perform pg_advisory_xact_lock(hashtext('quickbooks-token-rotation'));
 perform 1 from public.app_settings where key in ('QB_CLIENT_ID','QB_CLIENT_SECRET','QB_REFRESH_TOKEN') order by key for update;
 changed := public.get_platform_secret('QB_CLIENT_ID') is distinct from p_client_id
   or public.get_platform_secret('QB_CLIENT_SECRET') is distinct from p_client_secret
   or (select value from public.app_settings where key='QB_CLIENT_ID') is distinct from p_client_id
   or (select value from public.app_settings where key='QB_CLIENT_SECRET') is distinct from p_client_secret;
 perform public.set_platform_secret('QB_CLIENT_ID',p_client_id,null,'integrations');
 perform public.set_platform_secret('QB_CLIENT_SECRET',p_client_secret,null,'integrations');
 perform public.set_platform_secret('QB_REDIRECT_URI',p_redirect_uri,null,'integrations');
 perform public.set_platform_secret('QB_ENVIRONMENT','production',null,'integrations');
 insert into public.app_settings(key,value,updated_at) values
 ('QB_CLIENT_ID',p_client_id,now()),('QB_CLIENT_SECRET',p_client_secret,now()),
 ('QB_REDIRECT_URI',p_redirect_uri,now()),('QB_ENVIRONMENT','production',now())
 on conflict(key) do update set value=excluded.value,updated_at=excluded.updated_at;
 -- Tokens issued to the previous OAuth application cannot authorize this one.
 -- Reapplying an unchanged pair preserves fresh consent.
 if changed then delete from public.app_settings where key in ('QB_ACCESS_TOKEN','QB_REFRESH_TOKEN','QB_TOKEN_EXPIRES'); end if;
 return changed;
end $$;
revoke all on function public.configure_quickbooks_oauth_application(text,text,text) from public,anon,authenticated;
grant execute on function public.configure_quickbooks_oauth_application(text,text,text) to service_role;
