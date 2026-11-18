create or replace function public.admin_resolve_apprenticeship_hours_dispute(
  p_id uuid,
  p_approver_id uuid,
  p_expected jsonb,
  p_resolution text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_entry public.progress_entries%rowtype;
  v_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' or not exists (
    select 1 from public.profiles
    where id = p_approver_id and lower(role::text) in ('admin', 'super_admin')
      and is_active is true and suspended is not true
  ) then
    raise exception 'Authenticated admin approver required' using errcode = '42501';
  end if;
  if p_id is null or coalesce(char_length(btrim(p_resolution)), 0) not between 10 and 2000 then
    raise exception 'A reviewed dispute and resolution note are required' using errcode = '22023';
  end if;

  -- Match the canonical verifier's lock order; a failed verification rolls back the transition.
  lock table public.progress_entries in share row exclusive mode;
  lock table public.hour_entries in share row exclusive mode;
  select * into v_entry from public.progress_entries where id = p_id for update;
  if not found or v_entry.status is distinct from 'disputed' then
    raise exception 'Dispute has already changed; refresh the queue' using errcode = 'P0001';
  end if;

  update public.progress_entries set status = 'submitted' where id = p_id;
  v_count := public.admin_verify_apprenticeship_hours(array[p_id], p_approver_id, p_expected);
  if v_count <> 1 then
    raise exception 'Dispute approval could not be verified' using errcode = 'P0001';
  end if;

  insert into public.audit_logs(action, actor_id, target_type, target_id, before_state, after_state, metadata)
  select 'apprenticeship.hours_dispute.resolved', p_approver_id, 'progress_entries',
    p_id::text, to_jsonb(v_entry), to_jsonb(pe), jsonb_build_object('resolution', btrim(p_resolution))
  from public.progress_entries pe where pe.id = p_id;
  return v_count;
end;
$$;

revoke all on function public.admin_resolve_apprenticeship_hours_dispute(uuid, uuid, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.admin_resolve_apprenticeship_hours_dispute(uuid, uuid, jsonb, text)
  to service_role;
