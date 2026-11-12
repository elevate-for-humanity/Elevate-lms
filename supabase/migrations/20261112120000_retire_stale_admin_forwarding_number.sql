-- (317) 760-7908 is retired. The approved administrator cellular forwarding
-- destination is (317) 956-2748 (lib/phone/forwarding-policy.ts).
update public.communication_extensions
set admin_external_fallback = false,
    external_fallback_number = null,
    updated_at = now()
where external_fallback_number = '+13177607908';

create or replace function public.enforce_admin_cell_forwarding()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.admin_external_fallback or new.external_fallback_number is not null then
    if not (
      new.admin_external_fallback
      and new.extension = '0'
      and new.external_fallback_number is not distinct from '+13179562748'
      and exists (
        select 1 from public.communication_workspaces w
        join public.phone_systems s on s.id = w.phone_system_id
        where w.id = new.workspace_id and s.tenant_id is null
      )
    ) then
      raise exception 'Cell-phone forwarding is disabled for this extension'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_admin_cell_forwarding() from public, anon, authenticated;

