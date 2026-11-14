create unique index if not exists platform_integrations_runtime_identity
on public.platform_integrations(provider,integration_type) where tenant_id is null;
create unique index if not exists integration_configs_runtime_key
on public.integration_configs(integration_key);

create or replace function public.record_runtime_integration_probe(
 p_provider text,p_component text,p_configured boolean,p_authenticated boolean,
 p_reason text,p_commit text default null
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare observed_at timestamptz:=clock_timestamp(); receipt jsonb;
begin
 if p_component not in ('marketing','admin','lms','store','ultimate-worker') or
 p_provider not in ('sezzle','affirm','jotform','calendly','resend','sendgrid-inbound','supabase','quickbooks','google','teams','zoom','paypal','twilio','backblaze-b2','paris','course-builder-workers','google-cloud','pbx-asterisk','livekit','student-enrollment-delivery') or
 p_reason !~ '^[a-z_]{1,80}$' or p_configured is null or p_authenticated is null or
 (p_authenticated and not p_configured) or (p_commit is not null and p_commit !~ '^[a-f0-9]{40}$') then
 raise exception 'INVALID_INTEGRATION_PROBE'; end if;
 receipt:=jsonb_build_object('component',p_component,'configured',p_configured,
 'authenticated',p_authenticated,'reason',p_reason,'checked_at',observed_at,
 'commit',p_commit,'delivery_verified',false);
 insert into public.platform_integrations(integration_name,integration_type,provider,status,is_enabled,config,metadata,updated_at)
 values(p_provider,p_component,p_provider,case when p_authenticated then 'connected' when p_configured then 'testing' else 'disconnected' end,
 p_configured,jsonb_build_object('source','runtime_secret_store'),receipt,observed_at)
 on conflict(provider,integration_type) where tenant_id is null do update set
 status=excluded.status,is_enabled=excluded.is_enabled,config=excluded.config,metadata=excluded.metadata,updated_at=excluded.updated_at;
 insert into public.integration_configs(integration_key,config,enabled,updated_at)
 values(p_component||':'||p_provider,jsonb_build_object('source','runtime_secret_store','configured',p_configured),p_configured,observed_at)
 on conflict(integration_key) do update set config=excluded.config,enabled=excluded.enabled,updated_at=excluded.updated_at;
 insert into public.integration_sync_log(provider,action,status,records,created_at)
 values(p_provider,'connection_probe',case when p_authenticated then 'verified' else 'unverified' end,receipt,observed_at);
end $$;
revoke all on function public.record_runtime_integration_probe(text,text,boolean,boolean,text,text) from public,anon,authenticated;
grant execute on function public.record_runtime_integration_probe(text,text,boolean,boolean,text,text) to service_role;

update public.platform_services set provider='google-cloud', status='unknown',last_health_check=null,updated_at=now(),
 metadata=coalesce(metadata,'{}'::jsonb)||'{"deployment_verification_required":true}'::jsonb
where provider='northflank';
update public.platform_services set status='unknown',updated_at=now() where last_health_check is null and status='healthy';
update public.platform_services set url=case service_name
 when 'Admin Portal' then 'https://admin.elevateforhumanity.org/api/health'
 when 'Elevate Website' then 'https://www.elevateforhumanity.org/api/health'
 when 'API Routes' then 'https://www.elevateforhumanity.org/api/health'
 when 'LMS Portal' then 'https://app.elevateforhumanity.org/api/health'
 when 'Student Portal' then 'https://app.elevateforhumanity.org/api/health'
 when 'Employer Portal' then 'https://app.elevateforhumanity.org/api/health'
 else url end where tenant_id is null;

create or replace function public.record_sendgrid_delivery_event(
 p_log_id uuid,p_event_id text,p_message_id text,p_event text,p_occurred_at timestamptz
) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare current_status text; new_status text; priorities jsonb:='{"queued":0,"sent":1,"accepted":1,"processed":2,"deferred":2,"delivered":3,"opened":4,"clicked":5,"bounced":6,"dropped":6,"spamreport":6,"unsubscribe":6}'::jsonb;
begin
 if p_event_id is null or length(p_event_id) not between 1 and 512 or
 p_event not in ('processed','deferred','delivered','open','click','bounce','dropped','spamreport','unsubscribe') or
 p_occurred_at is null or p_occurred_at>now()+interval '5 minutes' then raise exception 'INVALID_DELIVERY_EVENT'; end if;
 select status into current_status from public.email_logs where id=p_log_id for update;
 if not found then return false; end if;
 new_status:=case p_event when 'open' then 'opened' when 'click' then 'clicked' when 'bounce' then 'bounced' else p_event end;
 insert into public.email_delivery_events(email_log_id,provider,provider_event_id,provider_message_id,event_type,occurred_at,payload)
 values(p_log_id,'sendgrid',p_event_id,p_message_id,p_event,p_occurred_at,'{}'::jsonb)
 on conflict(provider_event_id) where provider_event_id is not null do nothing;
 if not found then return true; end if;
 update public.email_logs set
 status=case when coalesce((priorities->>new_status)::int,0)>=coalesce((priorities->>current_status)::int,0) then new_status else status end,
 metadata=coalesce(metadata,'{}'::jsonb)||case when p_event='delivered' then jsonb_build_object('delivered_at',p_occurred_at) else '{}'::jsonb end,
 updated_at=now()
 where id=p_log_id;
 return true;
end $$;
revoke all on function public.record_sendgrid_delivery_event(uuid,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.record_sendgrid_delivery_event(uuid,text,text,text,timestamptz) to service_role;

create or replace function public.rotate_quickbooks_authorization(
 p_expected_refresh text,p_realm text,p_access text,p_refresh text
) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if coalesce(p_expected_refresh,'')='' or coalesce(p_access,'')='' or coalesce(p_refresh,'')='' or coalesce(p_realm,'')='' then raise exception 'INVALID_TOKEN_ROTATION'; end if;
 perform pg_advisory_xact_lock(hashtext('quickbooks-token-rotation'));
 perform 1 from public.app_settings where key='QB_REFRESH_TOKEN' and value=p_expected_refresh for update;
 if not found then return false; end if;
 if exists(select 1 from public.app_settings where key='QB_REALM_ID' and value<>p_realm) then return false; end if;
 insert into public.app_settings(key,value,updated_at) values
 ('QB_ACCESS_TOKEN',p_access,now()),('QB_REFRESH_TOKEN',p_refresh,now())
 on conflict(key) do update set value=excluded.value,updated_at=excluded.updated_at;
 return true;
end $$;
revoke all on function public.rotate_quickbooks_authorization(text,text,text,text) from public,anon,authenticated;
grant execute on function public.rotate_quickbooks_authorization(text,text,text,text) to service_role;
