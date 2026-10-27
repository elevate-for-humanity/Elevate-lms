-- Existing receipts do not prove completion. Never replay the historical ledger.
alter table public.phone_call_events
  add column processing_state text not null default 'legacy_received'
    check (processing_state in ('legacy_received','processing','completed','failed','review_required')),
  add column processing_token uuid,
  add column processing_started_at timestamptz,
  add column processing_finished_at timestamptz,
  add column processing_outcome_code text;

create function public.claim_telnyx_call_event(
  p_phone_system_id uuid, p_call_id uuid, p_event_id text, p_event_type text,
  p_occurred_at timestamptz, p_payload jsonb, p_token uuid
) returns table (event_id uuid, claim_status text)
language plpgsql security invoker set search_path = pg_catalog, public as $$
declare receipt public.phone_call_events%rowtype;
begin
  if p_token is null or p_phone_system_id is null or nullif(p_event_id,'') is null
     or nullif(p_event_type,'') is null or p_payload is null or p_occurred_at is null then
    raise exception 'Invalid event claim';
  end if;
  insert into public.phone_call_events (
    phone_system_id,call_id,provider,provider_event_id,event_type,occurred_at,payload,
    processing_state,processing_token,processing_started_at
  ) values (
    p_phone_system_id,p_call_id,'telnyx',p_event_id,p_event_type,p_occurred_at,p_payload,
    'processing',p_token,clock_timestamp()
  ) on conflict (provider,provider_event_id) do nothing returning * into receipt;
  if found then
    return query select receipt.id, 'claimed'::text;
    return;
  end if;
  select * into strict receipt from public.phone_call_events
    where provider='telnyx' and provider_event_id=p_event_id for update;
  -- Preserve original evidence even if a repeated ID has different contents.
  if receipt.phone_system_id is distinct from p_phone_system_id
     or receipt.event_type is distinct from p_event_type
     or receipt.occurred_at is distinct from p_occurred_at
     or receipt.payload is distinct from p_payload then
    return query select receipt.id, 'conflict'::text;
  elsif receipt.processing_state in ('completed','legacy_received') then
    return query select receipt.id, 'duplicate'::text;
  elsif receipt.processing_state='failed' then
    update public.phone_call_events set processing_state='processing',
      processing_token=p_token,processing_started_at=clock_timestamp(),
      processing_finished_at=null,processing_outcome_code=null where id=receipt.id;
    return query select receipt.id, 'claimed'::text;
  elsif receipt.processing_state='processing'
        and receipt.processing_started_at > clock_timestamp()-interval '15 minutes' then
    return query select receipt.id, 'busy'::text;
  else
    -- A disappeared worker has an unknown external outcome. Require reconciliation.
    update public.phone_call_events set processing_state='review_required',
      processing_outcome_code='processing_outcome_unknown' where id=receipt.id;
    return query select receipt.id, 'review_required'::text;
  end if;
end $$;
revoke all on function public.claim_telnyx_call_event(uuid,uuid,text,text,timestamptz,jsonb,uuid)
  from public,anon,authenticated;
grant execute on function public.claim_telnyx_call_event(uuid,uuid,text,text,timestamptz,jsonb,uuid)
  to service_role;
comment on column public.phone_call_events.processing_state is
  'Handler outcome only, not call quality or notification delivery. Historical receipts remain legacy_received.';
