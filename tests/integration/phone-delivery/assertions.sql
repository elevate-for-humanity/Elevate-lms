-- Assertions follow the two repair migrations in the isolated fixture database.
do $$ begin
 if not (select review_required from notification_outbox where to_email='backlog@example.invalid') then
  raise exception 'Existing backlog must be held'; end if;
 if has_function_privilege('anon','public.claim_notification_outbox(uuid,integer)','execute')
 or has_function_privilege('authenticated','public.claim_notification_outbox(uuid,integer)','execute') then
  raise exception 'Unprivileged roles can claim'; end if;
 if (select prosecdef from pg_proc where oid='public.claim_notification_outbox(uuid,integer)'::regprocedure) then
  raise exception 'Claim must preserve invoker privileges'; end if;
end $$;
insert into phone_webrtc_devices(profile_id,extension_id,device_id,last_seen_at)
values ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','same-device',null);
insert into phone_webrtc_devices(profile_id,extension_id,device_id,provider,last_seen_at)
values ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','asterisk_same-device','asterisk',null);
insert into notification_outbox(to_email,template_key,created_at,scheduled_for) values
 ('fresh@example.invalid','enrollment_welcome',now()-interval '1 hour',now()-interval '1 hour'),
 ('fresh@example.invalid','enrollment_welcome',now(),now()),
 ('stale@example.invalid','enrollment_welcome',now()-interval '2 days',now()-interval '2 days'),
 ('portal@example.invalid','portal_completion_reminder',now(),now()),
 ('future@example.invalid','enrollment_welcome',now(),now()+interval '1 day');
set role service_role;
do $$ declare n int; begin
 select count(*) into n from claim_notification_outbox('33333333-3333-4333-8333-333333333333',4);
 if n <> 1 then raise exception 'Expected one eligible unique notification, received %',n; end if;
 select count(*) into n from claim_notification_outbox('44444444-4444-4444-8444-444444444444',4);
 if n <> 0 then raise exception 'A second claim picked a duplicate/ineligible row'; end if;
end $$;
reset role;
do $$ begin
 if (select count(*) from notification_outbox where review_required) <> 4 then
  raise exception 'Backlog, stale, duplicate and unverified portal reminders must be held'; end if;
 if (select count(*) from phone_webrtc_devices where connection_state='disconnected' and last_seen_at is null) <> 2 then
  raise exception 'Issuance manufactured presence or removed carrier records'; end if;
end $$;

-- Recording locations/assignments cannot be rewritten using a user's JWT.
do $$ begin
 if has_column_privilege('authenticated','public.voicemails','recording_url','update')
    or has_column_privilege('authenticated','public.phone_callback_tasks','assigned_profile_id','update') then
  raise exception 'Phone recording authority is mutable by client';
 end if;
 if not has_column_privilege('authenticated','public.voicemails','is_read','update') then
  raise exception 'Read-state update permission lost';
 end if;
 if has_table_privilege('authenticated','public.phone_notification_deliveries','insert') then
  raise exception 'Client can fabricate notification evidence';
 end if;
 if not exists (select 1 from pg_class where oid='public.phone_notification_deliveries'::regclass and relrowsecurity) then
  raise exception 'Delivery evidence RLS is disabled';
 end if;
end $$;
