-- DB-owned version token: every writer advances it, including older application writers.
create or replace function public.advance_website_write_token()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  return new;
end;
$$;
revoke all on function public.advance_website_write_token() from public, anon, authenticated;
create trigger advance_website_write_token before update on public.user_websites
for each row execute function public.advance_website_write_token();

-- Receipts are internal. A browser must never authorize a free edit or refund.
create table public.website_builder_edit_commits (
  request_id uuid primary key,
  fingerprint bytea not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.website_builder_edit_commits enable row level security;
revoke all on public.website_builder_edit_commits from public, anon, authenticated;
grant select, insert on public.website_builder_edit_commits to service_role;

create or replace function public.commit_website_builder_paris_edit(
  p_request_id uuid, p_website_id uuid, p_actor_id uuid,
  p_expected_updated_at timestamptz, p_site_name text, p_site_config jsonb,
  p_charge_trial boolean
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_site public.user_websites%rowtype;
  v_receipt public.website_builder_edit_commits%rowtype;
  v_fingerprint bytea;
  v_backup uuid;
  v_success boolean;
  v_balance integer;
  v_saved jsonb;
  v_result jsonb;
begin
  if p_request_id is null or p_actor_id is null or p_website_id is null or p_charge_trial is null
     or p_site_name is null or jsonb_typeof(p_site_config) is distinct from 'object' then
    raise exception 'Invalid edit commit' using errcode = '22023';
  end if;
  v_fingerprint := sha256(convert_to(jsonb_build_array(p_website_id, p_actor_id,
    extract(epoch from p_expected_updated_at), p_site_name, p_site_config, p_charge_trial)::text, 'UTF8'));
  -- Concurrent duplicate delivery waits here and reads the original committed result.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select * into v_receipt from public.website_builder_edit_commits where request_id = p_request_id;
  if found then
    if v_receipt.fingerprint <> v_fingerprint then
      raise exception 'Request identifier already used for another edit' using errcode = '22023';
    end if;
    return v_receipt.result;
  end if;
  select * into v_site from public.user_websites where id = p_website_id for update;
  if not found then raise exception 'Website not found' using errcode = 'P0404'; end if;
  if v_site.updated_at is distinct from p_expected_updated_at then
    raise exception 'Website changed while PARIS was working' using errcode = 'P0409';
  end if;
  begin
  insert into public.website_revisions(website_id, user_id, site_name, subdomain, site_config, is_published, reason)
  values(v_site.id, p_actor_id, v_site.site_name, v_site.subdomain, v_site.site_config, v_site.is_published, 'before_paris_edit')
  returning id into v_backup;
  exception when others then
    raise exception 'Rollback snapshot unavailable' using errcode = 'P0503';
  end;
  if v_backup is null then raise exception 'Rollback snapshot unavailable' using errcode = 'P0503'; end if;
  if p_charge_trial then
    select success, balance into v_success, v_balance
    from public.consume_app_credits(p_actor_id, 'website-builder', 'paris_edit', 8);
    if v_success is distinct from true then
      raise exception 'Insufficient Website Builder credits' using errcode = 'P0402';
    end if;
  end if;
  update public.user_websites set site_name = p_site_name, site_config = p_site_config where id = p_website_id
  returning jsonb_build_object('id', id, 'site_name', site_name, 'subdomain', subdomain,
    'is_published', is_published, 'site_config', site_config) into v_saved;
  v_result := jsonb_build_object('website', v_saved, 'backupRevisionId', v_backup,
    'creditsCharged', case when p_charge_trial then 8 else 0 end, 'creditsRemaining', v_balance);
  insert into public.website_builder_edit_commits(request_id, fingerprint, result) values(p_request_id, v_fingerprint, v_result);
  return v_result;
end;
$$;
revoke all on function public.commit_website_builder_paris_edit(uuid, uuid, uuid, timestamptz, text, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.commit_website_builder_paris_edit(uuid, uuid, uuid, timestamptz, text, jsonb, boolean) to service_role;

notify pgrst, 'reload schema';
