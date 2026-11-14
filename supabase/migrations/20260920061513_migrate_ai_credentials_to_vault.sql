begin;

alter table public.platform_secrets
  add column if not exists vault_secret_id uuid;

create or replace function public.set_platform_secret(
  p_key text,
  p_value text,
  p_description text default null,
  p_category text default 'general'
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_id uuid;
  v_name text := 'elevate.platform_secret.' || p_key;
begin
  if p_key is null or p_key !~ '^[A-Z][A-Z0-9_]{1,127}$' then
    raise exception 'Invalid platform secret key';
  end if;
  if p_value is null or btrim(p_value) = '' then
    raise exception 'Platform secret value cannot be empty';
  end if;

  select vault_secret_id into v_id
  from public.platform_secrets
  where key = p_key
  for update;

  if v_id is null then
    select id into v_id from vault.secrets where name = v_name;
  end if;

  if v_id is null then
    v_id := vault.create_secret(p_value, v_name, coalesce(p_description, p_key), null);
  else
    perform vault.update_secret(v_id, p_value, v_name, coalesce(p_description, p_key), null);
  end if;

  insert into public.platform_secrets (
    key, value_enc, vault_secret_id, description, category, scope, is_sensitive, updated_at
  ) values (
    p_key, '[vault]', v_id, p_description, p_category, 'runtime', true, now()
  )
  on conflict (key) do update set
    value_enc = '[vault]',
    vault_secret_id = excluded.vault_secret_id,
    description = coalesce(excluded.description, platform_secrets.description),
    category = excluded.category,
    scope = 'runtime',
    is_sensitive = true,
    updated_at = now();
end;
$$;

create or replace function public.get_platform_secret(p_key text)
returns text
language plpgsql
security definer
set search_path = public, vault
stable
as $$
declare
  v_id uuid;
  v_legacy text;
  v_value text;
begin
  select vault_secret_id, value_enc into v_id, v_legacy
  from public.platform_secrets
  where key = p_key;

  if v_id is not null then
    select decrypted_secret into v_value from vault.decrypted_secrets where id = v_id;
    return v_value;
  end if;

  -- Compatibility during controlled rotation of the existing inventory. New
  -- and rotated secrets are always written to Vault by set_platform_secret.
  return v_legacy;
end;
$$;

-- Move the two credentials entered through the new provider screen. Their
-- source format is known; the older inventory is preserved until each owner
-- rotates it instead of guessing whether historical values contain ciphertext.
do $$
declare
  r record;
begin
  for r in
    select key, value_enc, description, category
    from public.platform_secrets
    where key in ('XAI_API_KEY', 'ANTHROPIC_API_KEY')
      and vault_secret_id is null
      and value_enc is not null
      and value_enc <> ''
  loop
    perform public.set_platform_secret(r.key, r.value_enc, r.description, r.category);
  end loop;
end;
$$;

revoke all on function public.get_platform_secret(text) from public, anon, authenticated;
revoke all on function public.set_platform_secret(text, text, text, text) from public, anon, authenticated;
grant execute on function public.get_platform_secret(text) to service_role;
grant execute on function public.set_platform_secret(text, text, text, text) to service_role;

comment on column public.platform_secrets.vault_secret_id is
  'Reference to the encrypted Supabase Vault record. Plaintext is never stored in platform_secrets.';

commit;
