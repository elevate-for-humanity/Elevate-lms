-- Per-account Google Calendar credentials live in Vault, never browser-readable rows.
create table if not exists public.google_calendar_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  secret_id uuid not null references vault.secrets(id),
  updated_at timestamptz not null default now()
);
alter table public.google_calendar_connections enable row level security;
revoke all on public.google_calendar_connections from public, anon, authenticated;
grant select, insert, update, delete on public.google_calendar_connections to service_role;

create or replace function public.store_google_calendar_connection(p_user_id uuid, p_tokens jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare secret uuid;
begin
  if p_user_id is null or nullif(p_tokens->>'refresh_token','') is null or nullif(p_tokens->>'access_token','') is null then
    raise exception 'Account and complete OAuth credentials are required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('google_calendar_' || p_user_id::text, 0));
  select secret_id into secret from public.google_calendar_connections where user_id=p_user_id for update;
  if secret is null then
    secret := vault.create_secret(p_tokens::text, 'calendar_' || gen_random_uuid()::text, 'Per-account Google Calendar OAuth credentials', null);
    insert into public.google_calendar_connections(user_id,secret_id) values(p_user_id,secret);
  else
    perform vault.update_secret(secret,p_tokens::text,null,null,null);
    update public.google_calendar_connections set updated_at=now() where user_id=p_user_id;
  end if;
end $$;

create or replace function public.resolve_google_calendar_connection(p_user_id uuid)
returns jsonb language sql security definer set search_path = '' stable as $$
  select v.decrypted_secret::jsonb from public.google_calendar_connections c
  join vault.decrypted_secrets v on v.id=c.secret_id where c.user_id=p_user_id;
$$;

create or replace function public.cleanup_google_calendar_connection()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from vault.secrets where id=old.secret_id;
  return old;
end $$;
drop trigger if exists cleanup_google_calendar_connection on public.google_calendar_connections;
create trigger cleanup_google_calendar_connection after delete on public.google_calendar_connections
for each row execute function public.cleanup_google_calendar_connection();

revoke all on function public.store_google_calendar_connection(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.resolve_google_calendar_connection(uuid) from public,anon,authenticated;
revoke all on function public.cleanup_google_calendar_connection() from public,anon,authenticated;
grant execute on function public.store_google_calendar_connection(uuid,jsonb) to service_role;
grant execute on function public.resolve_google_calendar_connection(uuid) to service_role;
