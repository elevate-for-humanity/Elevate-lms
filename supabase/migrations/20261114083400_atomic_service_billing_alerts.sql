-- Service-role-only reconciliation. The billing row lock orders manual receipts,
-- provider refreshes and concurrent warning polls without deleting history.
create index if not exists notifications_service_billing_episode_idx
on public.notifications ((metadata->>'service_id'), (metadata->>'base_key'), created_at desc, id desc)
where metadata->>'source' = 'service-billing';

create or replace function public.reconcile_service_billing_alerts(
  p_service_id text, p_expected_revision text, p_notices jsonb, p_now timestamptz
) returns table(id uuid, user_id uuid, title text, message text, metadata jsonb)
language plpgsql security invoker set search_path = public, pg_temp
set lock_timeout = '3s' set statement_timeout = '10s'
as $$
declare
  billing jsonb; candidate jsonb; prepared jsonb := '[]';
  prior public.notifications%rowtype; base_key text; notice_key text;
  active_keys text[] := '{}'; inserted public.notifications%rowtype;
begin
  if p_service_id !~ '^[a-z][a-z0-9-]{0,40}$' or jsonb_typeof(p_notices) <> 'array'
     or jsonb_array_length(p_notices) > 1000 then
    raise exception 'SERVICE_BILLING_INVALID';
  end if;
  select value::jsonb into billing from public.app_settings
    where key = 'service_billing:' || p_service_id for update;
  if billing is null or billing->>'revision' is distinct from p_expected_revision then
    raise exception 'SERVICE_BILLING_CONFLICT';
  end if;
  for candidate in select value from jsonb_array_elements(p_notices) loop
    base_key := candidate->>'idempotency_key';
    if candidate->'metadata'->>'service_id' is distinct from p_service_id
       or candidate->'metadata'->>'source' is distinct from 'service-billing'
       or base_key is null or base_key not like 'service-billing:' || p_service_id || ':%'
       or not exists(select 1 from public.profiles p where p.id=(candidate->>'user_id')::uuid
         and p.role in ('admin','super_admin') and p.is_active is not false and p.suspended is not true)
    then raise exception 'SERVICE_BILLING_INVALID'; end if;
    select n.* into prior from public.notifications n
      where n.metadata->>'source'='service-billing'
        and n.metadata->>'service_id'=p_service_id
        and (n.metadata->>'base_key'=base_key or n.idempotency_key=base_key)
      order by n.created_at desc,n.id desc limit 1;
    notice_key := case when prior.id is null then base_key
      when prior.metadata->>'resolved_at' is not null then base_key || ':after:' || prior.id::text
      else prior.idempotency_key end;
    candidate := candidate || jsonb_build_object('idempotency_key',notice_key,
      'episode_created_at',greatest(clock_timestamp(),coalesce(prior.created_at,'-infinity'::timestamptz)+interval '1 microsecond'),
      'metadata',(candidate->'metadata') || jsonb_build_object('base_key',base_key,'billing_revision',p_expected_revision));
    prepared := prepared || jsonb_build_array(candidate);
    active_keys := array_append(active_keys,notice_key);
  end loop;
  update public.notifications n set read=true,read_at=p_now,
    metadata=coalesce(n.metadata,'{}'::jsonb)||jsonb_build_object('resolved_at',p_now)
    where n.metadata->>'source'='service-billing' and n.metadata->>'service_id'=p_service_id
      and n.metadata->>'resolved_at' is null and not(n.idempotency_key=any(active_keys));
  for candidate in select value from jsonb_array_elements(prepared) loop
    insert into public.notifications as n(user_id,type,title,message,action_url,action_label,idempotency_key,metadata,created_at)
    values((candidate->>'user_id')::uuid,candidate->>'type',candidate->>'title',candidate->>'message',
      '/operations/infrastructure-costs#service-billing','Review service billing',candidate->>'idempotency_key',candidate->'metadata',(candidate->>'episode_created_at')::timestamptz)
    on conflict(idempotency_key) do nothing returning n.* into inserted;
    if found then
      id:=inserted.id; user_id:=inserted.user_id; title:=inserted.title;
      message:=inserted.message; metadata:=inserted.metadata; return next;
    end if;
  end loop;
end $$;
revoke all on function public.reconcile_service_billing_alerts(text,text,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.reconcile_service_billing_alerts(text,text,jsonb,timestamptz) to service_role;

-- Merge receipt fields inside the UPDATE, preserving concurrent resolved_at.
create or replace function public.record_service_billing_push_receipt(
  p_id uuid,p_user_id uuid,p_status text,p_devices integer,p_now timestamptz
) returns void language plpgsql security invoker set search_path = public,pg_temp as $$
begin
  if p_status not in ('accepted','unconfirmed','superseded') or p_devices < 0 then
    raise exception 'SERVICE_BILLING_INVALID'; end if;
  update public.notifications n set
    metadata=coalesce(n.metadata,'{}'::jsonb)||jsonb_build_object('push_status',p_status,
      'accepted_devices',p_devices,'push_attempted_at',p_now)||
      case when p_status='superseded' then jsonb_build_object('resolved_at',coalesce(n.metadata->>'resolved_at',p_now::text)) else '{}'::jsonb end,
    read=case when p_status='superseded' then true else n.read end,
    read_at=case when p_status='superseded' then coalesce(n.read_at,p_now) else n.read_at end
  where n.id=p_id and n.user_id=p_user_id and n.metadata->>'source'='service-billing';
end $$;
revoke all on function public.record_service_billing_push_receipt(uuid,uuid,text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.record_service_billing_push_receipt(uuid,uuid,text,integer,timestamptz) to service_role;
