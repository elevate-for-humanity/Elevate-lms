-- Isolated fixtures only; no actual phone numbers, recipients or provider calls.
do $$ begin
 if has_function_privilege('anon','public.claim_telnyx_call_event(uuid,uuid,text,text,timestamptz,jsonb,uuid)','execute')
 or has_function_privilege('authenticated','public.claim_telnyx_call_event(uuid,uuid,text,text,timestamptz,jsonb,uuid)','execute') then
  raise exception 'Client can claim carrier events'; end if;
 if (select prosecdef from pg_proc where oid='public.claim_telnyx_call_event(uuid,uuid,text,text,timestamptz,jsonb,uuid)'::regprocedure) then
  raise exception 'Claim must preserve invoker privileges'; end if;
end $$;
set role service_role;
do $$ declare
 system_id uuid := '11111111-1111-4111-8111-111111111111';
 token1 uuid := '22222222-2222-4222-8222-222222222222';
 token2 uuid := '33333333-3333-4333-8333-333333333333';
 claimed uuid;
 outcome text;
begin
 select event_id,claim_status into claimed,outcome from claim_telnyx_call_event(
   system_id,null,'fresh','call.hangup','2026-10-10T00:00:00Z','{}',token1);
 if outcome <> 'claimed' then raise exception 'First receipt not claimed'; end if;
 select claim_status into outcome from claim_telnyx_call_event(
   system_id,null,'fresh','call.hangup','2026-10-10T00:00:00Z','{}',token2);
 if outcome <> 'busy' then raise exception 'Concurrent claim executed twice'; end if;
 update phone_call_events set processing_state='failed' where id=claimed;
 select claim_status into outcome from claim_telnyx_call_event(
   system_id,null,'fresh','call.hangup','2026-10-10T00:00:00Z','{}',token2);
 if outcome <> 'claimed' then raise exception 'Known failed handler cannot retry'; end if;
 if not exists(select 1 from phone_call_events where id=claimed and processing_token=token2) then
   raise exception 'Retry replaced receipt or failed to fence old worker'; end if;
 update phone_call_events set processing_state='completed' where id=claimed;
 select claim_status into outcome from claim_telnyx_call_event(
   system_id,null,'fresh','call.hangup','2026-10-10T00:00:00Z','{}',token1);
 if outcome <> 'duplicate' then raise exception 'Completed event replayed'; end if;
 select claim_status into outcome from claim_telnyx_call_event(
   system_id,null,'fresh','call.hangup','2026-10-10T00:00:00Z','{"changed":true}',token1);
 if outcome <> 'conflict' then raise exception 'Mutated original event accepted'; end if;
 update phone_call_events set processing_state='processing',
   processing_started_at=now()-interval '16 minutes' where id=claimed;
 select claim_status into outcome from claim_telnyx_call_event(
   system_id,null,'fresh','call.hangup','2026-10-10T00:00:00Z','{}',token1);
 if outcome <> 'review_required' then raise exception 'Unknown worker outcome replayed'; end if;
 select claim_status into outcome from claim_telnyx_call_event(
   system_id,null,'historical','call.hangup','2026-10-01T00:00:00Z','{}',token1);
 if outcome <> 'duplicate' then raise exception 'Legacy receipt replayed'; end if;
 if (select processing_state from phone_call_events where provider_event_id='historical') <> 'legacy_received' then
   raise exception 'Historical receipt relabeled completed'; end if;
 if (select count(*) from phone_call_events) <> 2 then raise exception 'Event records removed/duplicated'; end if;
end $$;
reset role;
