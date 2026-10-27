begin;
create temporary table portal_authority_test (id uuid, role text, roles jsonb, program_holder_id uuid, verified boolean, suspended boolean, full_name text);
create or replace function pg_temp.protect_profile_portal_authority()
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

create trigger test_authority before insert or update on portal_authority_test for each row execute function pg_temp.protect_profile_portal_authority();
insert into portal_authority_test(id,role,full_name) values ('00000000-0000-4000-8000-000000000001','program_holder','Test only');
grant select,insert,update on portal_authority_test to authenticated;
set local role authenticated;
do $test$
begin
  update pg_temp.portal_authority_test set full_name='Ordinary profile edit';
  begin
    update pg_temp.portal_authority_test set role='admin';
    raise exception 'TEST FAILED: role elevation allowed';
  exception when insufficient_privilege then null; end;
  begin
    update pg_temp.portal_authority_test set program_holder_id='00000000-0000-4000-8000-000000000099';
    raise exception 'TEST FAILED: holder reassignment allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into pg_temp.portal_authority_test(id,role) values ('00000000-0000-4000-8000-000000000002','admin');
    raise exception 'TEST FAILED: privileged signup allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into pg_temp.portal_authority_test(id,role) values ('00000000-0000-4000-8000-000000000003',' Super-Admin ');
    raise exception 'TEST FAILED: legacy role alias allowed';
  exception when insufficient_privilege then null; end;
end;
$test$;
reset role;
rollback;
