-- Profile row ownership does not authorize changing portal authority.
-- Browser clients keep normal profile edits; trusted server provisioning owns
-- roles, holder links, tenant links and access/verification state.
create or replace function security_private.protect_profile_portal_authority()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  field_name text;
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if regexp_replace(lower(btrim(coalesce(new.role, 'student'))), '[-_[:space:]]', '', 'g') in (
      'admin','superadmin','orgadmin','staff','instructor','advisor',
      'testadmin','proctor','programholder','sitecoordinator',
      'provider','provideradmin','casemanager','workforceboard','workforceboardadmin'
    ) or new.program_holder_id is not null
      or coalesce(new.roles, '[]'::jsonb) not in ('[]'::jsonb, '{}'::jsonb)
      or new.verified is true or new.suspended is true then
      raise exception 'Portal authority must be provisioned by an authorized server'
        using errcode = '42501';
    end if;
    return new;
  end if;
  foreach field_name in array array[
    'role','roles','program_holder_id','tenant_id','organization_id',
    'is_active','suspended','verified','status','portal_type','funding_confirmed'
  ] loop
    if (to_jsonb(new)->field_name) is distinct from (to_jsonb(old)->field_name) then
      raise exception 'Profile authorization fields require an authorized server'
        using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$function$;
revoke all on function security_private.protect_profile_portal_authority() from public, anon, authenticated;
drop trigger if exists protect_profile_portal_authority on public.profiles;
create trigger protect_profile_portal_authority
before insert or update on public.profiles
for each row execute function security_private.protect_profile_portal_authority();
