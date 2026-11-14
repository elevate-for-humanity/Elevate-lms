alter table public.social_media_settings
  add column if not exists access_token_secret_id uuid,
  add column if not exists refresh_token_secret_id uuid;

create or replace function public.store_social_credentials(
  p_platform text, p_access_token text, p_refresh_token text,
  p_expires_at timestamptz, p_organization_id text, p_organizations jsonb,
  p_profile_data jsonb, p_updated_by uuid, p_enabled boolean,
  p_granted_scopes text[], p_connection_status text, p_last_verified_at timestamptz,
  p_dry_run boolean
) returns void
language plpgsql security definer set search_path = ''
as $$
declare access_id uuid; refresh_id uuid;
begin
  if coalesce(btrim(p_platform), '') = '' or coalesce(btrim(p_access_token), '') = '' then
    raise exception 'platform and access token are required';
  end if;
  select access_token_secret_id, refresh_token_secret_id into access_id, refresh_id
  from public.social_media_settings where platform = p_platform for update;
  if access_id is null then
    access_id := vault.create_secret(p_access_token, 'social_' || p_platform || '_access_' || gen_random_uuid()::text,
      'OAuth access token for Elevate-owned ' || p_platform, null);
  else
    perform vault.update_secret(access_id, p_access_token, null, null, null);
  end if;
  if nullif(btrim(coalesce(p_refresh_token, '')), '') is not null then
    if refresh_id is null then
      refresh_id := vault.create_secret(p_refresh_token, 'social_' || p_platform || '_refresh_' || gen_random_uuid()::text,
        'OAuth refresh token for Elevate-owned ' || p_platform, null);
    else
      perform vault.update_secret(refresh_id, p_refresh_token, null, null, null);
    end if;
  end if;
  insert into public.social_media_settings (
    platform, access_token, refresh_token, access_token_secret_id, refresh_token_secret_id,
    expires_at, organization_id, organizations, profile_data, updated_by, updated_at,
    enabled, granted_scopes, connection_status, last_verified_at, dry_run
  ) values (
    p_platform, null, null, access_id, refresh_id, p_expires_at, p_organization_id,
    coalesce(p_organizations, '[]'::jsonb), coalesce(p_profile_data, '{}'::jsonb),
    p_updated_by, now(), p_enabled, coalesce(p_granted_scopes, '{}'::text[]),
    p_connection_status, p_last_verified_at, p_dry_run
  ) on conflict (platform) do update set
    access_token = null, refresh_token = null,
    access_token_secret_id = excluded.access_token_secret_id,
    refresh_token_secret_id = excluded.refresh_token_secret_id,
    expires_at = excluded.expires_at, organization_id = excluded.organization_id,
    organizations = excluded.organizations, profile_data = excluded.profile_data,
    updated_by = excluded.updated_by, updated_at = now(), enabled = excluded.enabled,
    granted_scopes = excluded.granted_scopes, connection_status = excluded.connection_status,
    last_verified_at = excluded.last_verified_at, dry_run = excluded.dry_run;
end $$;

create or replace function public.resolve_social_credentials(p_platform text)
returns table (access_token text, refresh_token text, expires_at timestamptz,
  organization_id text, profile_data jsonb, dry_run boolean, connection_status text)
language sql security definer set search_path = '' stable
as $$
  select access_secret.decrypted_secret, refresh_secret.decrypted_secret,
    settings.expires_at, settings.organization_id, settings.profile_data,
    settings.dry_run, settings.connection_status
  from public.social_media_settings settings
  left join vault.decrypted_secrets access_secret on access_secret.id = settings.access_token_secret_id
  left join vault.decrypted_secrets refresh_secret on refresh_secret.id = settings.refresh_token_secret_id
  where settings.platform = p_platform and settings.enabled = true;
$$;

revoke all on function public.store_social_credentials(text,text,text,timestamptz,text,jsonb,jsonb,uuid,boolean,text[],text,timestamptz,boolean) from public, anon, authenticated;
revoke all on function public.resolve_social_credentials(text) from public, anon, authenticated;
grant execute on function public.store_social_credentials(text,text,text,timestamptz,text,jsonb,jsonb,uuid,boolean,text[],text,timestamptz,boolean) to service_role;
grant execute on function public.resolve_social_credentials(text) to service_role;

comment on function public.resolve_social_credentials(text) is 'Service-role-only decryption boundary for social provider adapters.';
