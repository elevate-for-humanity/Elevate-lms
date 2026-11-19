-- QA ONLY: isolated project isdgjcdabhxxozarmxta.
-- Source: read-only hosting catalogs captured 2026-11-19.
-- No application rows, Auth identities, subscriptions or credits are copied.
-- Run transactionally with stop-on-error; existing builder tables cause refusal.
-- This is NOT a production migration and must stay outside supabase/migrations.


do $qa$
begin
 if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname = any(array['user_app_subscriptions','user_websites','website_builder_edit_commits','website_revisions','user_app_credit_ledger','user_app_credit_wallets','website_paris_workspaces'])) then
  raise exception 'Refusing builder bootstrap: target already contains builder tables';
 end if;
 if to_regprocedure('public.commit_website_builder_draft(uuid,uuid,uuid,timestamptz,text,text,jsonb,text,text,boolean)') is not null or to_regprocedure('rpc_private.consume_app_credits(uuid,text,text,integer)') is not null or to_regnamespace('website_paris_private') is not null then
  raise exception 'Refusing builder bootstrap: target already contains builder functions or private workspace schema';
 end if;
 if to_regclass('public.organizations') is null or to_regclass('public.organization_users') is null
 or to_regprocedure('rpc_private.is_admin()') is null
 or to_regprocedure('security_private.privileged_session_mfa_satisfied()') is null then
  raise exception 'Apply the reviewed isolated QA core/read-policy stages first';
 end if;
end;
$qa$;


create table public."user_app_subscriptions" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid,
  "gov" text,
  "status" text default 'active'::text,
  "trial_ends_at" timestamp with time zone,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "app_slug" text,
  "plan" text default 'starter'::text,
  "current_period_start" timestamp with time zone,
  "current_period_end" timestamp with time zone,
  "stripe_subscription_id" text,
  "stripe_customer_id" text,
  "provider_subscription_id" text,
  "provider_customer_id" text,
  "billing_provider" text,
  "provider_status" text
);

create table public."user_websites" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid,
  "status" text default 'active'::text,
  "trial_ends_at" timestamp with time zone,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "organization_id" uuid,
  "subdomain" text,
  "site_name" text,
  "template_id" text,
  "is_published" boolean default false,
  "site_config" jsonb default '{}'::jsonb
);

create table public."website_builder_edit_commits" (
  "request_id" uuid not null,
  "fingerprint" bytea not null,
  "result" jsonb not null,
  "created_at" timestamp with time zone default now() not null
);

create table public."website_revisions" (
  "id" uuid default gen_random_uuid() not null,
  "website_id" uuid not null,
  "user_id" uuid not null,
  "site_name" text,
  "subdomain" text,
  "site_config" jsonb default '{}'::jsonb not null,
  "is_published" boolean default false not null,
  "reason" text default 'save'::text not null,
  "created_at" timestamp with time zone default now() not null
);

create table public."user_app_credit_ledger" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "app_slug" text not null,
  "operation" text not null,
  "credits_delta" integer not null,
  "balance_after" integer not null,
  "source" text default 'usage'::text not null,
  "metadata" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null
);

create table public."user_app_credit_wallets" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "app_slug" text not null,
  "balance" integer default 0 not null,
  "lifetime_granted" integer default 0 not null,
  "lifetime_used" integer default 0 not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table public."website_paris_workspaces" (
  "website_id" uuid not null,
  "enabled" boolean default true not null,
  "welcome_message" text default 'Hello, I am PARIS. How can I help you with this business?'::text not null,
  "public_instructions" text default ''::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

alter table public."user_app_subscriptions" add constraint "user_app_subscriptions_billing_provider_check" CHECK (((billing_provider IS NULL) OR (billing_provider = ANY (ARRAY['quickbooks'::text, 'stripe'::text, 'paypal'::text, 'manual'::text]))));

alter table public."user_app_subscriptions" add constraint "user_app_subscriptions_pkey" PRIMARY KEY (id);

alter table public."user_app_subscriptions" add constraint "user_app_subscriptions_user_app_key" UNIQUE (user_id, app_slug);

alter table public."user_app_subscriptions" add constraint "user_app_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public."user_websites" add constraint "user_websites_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

alter table public."user_websites" add constraint "user_websites_pkey" PRIMARY KEY (id);

alter table public."user_websites" add constraint "user_websites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public."website_builder_edit_commits" add constraint "website_builder_edit_commits_pkey" PRIMARY KEY (request_id);

alter table public."website_revisions" add constraint "website_revisions_pkey" PRIMARY KEY (id);

alter table public."website_revisions" add constraint "website_revisions_website_id_fkey" FOREIGN KEY (website_id) REFERENCES user_websites(id) ON DELETE CASCADE;

alter table public."user_app_credit_ledger" add constraint "user_app_credit_ledger_balance_after_check" CHECK ((balance_after >= 0));

alter table public."user_app_credit_ledger" add constraint "user_app_credit_ledger_pkey" PRIMARY KEY (id);

alter table public."user_app_credit_ledger" add constraint "user_app_credit_ledger_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public."user_app_credit_wallets" add constraint "user_app_credit_wallets_balance_check" CHECK ((balance >= 0));

alter table public."user_app_credit_wallets" add constraint "user_app_credit_wallets_lifetime_granted_check" CHECK ((lifetime_granted >= 0));

alter table public."user_app_credit_wallets" add constraint "user_app_credit_wallets_lifetime_used_check" CHECK ((lifetime_used >= 0));

alter table public."user_app_credit_wallets" add constraint "user_app_credit_wallets_pkey" PRIMARY KEY (id);

alter table public."user_app_credit_wallets" add constraint "user_app_credit_wallets_user_id_app_slug_key" UNIQUE (user_id, app_slug);

alter table public."user_app_credit_wallets" add constraint "user_app_credit_wallets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public."website_paris_workspaces" add constraint "website_paris_workspaces_pkey" PRIMARY KEY (website_id);

alter table public."website_paris_workspaces" add constraint "website_paris_workspaces_public_instructions_check" CHECK ((length(public_instructions) <= 2400));

alter table public."website_paris_workspaces" add constraint "website_paris_workspaces_website_id_fkey" FOREIGN KEY (website_id) REFERENCES user_websites(id) ON DELETE CASCADE;

alter table public."website_paris_workspaces" add constraint "website_paris_workspaces_welcome_message_check" CHECK ((length(welcome_message) <= 500));

CREATE UNIQUE INDEX user_app_subscriptions_user_app_unique ON public.user_app_subscriptions USING btree (user_id, app_slug) WHERE ((user_id IS NOT NULL) AND (app_slug IS NOT NULL));

alter table public."user_app_subscriptions" enable row level security;

revoke all on table public."user_app_subscriptions" from public, anon, authenticated, service_role;

grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN on table public."user_app_subscriptions" to "service_role";

CREATE INDEX user_websites_organization_id_idx ON public.user_websites USING btree (organization_id);

CREATE UNIQUE INDEX user_websites_one_per_organization_idx ON public.user_websites USING btree (organization_id) WHERE (organization_id IS NOT NULL);

CREATE INDEX idx_fk_user_websites_36ff5b3f0328 ON public.user_websites USING btree (user_id);

CREATE UNIQUE INDEX user_websites_subdomain_unique ON public.user_websites USING btree (subdomain) WHERE (subdomain IS NOT NULL);

alter table public."user_websites" enable row level security;

revoke all on table public."user_websites" from public, anon, authenticated, service_role;

grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN on table public."user_websites" to "service_role";

grant INSERT, SELECT, UPDATE, DELETE on table public."user_websites" to "authenticated";

alter table public."website_builder_edit_commits" enable row level security;

revoke all on table public."website_builder_edit_commits" from public, anon, authenticated, service_role;

grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN on table public."website_builder_edit_commits" to "service_role";

CREATE INDEX website_revisions_website_created_idx ON public.website_revisions USING btree (website_id, created_at DESC);

CREATE INDEX website_revisions_user_idx ON public.website_revisions USING btree (user_id, created_at DESC);

alter table public."website_revisions" enable row level security;

revoke all on table public."website_revisions" from public, anon, authenticated, service_role;

grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN on table public."website_revisions" to "service_role";

grant INSERT, SELECT, UPDATE, DELETE on table public."website_revisions" to "authenticated";

CREATE INDEX idx_user_app_credit_ledger_user_app_created ON public.user_app_credit_ledger USING btree (user_id, app_slug, created_at DESC);

alter table public."user_app_credit_ledger" enable row level security;

revoke all on table public."user_app_credit_ledger" from public, anon, authenticated, service_role;

grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN on table public."user_app_credit_ledger" to "service_role";

grant SELECT on table public."user_app_credit_ledger" to "authenticated";

alter table public."user_app_credit_wallets" enable row level security;

revoke all on table public."user_app_credit_wallets" from public, anon, authenticated, service_role;

grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN on table public."user_app_credit_wallets" to "service_role";

grant SELECT on table public."user_app_credit_wallets" to "authenticated";

alter table public."website_paris_workspaces" enable row level security;

revoke all on table public."website_paris_workspaces" from public, anon, authenticated, service_role;

grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN on table public."website_paris_workspaces" to "service_role";

grant SELECT on table public."website_paris_workspaces" to "authenticated";

create schema if not exists website_paris_private;

revoke all on schema website_paris_private from public, anon, authenticated;

CREATE OR REPLACE FUNCTION rpc_private.consume_app_credits(p_user_id uuid, p_app_slug text, p_operation text, p_cost integer)
 RETURNS TABLE(success boolean, balance integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare v_balance integer; v_next integer; v_role text := auth.role(); begin if v_role is distinct from 'service_role' then if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'not authorized'; end if; end if; if p_cost <= 0 then select w.balance into v_balance from public.user_app_credit_wallets w where w.user_id=p_user_id and w.app_slug=p_app_slug; return query select true,coalesce(v_balance,0); return; end if; select w.balance into v_balance from public.user_app_credit_wallets w where w.user_id=p_user_id and w.app_slug=p_app_slug for update; if v_balance is null or v_balance < p_cost then return query select false,coalesce(v_balance,0); return; end if; v_next:=v_balance-p_cost; update public.user_app_credit_wallets set balance=v_next,lifetime_used=lifetime_used+p_cost,updated_at=now() where user_id=p_user_id and app_slug=p_app_slug; insert into public.user_app_credit_ledger(user_id,app_slug,operation,credits_delta,balance_after,source) values(p_user_id,p_app_slug,p_operation,-p_cost,v_next,'usage'); return query select true,v_next; end; $function$;


revoke all on function "rpc_private"."consume_app_credits"(p_user_id uuid, p_app_slug text, p_operation text, p_cost integer) from public, anon, authenticated, service_role;

grant execute on function "rpc_private"."consume_app_credits"(p_user_id uuid, p_app_slug text, p_operation text, p_cost integer) to "service_role";

grant execute on function "rpc_private"."consume_app_credits"(p_user_id uuid, p_app_slug text, p_operation text, p_cost integer) to "authenticated";

CREATE OR REPLACE FUNCTION public.advance_website_write_token()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  return new;
end;
$function$;


revoke all on function "public"."advance_website_write_token"() from public, anon, authenticated, service_role;

grant execute on function "public"."advance_website_write_token"() to "service_role";

CREATE OR REPLACE FUNCTION public.commit_website_builder_draft(p_request_id uuid, p_actor_id uuid, p_website_id uuid, p_expected_updated_at timestamp with time zone, p_site_name text, p_template_id text, p_site_config jsonb, p_plan text, p_operation text, p_charge_trial boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
 v_site public.user_websites%rowtype;
 v_receipt public.website_builder_edit_commits%rowtype;
 v_fingerprint bytea;
 v_backup uuid;
 v_limit integer;
 v_count integer;
 v_success boolean;
 v_balance integer;
 v_saved jsonb;
 v_result jsonb;
begin
 if p_request_id is null or p_actor_id is null or p_charge_trial is null
  or p_site_name is null or p_template_id is null
  or p_operation is null or p_operation not in ('initial_site_generation','import')
  or (p_operation='import' and p_charge_trial)
  or jsonb_typeof(p_site_config) is distinct from 'object'
  or (p_site_config#>'{meta,parisInterviewCompleted}')='false'::jsonb
  or p_plan is null or p_plan not in ('starter','professional','enterprise')
  or (p_website_id is null and p_expected_updated_at is not null) then
  raise exception 'Invalid draft commit' using errcode='22023';
 end if;
 v_fingerprint:=sha256(convert_to(jsonb_build_array('draft',p_actor_id,p_website_id,
  extract(epoch from p_expected_updated_at),p_site_name,p_template_id,p_site_config,p_plan,p_operation,p_charge_trial)::text,'UTF8'));
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into v_receipt from public.website_builder_edit_commits where request_id=p_request_id;
 if found then
  if v_receipt.fingerprint<>v_fingerprint then raise exception 'Request identifier already used' using errcode='22023';end if;
  return v_receipt.result;
 end if;
 -- Serialize both creation paths for this owner before checking the plan limit.
 perform pg_advisory_xact_lock(hashtextextended('website-draft-owner:'||p_actor_id::text,0));
 if p_website_id is not null then
  select * into v_site from public.user_websites where id=p_website_id and user_id=p_actor_id for update;
  if not found then raise exception 'Website not found' using errcode='P0404';end if;
  if v_site.updated_at is distinct from p_expected_updated_at then
   raise exception 'Website changed while draft was prepared' using errcode='P0409';
  end if;
 end if;
 v_limit:=case p_plan when 'starter' then 1 when 'professional' then 3 else null end;
 select count(*) into v_count from public.user_websites where user_id=p_actor_id
  and (p_website_id is null or id<>p_website_id)
  and (site_config#>'{meta,parisInterviewCompleted}') is distinct from 'false'::jsonb;
 -- Replacing an already-counted site adds no entitlement usage, even after downgrade.
 if v_limit is not null and v_count>=v_limit
  and (p_website_id is null
   or (v_site.site_config#>'{meta,parisInterviewCompleted}') is not distinct from 'false'::jsonb) then
  raise exception 'Website plan limit reached' using errcode='P0409';
 end if;
 if p_website_id is not null then
  insert into public.website_revisions(website_id,user_id,site_name,subdomain,site_config,is_published,reason)
  values(v_site.id,p_actor_id,v_site.site_name,v_site.subdomain,v_site.site_config,v_site.is_published,'before_'||p_operation)
  returning id into v_backup;
  if v_backup is null then raise exception 'Rollback snapshot unavailable' using errcode='P0503';end if;
 end if;
 if p_charge_trial then
  select success,balance into v_success,v_balance from public.consume_app_credits(p_actor_id,'website-builder','initial_site_generation',60);
  if v_success is distinct from true then raise exception 'Insufficient Website Builder credits' using errcode='P0402';end if;
 end if;
 if p_website_id is null then
  insert into public.user_websites(user_id,site_name,template_id,site_config,is_published,status)
  values(p_actor_id,p_site_name,p_template_id,p_site_config,false,'draft') returning to_jsonb(user_websites.*) into v_saved;
 else
  update public.user_websites set site_name=p_site_name,template_id=p_template_id,site_config=p_site_config,
   is_published=false,status='draft' where id=p_website_id returning to_jsonb(user_websites.*) into v_saved;
 end if;
 -- Match the existing public response; never return internal ownership or trial metadata.
 v_saved:=jsonb_build_object('id',v_saved->'id','site_name',v_saved->'site_name','subdomain',v_saved->'subdomain',
  'is_published',v_saved->'is_published','updated_at',v_saved->'updated_at');
 v_result:=jsonb_build_object('website',v_saved,'backupRevisionId',v_backup,
  'creditsCharged',case when p_charge_trial then 60 else 0 end,'creditsRemaining',v_balance);
 insert into public.website_builder_edit_commits(request_id,fingerprint,result) values(p_request_id,v_fingerprint,v_result);
 return v_result;
end;$function$;


revoke all on function "public"."commit_website_builder_draft"(p_request_id uuid, p_actor_id uuid, p_website_id uuid, p_expected_updated_at timestamp with time zone, p_site_name text, p_template_id text, p_site_config jsonb, p_plan text, p_operation text, p_charge_trial boolean) from public, anon, authenticated, service_role;

grant execute on function "public"."commit_website_builder_draft"(p_request_id uuid, p_actor_id uuid, p_website_id uuid, p_expected_updated_at timestamp with time zone, p_site_name text, p_template_id text, p_site_config jsonb, p_plan text, p_operation text, p_charge_trial boolean) to "service_role";

CREATE OR REPLACE FUNCTION public.commit_website_builder_paris_edit(p_request_id uuid, p_website_id uuid, p_actor_id uuid, p_expected_updated_at timestamp with time zone, p_site_name text, p_site_config jsonb, p_charge_trial boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$;


revoke all on function "public"."commit_website_builder_paris_edit"(p_request_id uuid, p_website_id uuid, p_actor_id uuid, p_expected_updated_at timestamp with time zone, p_site_name text, p_site_config jsonb, p_charge_trial boolean) from public, anon, authenticated, service_role;

grant execute on function "public"."commit_website_builder_paris_edit"(p_request_id uuid, p_website_id uuid, p_actor_id uuid, p_expected_updated_at timestamp with time zone, p_site_name text, p_site_config jsonb, p_charge_trial boolean) to "service_role";

CREATE OR REPLACE FUNCTION public.consume_app_credits(p_user_id uuid, p_app_slug text, p_operation text, p_cost integer)
 RETURNS TABLE(success boolean, balance integer)
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public', 'rpc_private'
AS $function$SELECT * FROM rpc_private.consume_app_credits($1, $2, $3, $4)$function$;


revoke all on function "public"."consume_app_credits"(p_user_id uuid, p_app_slug text, p_operation text, p_cost integer) from public, anon, authenticated, service_role;

grant execute on function "public"."consume_app_credits"(p_user_id uuid, p_app_slug text, p_operation text, p_cost integer) to "service_role";

grant execute on function "public"."consume_app_credits"(p_user_id uuid, p_app_slug text, p_operation text, p_cost integer) to "authenticated";

CREATE OR REPLACE FUNCTION website_paris_private.provision_site_workspace()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.website_paris_workspaces(website_id) values(new.id) on conflict do nothing;
  return new;
end;
$function$;


revoke all on function "website_paris_private"."provision_site_workspace"() from public, anon, authenticated, service_role;

create policy "admin_bypass_delete" on public."user_app_subscriptions" as PERMISSIVE for DELETE to "authenticated" using (rpc_private.is_admin());

create policy "admin_bypass_insert" on public."user_app_subscriptions" as PERMISSIVE for INSERT to "authenticated" with check (rpc_private.is_admin());

create policy "admin_bypass_select" on public."user_app_subscriptions" as PERMISSIVE for SELECT to "authenticated" using (rpc_private.is_admin());

create policy "admin_bypass_update" on public."user_app_subscriptions" as PERMISSIVE for UPDATE to "authenticated" using (rpc_private.is_admin()) with check (rpc_private.is_admin());

create policy "auth_read_user_app_subscriptions" on public."user_app_subscriptions" as PERMISSIVE for SELECT to "authenticated" using (true);

create policy "require_privileged_aal2" on public."user_app_subscriptions" as RESTRICTIVE for ALL to "authenticated" using (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) with check (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));

create policy "user_app_subscriptions_insert_own" on public."user_app_subscriptions" as PERMISSIVE for INSERT to "authenticated" with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "user_app_subscriptions_select_own" on public."user_app_subscriptions" as PERMISSIVE for SELECT to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));

create policy "user_app_subscriptions_update_own" on public."user_app_subscriptions" as PERMISSIVE for UPDATE to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id)) with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "admin_bypass_delete" on public."user_websites" as PERMISSIVE for DELETE to "authenticated" using (rpc_private.is_admin());

create policy "admin_bypass_insert" on public."user_websites" as PERMISSIVE for INSERT to "authenticated" with check (rpc_private.is_admin());

create policy "admin_bypass_select" on public."user_websites" as PERMISSIVE for SELECT to "authenticated" using (rpc_private.is_admin());

create policy "admin_bypass_update" on public."user_websites" as PERMISSIVE for UPDATE to "authenticated" using (rpc_private.is_admin()) with check (rpc_private.is_admin());

create policy "require_privileged_aal2" on public."user_websites" as RESTRICTIVE for ALL to "authenticated" using (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) with check (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));

create policy "user_websites_delete_own" on public."user_websites" as PERMISSIVE for DELETE to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));

create policy "user_websites_insert_own" on public."user_websites" as PERMISSIVE for INSERT to "authenticated" with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "user_websites_organization_members" on public."user_websites" as PERMISSIVE for ALL to "authenticated" using ((EXISTS ( SELECT 1
   FROM organization_users ou
  WHERE ((ou.organization_id = user_websites.organization_id) AND (ou.user_id = ( SELECT auth.uid() AS uid)) AND (ou.status = 'active'::text))))) with check ((EXISTS ( SELECT 1
   FROM organization_users ou
  WHERE ((ou.organization_id = user_websites.organization_id) AND (ou.user_id = ( SELECT auth.uid() AS uid)) AND (ou.status = 'active'::text) AND (ou.role = ANY (ARRAY['org_owner'::text, 'org_admin'::text]))))));

create policy "user_websites_public_published" on public."user_websites" as PERMISSIVE for SELECT to "anon" using (((is_published = true) AND (status = 'active'::text)));

create policy "user_websites_select_own" on public."user_websites" as PERMISSIVE for SELECT to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));

create policy "user_websites_update_own" on public."user_websites" as PERMISSIVE for UPDATE to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id)) with check ((( SELECT auth.uid() AS uid) = user_id));

CREATE TRIGGER advance_website_write_token BEFORE UPDATE ON public.user_websites FOR EACH ROW EXECUTE FUNCTION advance_website_write_token();

CREATE TRIGGER provision_business_paris AFTER INSERT ON public.user_websites FOR EACH ROW EXECUTE FUNCTION website_paris_private.provision_site_workspace();

create policy "website_revisions_owner_delete" on public."website_revisions" as PERMISSIVE for DELETE to public using ((( SELECT auth.uid() AS uid) = user_id));

create policy "website_revisions_owner_insert" on public."website_revisions" as PERMISSIVE for INSERT to public with check ((( SELECT auth.uid() AS uid) = user_id));

create policy "website_revisions_owner_select" on public."website_revisions" as PERMISSIVE for SELECT to public using ((( SELECT auth.uid() AS uid) = user_id));

create policy "require_privileged_aal2" on public."user_app_credit_ledger" as RESTRICTIVE for ALL to "authenticated" using (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) with check (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));

create policy "users read own app credit ledger" on public."user_app_credit_ledger" as PERMISSIVE for SELECT to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));

create policy "require_privileged_aal2" on public."user_app_credit_wallets" as RESTRICTIVE for ALL to "authenticated" using (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied)) with check (( SELECT security_private.privileged_session_mfa_satisfied() AS privileged_session_mfa_satisfied));

create policy "users read own app credit wallet" on public."user_app_credit_wallets" as PERMISSIVE for SELECT to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));

create policy "paris_business_managers_read" on public."website_paris_workspaces" as PERMISSIVE for SELECT to "authenticated" using ((EXISTS ( SELECT 1
   FROM user_websites w
  WHERE ((w.id = website_paris_workspaces.website_id) AND ((w.user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM organization_users ou
          WHERE ((ou.organization_id = w.organization_id) AND (ou.user_id = ( SELECT auth.uid() AS uid)) AND (ou.status = 'active'::text) AND (ou.role = ANY (ARRAY['org_owner'::text, 'org_admin'::text]))))))))));

