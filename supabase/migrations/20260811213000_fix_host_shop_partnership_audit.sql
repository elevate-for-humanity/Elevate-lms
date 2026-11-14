-- Repair the Host Shop partnership audit trigger against the current audit_logs schema.
-- The legacy trigger wrote table_name/record_id/changed_by columns that no longer exist,
-- which caused every host_shop_partnerships INSERT/UPDATE/DELETE to fail.

create or replace function public.log_host_shop_partnership_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_record_id text;
begin
  v_record_id := coalesce(new.id, old.id)::text;

  insert into public.audit_logs (
    action,
    actor_id,
    target_type,
    target_id,
    entity,
    entity_type,
    entity_id,
    before_state,
    after_state,
    metadata
  ) values (
    lower(tg_op),
    auth.uid(),
    'host_shop_partnership',
    v_record_id,
    'host_shop_partnerships',
    'host_shop_partnership',
    v_record_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    jsonb_build_object('table', 'host_shop_partnerships', 'trigger_op', tg_op)
  );

  return coalesce(new, old);
end;
$$;
