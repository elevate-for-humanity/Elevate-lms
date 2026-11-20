-- Enforce existing-organization authority on both clean and previously migrated databases.
drop policy if exists user_websites_delete_own on public.user_websites;
create policy user_websites_delete_own on public.user_websites for delete to authenticated
 using (user_id = (select auth.uid()) and organization_id is null);

create or replace function public.enforce_website_organization_write()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $organization_guard$
begin
 if auth.role() is distinct from 'authenticated' then
  return new;
 end if;

 if tg_op = 'UPDATE' then
  if new.organization_id is not distinct from old.organization_id then
   return new;
  end if;

  if old.organization_id is not null and not exists (
   select 1 from public.organization_users ou
   where ou.organization_id = old.organization_id
     and ou.user_id = auth.uid() and ou.status = 'active'
     and ou.role in ('org_owner', 'org_admin')
  ) then
   raise exception 'Existing organization management authority required' using errcode = '42501';
  end if;
 end if;

 if new.organization_id is not null and not exists (
  select 1 from public.organization_users ou
  where ou.organization_id = new.organization_id
    and ou.user_id = auth.uid() and ou.status = 'active'
    and ou.role in ('org_owner', 'org_admin')
 ) then
  raise exception 'Destination organization management authority required' using errcode = '42501';
 end if;

 return new;
end;
$organization_guard$;
