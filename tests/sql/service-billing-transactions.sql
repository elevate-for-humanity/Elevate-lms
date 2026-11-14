-- Run after the migration, in a disposable DB or an explicit ROLLBACK transaction.
-- Every fixture and all resulting warnings are rolled back; never send pushes.
begin;
do $$
declare
  actor uuid; revision text; candidate jsonb; notice uuid; returned integer; resolved text;
begin
  select p.id into actor from public.profiles p where p.role in ('admin','super_admin')
    and p.is_active is not false and p.suspended is not true order by p.id limit 1;
  if actor is null then raise exception 'Test needs an existing active administrator'; end if;
  -- Fixture isolated by service ID and transaction; no real provider facts are asserted.
  insert into public.app_settings(key,value) values('service_billing:transaction-test','{"revision":"test-revision"}');
  candidate := jsonb_build_array(jsonb_build_object('user_id',actor,'type','warning',
    'title','ROLLBACK ONLY billing test','message','Transaction regression fixture',
    'idempotency_key','service-billing:transaction-test:critical:5:'||actor,
    'metadata',jsonb_build_object('source','service-billing','service_id','transaction-test','signal','critical','episode','5')));
  select count(*) into returned from public.reconcile_service_billing_alerts('transaction-test','test-revision',candidate,now());
  if returned<>1 then raise exception 'initial warning was not inserted'; end if;
  select n.id into notice from public.notifications n where n.idempotency_key=candidate->0->>'idempotency_key';
  select count(*) into returned from public.reconcile_service_billing_alerts('transaction-test','test-revision',candidate,now());
  if returned<>0 then raise exception 'identical poll duplicated warning'; end if;
  begin
    perform public.reconcile_service_billing_alerts('transaction-test','stale-revision','[]',now());
    raise exception 'stale revision unexpectedly accepted';
  exception when others then
    if sqlerrm<>'SERVICE_BILLING_CONFLICT' then raise; end if;
  end;
  if exists(select 1 from public.notifications n where n.id=notice and n.metadata ? 'resolved_at') then
    raise exception 'stale poll resolved current warning'; end if;
  perform public.reconcile_service_billing_alerts('transaction-test','test-revision','[]',now());
  select n.metadata->>'resolved_at' into resolved from public.notifications n where n.id=notice;
  if resolved is null then raise exception 'recovery was not preserved'; end if;
  perform public.record_service_billing_push_receipt(notice,actor,'accepted',1,now());
  if (select n.metadata->>'resolved_at' from public.notifications n where n.id=notice) is distinct from resolved then
    raise exception 'late push erased resolution'; end if;
  -- Accumulated history must not impose a lifetime limit on future warning episodes.
  insert into public.notifications(user_id,type,title,message,idempotency_key,metadata,read)
  select actor,'warning','ROLLBACK ONLY history','Regression fixture','service-billing:transaction-test:history:'||i,
    jsonb_build_object('source','service-billing','service_id','transaction-test','resolved_at',now()),true
  from generate_series(1,1100) i;
  select count(*) into returned from public.reconcile_service_billing_alerts('transaction-test','test-revision',candidate,now());
  if returned<>1 then raise exception 'retained history blocked recurrence'; end if;
  select count(*) into returned from public.reconcile_service_billing_alerts('transaction-test','test-revision',candidate,now());
  if returned<>0 then raise exception 'recurrence did not deduplicate with identical transaction timestamps'; end if;
  if has_function_privilege('authenticated','public.reconcile_service_billing_alerts(text,text,jsonb,timestamp with time zone)','execute')
    or has_function_privilege('anon','public.record_service_billing_push_receipt(uuid,uuid,text,integer,timestamp with time zone)','execute') then
    raise exception 'untrusted role can mutate billing alerts'; end if;
end $$;

rollback;
