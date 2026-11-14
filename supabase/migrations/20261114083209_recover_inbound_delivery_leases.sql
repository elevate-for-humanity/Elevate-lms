-- Retry signed inbound deliveries without deleting or rewriting their audit trail.
-- Other providers retain their existing lifecycle. Only service_role calls these RPCs.
alter table public.webhook_events_processed
  add column if not exists lease_token uuid,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists attempt_history jsonb not null default '[]'::jsonb,
  add column if not exists forward_started_at timestamptz;

create or replace function public.webhook_event_lifecycle_guard()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public as $fn$
declare transition text[]; valid_transitions text[][] := array[
 ['received','validated'],['received','processing'],['received','processed'],['received','errored'],['received','skipped'],
 ['validated','processing'],['validated','processed'],['validated','errored'],
 ['processing','processed'],['processing','errored'],['processing','failed']
];
begin
 if tg_op = 'DELETE' then raise exception 'webhook_events_processed is append-only. DELETE blocked.'; end if;
 if old.provider='sendgrid-inbound' and new.provider=old.provider
 and new.id=old.id and new.event_id=old.event_id and new.event_type=old.event_type
 and new.received_at=old.received_at and new.metadata is not distinct from old.metadata then
  -- A lease takeover must append the exact prior receipt and rotate its owner.
  if new.status='processing' and old.status in ('processing','errored')
   and new.lease_token is not null and new.lease_token is distinct from old.lease_token
   and new.lease_expires_at>clock_timestamp() and new.attempt_count=old.attempt_count+1
   and new.attempt_history=old.attempt_history||jsonb_build_array(jsonb_build_object(
     'status',old.status,'error',old.error_message,'processed_at',old.processed_at,'lease_token',old.lease_token))
   and new.forward_started_at is null
   and (old.event_type<>'email.forward' or old.forward_started_at is null)
   and (old.status='errored' or coalesce(old.lease_expires_at,old.received_at+interval '5 minutes')<=clock_timestamp())
  then return new; end if;
  -- Persist the irreversible-send barrier before making the external request.
  if old.status='processing' and new.status='processing' and old.event_type='email.forward'
   and old.forward_started_at is null and new.forward_started_at is not null
   and old.lease_expires_at>clock_timestamp()
   and (to_jsonb(new)-'forward_started_at')=(to_jsonb(old)-'forward_started_at')
  then return new; end if;
 end if;
 foreach transition slice 1 in array valid_transitions loop
  if old.status=transition[1] and new.status=transition[2] then return new; end if;
 end loop;
 raise exception 'Invalid status transition: % -> %',old.status,new.status;
end $fn$;

create or replace function public.claim_inbound_webhook_event(
 p_event_id text,p_event_type text,p_metadata jsonb,p_token uuid
) returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $fn$
declare receipt public.webhook_events_processed%rowtype; inserted integer;
begin
 if p_token is null or p_event_id is null or length(p_event_id)>256
 or p_event_type not in ('email.received','email.forward') then raise exception 'Invalid inbound claim'; end if;
 insert into public.webhook_events_processed(event_id,provider,event_type,status,metadata,lease_token,lease_expires_at,attempt_count)
 values(p_event_id,'sendgrid-inbound',p_event_type,'processing',coalesce(p_metadata,'{}'),p_token,clock_timestamp()+interval '2 minutes',1)
 on conflict(provider,event_id) do nothing;
 get diagnostics inserted=row_count;
 if inserted=1 then return jsonb_build_object('state','claimed','leaseToken',p_token); end if;
 select * into receipt from public.webhook_events_processed
 where provider='sendgrid-inbound' and event_id=p_event_id for update;
 if receipt.event_type<>p_event_type then raise exception 'Inbound claim identity mismatch'; end if;
 if receipt.status in ('processed','skipped') then return jsonb_build_object('state','duplicate'); end if;
 if receipt.event_type='email.forward' and receipt.forward_started_at is not null
 then return jsonb_build_object('state','uncertain'); end if;
 if receipt.status not in ('processing','errored')
 or (receipt.status='processing' and coalesce(receipt.lease_expires_at,receipt.received_at+interval '5 minutes')>clock_timestamp())
 then return jsonb_build_object('state','busy'); end if;
 update public.webhook_events_processed set status='processing',lease_token=p_token,
 lease_expires_at=clock_timestamp()+interval '2 minutes',attempt_count=receipt.attempt_count+1,
 attempt_history=receipt.attempt_history||jsonb_build_array(jsonb_build_object(
 'status',receipt.status,'error',receipt.error_message,'processed_at',receipt.processed_at,'lease_token',receipt.lease_token)),
 processed_at=null,error_message=null
 where id=receipt.id;
 return jsonb_build_object('state','claimed','leaseToken',p_token);
end $fn$;

create or replace function public.begin_inbound_webhook_forward(p_event_id text,p_token uuid)
returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $fn$
declare affected integer;
begin
 update public.webhook_events_processed set forward_started_at=clock_timestamp()
 where provider='sendgrid-inbound' and event_id=p_event_id and event_type='email.forward'
 and status='processing' and lease_token=p_token and lease_expires_at>clock_timestamp() and forward_started_at is null;
 get diagnostics affected=row_count;
 return affected=1;
end $fn$;

create or replace function public.finish_inbound_webhook_event(
 p_event_id text,p_token uuid,p_status text,p_error text default null,p_retry_safe boolean default false
) returns boolean language plpgsql security invoker set search_path=pg_catalog,public as $fn$
declare affected integer;
begin
 if p_status not in ('processed','skipped','errored') then raise exception 'Invalid inbound final status'; end if;
 update public.webhook_events_processed set status=p_status,processed_at=clock_timestamp(),error_message=p_error,
 forward_started_at=case when event_type='email.forward' and p_status='errored' and p_retry_safe then null else forward_started_at end
 where provider='sendgrid-inbound' and event_id=p_event_id and status='processing'
 and lease_token=p_token and lease_expires_at>clock_timestamp();
 get diagnostics affected=row_count;
 return affected=1;
end $fn$;

revoke all on function public.claim_inbound_webhook_event(text,text,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.begin_inbound_webhook_forward(text,uuid) from public,anon,authenticated;
revoke all on function public.finish_inbound_webhook_event(text,uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.claim_inbound_webhook_event(text,text,jsonb,uuid) to service_role;
grant execute on function public.begin_inbound_webhook_forward(text,uuid) to service_role;
grant execute on function public.finish_inbound_webhook_event(text,uuid,text,text,boolean) to service_role;
