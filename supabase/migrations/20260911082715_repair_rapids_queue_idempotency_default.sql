-- Keep legacy and current RAPIDS queue writers compatible with the required
-- idempotency contract. The canonical tuple remains unique independently.
create or replace function public.ensure_rapids_action_queue_idempotency_key()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.idempotency_key is null or btrim(new.idempotency_key) = '' then
    new.idempotency_key := concat_ws(':', new.entity_type, new.entity_id::text, new.action_type);
  end if;
  return new;
end;
$$;

revoke all on function public.ensure_rapids_action_queue_idempotency_key() from public, anon, authenticated;
grant execute on function public.ensure_rapids_action_queue_idempotency_key() to service_role;

drop trigger if exists trg_ensure_rapids_action_queue_idempotency_key on public.rapids_action_queue;
create trigger trg_ensure_rapids_action_queue_idempotency_key
before insert or update of entity_type, entity_id, action_type, idempotency_key
on public.rapids_action_queue
for each row execute function public.ensure_rapids_action_queue_idempotency_key();
