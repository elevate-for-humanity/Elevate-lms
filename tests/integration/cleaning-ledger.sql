-- Run in a transaction after the migration; always roll back this synthetic QA data.
do $$
declare site uuid:='e0fcb1f1-33f8-4b2c-abeb-ec8e0a819231'; actor uuid; m uuid; inv uuid; period uuid; j1 uuid; j2 uuid; j3 uuid;
 lead1 uuid; lead2 uuid; provider1 uuid; provider2 uuid; offer1 uuid; offer2 uuid; job_invoice uuid; invoice3 uuid; offer3 uuid; delivery uuid; old_hash text; result jsonb; denied boolean; n integer;
 hash_a text:=encode(sha256(repeat('a',64)::bytea),'hex'); hash_b text:=encode(sha256(repeat('b',64)::bytea),'hex');
begin
 select user_id into actor from user_websites where id=site;
 if actor is null then raise exception 'QA owner is unavailable'; end if;
 insert into cleaning_memberships(website_id,user_id,email,name) values(site,actor,'cleaning-qa@example.invalid','OWNER QA ROLLBACK ONLY') returning id into m;
 insert into billing_invoices(provider,idempotency_key,customer_external_key,customer_email,total_cents,status,fulfillment_type,fulfillment_payload)
 values('quickbooks','cleaning-qa:'||m,'cleaning-qa:'||m,'cleaning-qa@example.invalid',1900,'open','cleaning_membership',jsonb_build_object('membership_id',m,'website_id',site)) returning id into inv;
 denied:=false; begin perform cleaning_activate_membership(inv); exception when others then denied:=true; end;
 if not denied then raise exception 'Unpaid invoice activated membership'; end if;
 update billing_invoices set status='paid',paid_at=now() where id=inv;
 update billing_invoices set fulfillment_payload=fulfillment_payload-'website_id' where id=inv;
 denied:=false;begin perform cleaning_activate_membership(inv);exception when others then denied:=true;end;
 if not denied then raise exception 'Missing membership website scope accepted';end if;
 update billing_invoices set fulfillment_payload=fulfillment_payload||jsonb_build_object('website_id',site) where id=inv;
 period:=cleaning_activate_membership(inv); perform cleaning_activate_membership(inv);
 select count(*) into n from cleaning_member_periods where membership_id=m;
 if n<>1 then raise exception 'Duplicate payment extended membership'; end if;
 if not exists(select 1 from billing_schedules where canonical_product_key='cleaning-member:'||m and collection_mode='manual_invoice' and collection_provider='none') then raise exception 'Incorrect collection mode'; end if;
 insert into cleaning_jobs(website_id,customer_id,request_key,customer_email,customer_name,service,zip,starts_at,private_details)
 values(site,actor,gen_random_uuid(),'cleaning-qa@example.invalid','QA Customer','standard','46204',now()+interval '7 days','PRIVATE QA ADDRESS DO NOT SHARE') returning id into j1;
 insert into cleaning_jobs(website_id,customer_id,request_key,customer_email,customer_name,service,zip,starts_at,private_details)
 values(site,actor,gen_random_uuid(),'cleaning-qa@example.invalid','QA Customer','standard','46204',now()+interval '7 days','PRIVATE QA ADDRESS DO NOT SHARE') returning id into j2;
 result:=cleaning_quote_job(j1,site,10000,3,'QA standard cleaning scope; no customer details');
 if (result->>'discount_cents')::integer<>4000 or (result->>'provider_pay_cents')::integer<>30000 then raise exception 'First quote economics wrong'; end if;
 result:=cleaning_quote_job(j2,site,10000,3,'QA second standard cleaning scope');
 if (result->>'discount_cents')::integer<>1000 then raise exception 'Monthly cap exceeded'; end if;
 perform cleaning_cancel_job(j2,site);
 insert into cleaning_jobs(website_id,customer_id,request_key,customer_email,customer_name,service,zip,starts_at,private_details)
 values(site,actor,gen_random_uuid(),'cleaning-qa@example.invalid','QA Customer','standard','46204',now()+interval '7 days','PRIVATE QA ADDRESS DO NOT SHARE') returning id into j3;
 result:=cleaning_quote_job(j3,site,10000,3,'QA third standard cleaning scope');
 if (result->>'discount_cents')::integer<>1000 then raise exception 'Cancelled reservation not released'; end if;
 insert into billing_invoices(provider,idempotency_key,customer_external_key,customer_email,total_cents,status,paid_at,fulfillment_type,fulfillment_payload)
 values('quickbooks','cleaning-job-qa:'||j1,'cleaning-qa:'||m,'cleaning-qa@example.invalid',36000,'paid',now(),'cleaning_job',jsonb_build_object('job_id',j1,'website_id',site)) returning id into job_invoice;
 update billing_invoices set fulfillment_payload=fulfillment_payload-'website_id' where id=job_invoice;
 denied:=false;begin perform cleaning_mark_job_paid(job_invoice);exception when others then denied:=true;end;
 if not denied then raise exception 'Missing job website scope accepted';end if;
 update billing_invoices set fulfillment_payload=fulfillment_payload||jsonb_build_object('website_id',site) where id=job_invoice;
 perform cleaning_mark_job_paid(job_invoice); perform cleaning_mark_job_paid(job_invoice);
 if not exists(select 1 from cleaning_discount_ledger where job_id=j1 and status='consumed') then raise exception 'Paid discount not consumed'; end if;
 insert into tenant_site_leads(website_id,user_id,name,email,message,source_path,status)
 values(site,actor,'OWNER QA ROLLBACK PROVIDER ONE','qa-provider-one@example.invalid','Synthetic rollback test; not a real applicant.','/owner-check','test') returning id into lead1;
 insert into tenant_site_leads(website_id,user_id,name,email,message,source_path,status)
 values(site,actor,'OWNER QA ROLLBACK PROVIDER TWO','qa-provider-two@example.invalid','Synthetic rollback test; not a real applicant.','/owner-check','test') returning id into lead2;
 insert into cleaning_providers(website_id,lead_id,name,email,hourly_cents,zips,services,opted_in,eligibility,review_note,reviewed_by,reviewed_at)
 values(site,lead1,'QA Provider One','qa-provider-one@example.invalid',3000,array['46204'],array['standard'],true,'eligible','QA synthetic evidence only',actor,now()) returning id into provider1;
 insert into cleaning_providers(website_id,lead_id,name,email,hourly_cents,zips,services,opted_in,eligibility,review_note,reviewed_by,reviewed_at)
 values(site,lead2,'QA Provider Two','qa-provider-two@example.invalid',3000,array['46204'],array['standard'],true,'eligible','QA synthetic evidence only',actor,now()) returning id into provider2;
 perform cleaning_queue_offer(j1,provider1,hash_a,repeat('a',64));perform cleaning_queue_offer(j1,provider1,hash_a,repeat('a',64));perform cleaning_queue_offer(j1,provider2,hash_b,repeat('b',64));
 select count(*) into n from cleaning_offers where job_id=j1;
 if n<>2 then raise exception 'Duplicate dispatch offers'; end if;
 select id into offer1 from cleaning_offers where job_id=j1 and provider_id=provider1;
 select id into offer2 from cleaning_offers where job_id=j1 and provider_id=provider2;
 select id into delivery from cleaning_outbox where offer_id=offer1;
 update cleaning_outbox set status='unknown' where id=delivery;
 old_hash:=hash_a;hash_a:=encode(sha256(repeat('c',64)::bytea),'hex');
 perform cleaning_reissue_delivery(delivery,actor,'QA delivery logs checked; replacement approved',repeat('c',64),hash_a);
 denied:=false;begin perform cleaning_accept_offer(offer1,site,old_hash);exception when others then denied:=true;end;
 if not denied then raise exception 'Reissued offer retained old capability';end if;
 denied:=false;begin perform cleaning_accept_offer(offer1,gen_random_uuid(),hash_a);exception when others then denied:=true;end;
 if not denied then raise exception 'Cross-tenant capability accepted';end if;
 denied:=false;begin perform cleaning_accept_offer(offer1,site,hash_b);exception when others then denied:=true;end;
 if not denied then raise exception 'Tampered capability accepted';end if;
 update cleaning_providers set eligibility='suspended' where id=provider1;
 denied:=false;begin perform cleaning_accept_offer(offer1,site,hash_a);exception when others then denied:=true;end;
 if not denied then raise exception 'Suspended provider accepted';end if;
 update cleaning_providers set eligibility='eligible' where id=provider1;
 update cleaning_offers set expires_at=now()-interval '1 second' where id=offer1;
 denied:=false;begin perform cleaning_accept_offer(offer1,site,hash_a);exception when others then denied:=true;end;
 if not denied then raise exception 'Expired offer accepted';end if;
 update cleaning_offers set expires_at=now()+interval '1 day' where id=offer1;
 result:=cleaning_accept_offer(offer1,site,hash_a);
 if result->>'private_details'<>'PRIVATE QA ADDRESS DO NOT SHARE' then raise exception 'Assigned provider did not receive private instructions';end if;
 denied:=false;begin perform cleaning_accept_offer(offer2,site,hash_b);exception when others then denied:=true;end;
 if not denied then raise exception 'Two providers assigned to one job';end if;
 insert into billing_invoices(provider,idempotency_key,customer_external_key,customer_email,total_cents,status,paid_at,fulfillment_type,fulfillment_payload)
 values('quickbooks','cleaning-job-qa:'||j3,'cleaning-qa:'||m,'cleaning-qa@example.invalid',39000,'paid',now(),'cleaning_job',jsonb_build_object('job_id',j3,'website_id',site)) returning id into invoice3;
 perform cleaning_mark_job_paid(invoice3);perform cleaning_queue_offer(j3,provider1,hash_b,repeat('b',64));
 select id into offer3 from cleaning_offers where job_id=j3 and provider_id=provider1;
 denied:=false;begin perform cleaning_accept_offer(offer3,site,hash_b);exception when others then denied:=true;end;
 if not denied then raise exception 'Provider double booked';end if;
 perform cleaning_complete_job(j1,site,'QA completion evidence only');perform cleaning_complete_job(j1,site,'QA completion evidence repeated');
 select count(*) into n from cleaning_job_accounts where job_id=j1;
 if n<>1 or not exists(select 1 from cleaning_job_accounts where job_id=j1 and collected_cents=36000 and provider_payable_cents=30000 and platform_gross_cents=6000 and discount_cents=4000) then raise exception 'Accounting does not reconcile';end if;
 perform cleaning_cancel_membership(m,actor);
 if exists(select 1 from billing_schedules where canonical_product_key='cleaning-member:'||m and status='active') then raise exception 'Cancellation left active renewal';end if;
 if not exists(select 1 from cleaning_member_periods where id=period and ends_at>now()) then raise exception 'Cancellation removed paid benefits';end if;
 if has_table_privilege('anon','public.cleaning_jobs','SELECT') or has_table_privilege('authenticated','public.cleaning_member_periods','UPDATE') or has_function_privilege('anon','public.cleaning_accept_offer(uuid,uuid,text)','EXECUTE') then raise exception 'Cleaning data or RPC exposed';end if;
end $$;
select 'cleaning ledger QA passed; all synthetic records rolled back' as verification;
