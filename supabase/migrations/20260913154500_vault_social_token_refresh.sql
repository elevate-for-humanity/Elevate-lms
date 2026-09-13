create or replace function public.refresh_social_credentials(
  p_platform text, p_access_token text, p_refresh_token text, p_expires_at timestamptz
) returns void
language plpgsql security definer set search_path = ''
as $$
declare access_id uuid; refresh_id uuid;
begin
  select access_token_secret_id, refresh_token_secret_id into access_id, refresh_id
  from public.social_media_settings where platform = p_platform and enabled = true for update;
  if access_id is null or coalesce(btrim(p_access_token), '') = '' then
    raise exception 'connected Vault credential is required';
  end if;
  perform vault.update_secret(access_id, p_access_token, null, null, null);
  if nullif(btrim(coalesce(p_refresh_token, '')), '') is not null then
    if refresh_id is null then
      refresh_id := vault.create_secret(p_refresh_token,
        'social_' || p_platform || '_refresh_' || gen_random_uuid()::text,
        'OAuth refresh token for Elevate-owned ' || p_platform, null);
    else
      perform vault.update_secret(refresh_id, p_refresh_token, null, null, null);
    end if;
  end if;
  update public.social_media_settings set
    access_token = null, refresh_token = null,
    refresh_token_secret_id = refresh_id, expires_at = p_expires_at,
    refresh_status = 'refreshed', updated_at = now()
  where platform = p_platform;
end $$;

revoke all on function public.refresh_social_credentials(text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.refresh_social_credentials(text,text,text,timestamptz) to service_role;
