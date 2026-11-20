-- Isolated-QA follow-up for review findings discovered after the original hardening stage.
-- This script changes authorization policies/functions only and rewrites no rows.
do $guard$
begin
 if to_regprocedure('public.enforce_website_organization_write()') is null then
  raise exception 'Original Website Builder authorization guard must be installed first';
 end if;
 if (select md5(prosrc) from pg_proc where oid='rpc_private.ensure_app_trial_wallet(uuid,text,integer)'::regprocedure)
  is distinct from 'd60487007ba5abfdc0d2da7c8bc22398' then
  raise exception 'Hardened trial wallet helper changed since review; inspect before applying';
 end if;
end;
$guard$;

drop policy if exists user_websites_delete_own on public.user_websites;
create policy user_websites_delete_own on public.user_websites for delete to authenticated
 using (user_id=(select auth.uid()) and organization_id is null);

create or replace function public.enforce_website_organization_write()
returns trigger language plpgsql security invoker set search_path to ''
as $organization_guard$
begin
 if auth.role() is distinct from 'authenticated' then return new;end if;
 if tg_op='UPDATE' then
  if new.organization_id is not distinct from old.organization_id then return new;end if;
  if old.organization_id is not null and not exists(
   select 1 from public.organization_users ou where ou.organization_id=old.organization_id
    and ou.user_id=auth.uid() and ou.status='active' and ou.role in ('org_owner','org_admin')
  ) then
   raise exception 'Organization management authority required' using errcode='42501';
  end if;
 end if;
 if new.organization_id is not null and not exists(
  select 1 from public.organization_users ou where ou.organization_id=new.organization_id
   and ou.user_id=auth.uid() and ou.status='active' and ou.role in ('org_owner','org_admin')
 ) then
  raise exception 'Organization management authority required' using errcode='42501';
 end if;
 return new;
end;
$organization_guard$;
revoke all on function public.enforce_website_organization_write() from public,anon,authenticated;
grant execute on function public.enforce_website_organization_write() to service_role;
