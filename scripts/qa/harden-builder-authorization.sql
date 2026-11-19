-- Website Builder authorization guards; no customer rows or balances are rewritten.
-- Refuse to overwrite a wallet implementation that changed after inspection.
do $guard$
begin
 if to_regclass('public.user_websites') is null or to_regclass('public.website_revisions') is null
 or to_regprocedure('rpc_private.ensure_app_trial_wallet(uuid,text,integer)') is null then
  raise exception 'Website Builder dependencies are required';
 end if;
 if (select md5(prosrc) from pg_proc where oid='rpc_private.ensure_app_trial_wallet(uuid,text,integer)'::regprocedure)
  is distinct from 'c5a318bd58d891f036f11c4c668d381b' then
  raise exception 'Trial wallet helper changed since review; inspect before applying';
 end if;
end;
$guard$;

drop policy if exists user_websites_organization_members on public.user_websites;
drop policy if exists user_websites_organization_members_select on public.user_websites;
drop policy if exists user_websites_organization_managers on public.user_websites;
create policy user_websites_organization_members_select on public.user_websites for select to authenticated
 using (exists(select 1 from public.organization_users ou
  where ou.organization_id=user_websites.organization_id and ou.user_id=(select auth.uid()) and ou.status='active'));
create policy user_websites_organization_managers on public.user_websites for all to authenticated
 using (exists(select 1 from public.organization_users ou
  where ou.organization_id=user_websites.organization_id and ou.user_id=(select auth.uid()) and ou.status='active'
   and ou.role in ('org_owner','org_admin')))
 with check (exists(select 1 from public.organization_users ou
  where ou.organization_id=user_websites.organization_id and ou.user_id=(select auth.uid()) and ou.status='active'
   and ou.role in ('org_owner','org_admin')));

-- Personal ownership must not permit attaching a site to somebody else's organization.
drop policy if exists user_websites_insert_own on public.user_websites;
create policy user_websites_insert_own on public.user_websites for insert to authenticated
 with check (user_id=(select auth.uid()) and (organization_id is null or exists(
  select 1 from public.organization_users ou where ou.organization_id=user_websites.organization_id
   and ou.user_id=(select auth.uid()) and ou.status='active' and ou.role in ('org_owner','org_admin'))));
drop policy if exists user_websites_update_own on public.user_websites;
create policy user_websites_update_own on public.user_websites for update to authenticated
 using (user_id=(select auth.uid()))
 with check (user_id=(select auth.uid()) and (organization_id is null or exists(
  select 1 from public.organization_users ou where ou.organization_id=user_websites.organization_id
   and ou.user_id=(select auth.uid()) and ou.status='active' and ou.role in ('org_owner','org_admin'))));

drop policy if exists website_revisions_owner_insert on public.website_revisions;
create policy website_revisions_owner_insert on public.website_revisions for insert to authenticated
 with check (user_id=(select auth.uid()) and exists(
  select 1 from public.user_websites w where w.id=website_revisions.website_id and
   (w.user_id=(select auth.uid()) or exists(select 1 from public.organization_users ou
    where ou.organization_id=w.organization_id and ou.user_id=(select auth.uid()) and ou.status='active'
     and ou.role in ('org_owner','org_admin')))));

CREATE OR REPLACE FUNCTION rpc_private.ensure_app_trial_wallet(p_user_id uuid, p_app_slug text, p_trial_credits integer DEFAULT 500)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
 v_balance integer;
 v_grant integer;
 v_role text := auth.role();
begin
 if v_role is distinct from 'service_role' then
  if auth.uid() is null or auth.uid() <> p_user_id then
   raise exception 'not authorized' using errcode='42501';
  end if;
  if p_app_slug <> 'website-builder' or not exists (
   select 1 from public.user_app_subscriptions s
   where s.user_id=p_user_id and s.app_slug=p_app_slug
    and s.status='trial' and s.trial_ends_at>now()
  ) then
   raise exception 'active Website Builder trial required' using errcode='42501';
  end if;
  -- Match WEBSITE_BUILDER_TRIAL.credits; caller-selected amounts are never authoritative.
  v_grant := 500;
 else
  v_grant := greatest(p_trial_credits,0);
 end if;
 insert into public.user_app_credit_wallets(user_id,app_slug,balance,lifetime_granted,lifetime_used)
 values(p_user_id,p_app_slug,v_grant,v_grant,0)
 on conflict(user_id,app_slug) do nothing;
 select balance into v_balance from public.user_app_credit_wallets
 where user_id=p_user_id and app_slug=p_app_slug;
 return coalesce(v_balance,0);
end;
$function$;

-- Preserve authenticated own-trial and trusted server execution; never expose to anon.
revoke all on function rpc_private.ensure_app_trial_wallet(uuid,text,integer) from public,anon;
grant execute on function rpc_private.ensure_app_trial_wallet(uuid,text,integer) to authenticated,service_role;
