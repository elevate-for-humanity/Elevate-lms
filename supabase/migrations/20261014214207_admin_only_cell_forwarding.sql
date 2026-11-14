-- Cellular forwarding is restricted to the platform administrator's approved
-- destination. Customer PBX connections and ordinary outbound calls are separate.
update public.communication_extensions e
set admin_external_fallback = false,
    external_fallback_number = null,
    updated_at = now()
where (e.admin_external_fallback or e.external_fallback_number is not null)
  and not (
    e.extension = '0'
    and e.admin_external_fallback
    and e.external_fallback_number = '+13177607908'
    and exists (
      select 1 from public.communication_workspaces w
      join public.phone_systems s on s.id = w.phone_system_id
      where w.id = e.workspace_id and s.tenant_id is null
    )
  );

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
      and new.external_fallback_number is not distinct from '+13177607908'
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

create trigger communication_extensions_admin_cell_forwarding
before insert or update on public.communication_extensions
for each row execute function public.enforce_admin_cell_forwarding();
