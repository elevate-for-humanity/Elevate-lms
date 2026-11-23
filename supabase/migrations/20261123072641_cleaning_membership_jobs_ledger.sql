-- Cleaning commerce is server-owned. Browser users never receive direct table or RPC access.
create table public.cleaning_memberships (
 id uuid primary key default gen_random_uuid(), website_id uuid not null references public.user_websites(id),
 user_id uuid not null references auth.users(id), email text not null, name text not null,
 canceled_at timestamptz, consent_at timestamptz not null default now(), created_at timestamptz not null default now(),
 unique(website_id,user_id)
);
create table public.cleaning_member_periods (
 id uuid primary key default gen_random_uuid(), membership_id uuid not null references public.cleaning_memberships(id),
 invoice_id uuid not null unique references public.billing_invoices(id), starts_at timestamptz not null, ends_at timestamptz not null,
 check(ends_at>starts_at)
);
create table public.cleaning_providers (
 id uuid primary key default gen_random_uuid(), website_id uuid not null references public.user_websites(id),
 lead_id uuid not null unique references public.tenant_site_leads(id), name text not null, email text not null,
 hourly_cents integer not null check(hourly_cents between 1500 and 20000),
 zips text[] not null, services text[] not null, opted_in boolean not null default false,
 eligibility text not null default 'pending' check(eligibility in ('pending','eligible','suspended')),
 review_note text not null default '', reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 check(eligibility<>'eligible' or (reviewed_by is not null and reviewed_at is not null and length(review_note)>0)),
 unique(website_id,email)
);
create table public.cleaning_jobs (
 id uuid primary key default gen_random_uuid(), website_id uuid not null references public.user_websites(id),
 customer_id uuid not null references auth.users(id), request_key uuid not null, customer_email text not null, customer_name text not null,
 service text not null, zip text not null check(zip ~ '^\d{5}$'), starts_at timestamptz not null,
 private_details text not null, summary text, cleaner_hours numeric(7,2), duration_hours numeric(7,2), hourly_cents integer,
 provider_pay_cents integer, base_cents integer, discount_cents integer not null default 0,
 customer_cents integer, period_id uuid references public.cleaning_member_periods(id), quote_expires_at timestamptz,
 status text not null default 'requested' check(status in ('requested','quoted','offered','assigned','completed','cancelled','refund_review')),
 invoice_id uuid unique references public.billing_invoices(id), provider_id uuid references public.cleaning_providers(id),
 created_at timestamptz not null default now(), completion_note text,
 unique(website_id,customer_id,request_key),
 check(discount_cents>=0), check(customer_cents is null or customer_cents=base_cents-discount_cents),
 check(base_cents is null or (base_cents>=provider_pay_cents and customer_cents>=provider_pay_cents))
);
create table public.cleaning_discount_ledger (
 job_id uuid primary key references public.cleaning_jobs(id), period_id uuid not null references public.cleaning_member_periods(id),
 amount_cents integer not null check(amount_cents between 0 and 5000),
 status text not null check(status in ('reserved','consumed','released')), created_at timestamptz not null default now()
);
create table public.cleaning_offers (
 id uuid primary key default gen_random_uuid(), website_id uuid not null references public.user_websites(id),
 job_id uuid not null references public.cleaning_jobs(id), provider_id uuid not null references public.cleaning_providers(id),
 token_hash text not null check(token_hash ~ '^[a-f0-9]{64}$'), expires_at timestamptz not null,
 status text not null default 'open' check(status in ('open','accepted','withdrawn')), unique(job_id,provider_id)
);
create table public.cleaning_outbox (
 id uuid primary key default gen_random_uuid(), website_id uuid not null references public.user_websites(id),
 job_id uuid not null references public.cleaning_jobs(id), kind text not null check(kind in ('request','quote','offer','assigned_customer','assigned_operator')),
 dedupe_key text not null unique, offer_id uuid references public.cleaning_offers(id), capability text,
 status text not null default 'pending' check(status in ('pending','sending','sent','unknown','suppressed')),
 attempted_at timestamptz, sent_at timestamptz, error text, created_at timestamptz not null default now()
);
create table public.cleaning_job_accounts (
 job_id uuid primary key references public.cleaning_jobs(id), invoice_id uuid not null unique references public.billing_invoices(id),
 provider_id uuid not null references public.cleaning_providers(id), collected_cents integer not null,
 provider_payable_cents integer not null, discount_cents integer not null, platform_gross_cents integer not null,
 status text not null default 'owed' check(status in ('owed','paid','refund_review')), payment_reference text,
 created_at timestamptz not null default now(), check(collected_cents=provider_payable_cents+platform_gross_cents)
);
create index cleaning_jobs_site_status on public.cleaning_jobs(website_id,status,created_at);
create index cleaning_periods_member_time on public.cleaning_member_periods(membership_id,ends_at);
create index cleaning_ledger_period on public.cleaning_discount_ledger(period_id,status);
create index cleaning_outbox_pending on public.cleaning_outbox(status,created_at);
create index cleaning_offers_site on public.cleaning_offers(website_id,job_id);
create index cleaning_providers_site on public.cleaning_providers(website_id,eligibility);

do $$ declare t text; begin
 foreach t in array array['cleaning_memberships','cleaning_member_periods','cleaning_providers','cleaning_jobs','cleaning_discount_ledger','cleaning_offers','cleaning_outbox','cleaning_job_accounts'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on table public.%I from anon, authenticated',t);
 execute format('grant all on table public.%I to service_role',t);
 end loop;
end $$;

create function public.cleaning_activate_membership(p_invoice_id uuid) returns uuid language plpgsql security invoker set search_path=public as $$
declare i billing_invoices; m cleaning_memberships; existing_id uuid; start_time timestamptz; end_time timestamptz; result_id uuid;
begin
 select * into i from billing_invoices where id=p_invoice_id for update;
 if i.id is null or i.status<>'paid' or i.fulfillment_type<>'cleaning_membership' or i.total_cents<>1900 or lower(i.currency)<>'usd' or i.paid_at is null or i.paid_at>now()+interval '5 minutes' then raise exception 'Verified membership payment required'; end if;
 select * into m from cleaning_memberships where id=(i.fulfillment_payload->>'membership_id')::uuid for update;
 if m.id is null or lower(m.email)<>lower(i.customer_email) or m.website_id::text<>i.fulfillment_payload->>'website_id' then raise exception 'Membership invoice mismatch'; end if;
 select id into existing_id from cleaning_member_periods where invoice_id=i.id;
 if existing_id is not null then return existing_id; end if;
 select greatest(i.paid_at,coalesce(max(ends_at),i.paid_at)) into start_time from cleaning_member_periods where membership_id=m.id;
 end_time:=start_time+interval '1 month';
 insert into cleaning_member_periods(membership_id,invoice_id,starts_at,ends_at) values(m.id,i.id,start_time,end_time) returning id into result_id;
 if m.canceled_at is null then
 insert into billing_schedules(customer_external_key,customer_name,customer_email,canonical_product_key,product_name,product_description,provider,amount_cents,cadence,next_invoice_date,status,collection_mode,collection_provider,fulfillment_type,fulfillment_payload)
 values('cleaning-member:'||m.id,m.name,m.email,'cleaning-member:'||m.id,'Platinum Cleaning Membership','Monthly membership; cleaning separate; 10% eligible savings capped at $50 per paid month.','quickbooks',1900,'monthly',end_time::date,'active','manual_invoice','none','cleaning_membership',jsonb_build_object('membership_id',m.id,'website_id',m.website_id))
 on conflict(provider,customer_external_key,canonical_product_key) do update set next_invoice_date=greatest(billing_schedules.next_invoice_date,excluded.next_invoice_date),status='active',updated_at=now();
 end if;
 return result_id;
end $$;

create function public.cleaning_cancel_membership(p_membership_id uuid,p_user_id uuid) returns void language plpgsql security invoker set search_path=public as $$
begin
 perform id from cleaning_memberships where id=p_membership_id and user_id=p_user_id for update;
 if not found then raise exception 'Membership not found'; end if;
 update cleaning_memberships set canceled_at=coalesce(canceled_at,now()) where id=p_membership_id;
 update billing_schedules set status='canceled',updated_at=now() where provider='quickbooks' and canonical_product_key='cleaning-member:'||p_membership_id;
end $$;

-- Serialize reservations on the paid period, so concurrent quotes cannot exceed the monthly cap.
create function public.cleaning_quote_job(p_job_id uuid,p_website_id uuid,p_hourly_cents integer,p_hours numeric,p_summary text,p_duration_hours numeric default null) returns jsonb language plpgsql security invoker set search_path=public as $$
declare j cleaning_jobs; p cleaning_member_periods; used integer; base integer; pay integer; savings integer:=0; expiry timestamptz;
begin
 select * into j from cleaning_jobs where id=p_job_id and website_id=p_website_id for update;
 if j.id is null or j.status<>'requested' then raise exception 'Only a new request can be quoted'; end if;
 if p_hourly_cents is null or p_hourly_cents not between 1500 and 20000 or p_hours is null or p_hours not between 2 and 200 or p_hours*4<>trunc(p_hours*4) or length(p_summary) not between 5 and 1000 then raise exception 'Invalid job price or summary'; end if;
 p_duration_hours:=coalesce(p_duration_hours,p_hours);
 if p_duration_hours<0.25 or p_duration_hours>p_hours or p_duration_hours*4<>trunc(p_duration_hours*4) then raise exception 'Invalid elapsed duration'; end if;
 if j.starts_at<=now()+interval '2 hours' then raise exception 'Job start must allow time to confirm a provider'; end if;
 pay:=round(p_hourly_cents*p_hours); base:=ceil(pay/0.75); expiry:=least(now()+interval '48 hours',j.starts_at-interval '1 hour');
 select cp.* into p from cleaning_member_periods cp join cleaning_memberships cm on cm.id=cp.membership_id join billing_invoices bi on bi.id=cp.invoice_id
 where cm.website_id=j.website_id and cm.user_id=j.customer_id and bi.status='paid' and cp.starts_at<=now() and cp.ends_at>now()
 order by cp.ends_at desc limit 1 for update of cp;
 if p.id is not null then
 select coalesce(sum(amount_cents),0) into used from cleaning_discount_ledger where period_id=p.id and status in ('reserved','consumed');
 savings:=least(floor(base*0.10),greatest(0,5000-used)); expiry:=least(expiry,p.ends_at);
 insert into cleaning_discount_ledger(job_id,period_id,amount_cents,status) values(j.id,p.id,savings,'reserved');
 end if;
 update cleaning_jobs set status='quoted',summary=p_summary,hourly_cents=p_hourly_cents,cleaner_hours=p_hours,duration_hours=p_duration_hours,provider_pay_cents=pay,base_cents=base,discount_cents=savings,customer_cents=base-savings,period_id=p.id,quote_expires_at=expiry where id=j.id;
 insert into cleaning_outbox(website_id,job_id,kind,dedupe_key) values(j.website_id,j.id,'quote','quote:'||j.id) on conflict do nothing;
 return jsonb_build_object('base_cents',base,'discount_cents',savings,'customer_cents',base-savings,'provider_pay_cents',pay);
end $$;

create function public.cleaning_mark_job_paid(p_invoice_id uuid) returns uuid language plpgsql security invoker set search_path=public as $$
declare i billing_invoices; j cleaning_jobs;
begin
 select * into i from billing_invoices where id=p_invoice_id for update;
 if i.id is null or i.status<>'paid' or i.fulfillment_type<>'cleaning_job' or i.paid_at is null or lower(i.currency)<>'usd' then raise exception 'Verified job payment required'; end if;
 select * into j from cleaning_jobs where id=(i.fulfillment_payload->>'job_id')::uuid for update;
 if j.id is null or j.website_id::text<>i.fulfillment_payload->>'website_id' or lower(j.customer_email)<>lower(i.customer_email) or j.customer_cents<>i.total_cents then raise exception 'Job invoice mismatch'; end if;
 if j.invoice_id=i.id and j.status in ('offered','assigned','completed') then return j.id; end if;
 if j.invoice_id is not null and j.invoice_id<>i.id then raise exception 'Duplicate payment requires separate refund review';end if;
 if j.status<>'quoted' or i.paid_at>j.quote_expires_at or now()>=j.starts_at or (j.period_id is not null and not exists(select 1 from cleaning_member_periods cp join billing_invoices bi on bi.id=cp.invoice_id where cp.id=j.period_id and bi.status='paid')) then
 update cleaning_jobs set status='refund_review',invoice_id=i.id where id=j.id;
 update cleaning_offers set status='withdrawn' where job_id=j.id;
 return j.id;
 end if;
 update cleaning_discount_ledger set status='consumed' where job_id=j.id and status='reserved';
 update cleaning_jobs set status='offered',invoice_id=i.id where id=j.id;
 return j.id;
end $$;

create function public.cleaning_accept_offer(p_offer_id uuid,p_website_id uuid,p_token_hash text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare o cleaning_offers; j cleaning_jobs; p cleaning_providers;
begin
 -- All competing claims lock the same job before changing any assignment.
 select cj.* into j from cleaning_jobs cj join cleaning_offers co on co.job_id=cj.id where co.id=p_offer_id and co.website_id=p_website_id and co.token_hash=p_token_hash for update of cj;
 if j.id is null then raise exception 'Offer unavailable'; end if;
 select * into o from cleaning_offers where id=p_offer_id and website_id=p_website_id for update;
 select * into p from cleaning_providers where id=o.provider_id and website_id=j.website_id for update;
 if o.status<>'open' or o.expires_at<=now() or j.status<>'offered' or j.starts_at<=now() or p.eligibility<>'eligible' or not p.opted_in or p.hourly_cents>j.hourly_cents then raise exception 'Offer unavailable'; end if;
 if not exists(select 1 from billing_invoices where id=j.invoice_id and status='paid') then raise exception 'Payment unavailable'; end if;
 if exists(select 1 from cleaning_jobs busy where busy.provider_id=p.id and busy.status='assigned' and busy.id<>j.id and busy.starts_at < j.starts_at + make_interval(secs => j.duration_hours::double precision*3600) and j.starts_at < busy.starts_at + make_interval(secs => busy.duration_hours::double precision*3600)) then raise exception 'Provider already assigned during this time'; end if;
 update cleaning_jobs set status='assigned',provider_id=p.id where id=j.id;
 update cleaning_offers set status=case when id=o.id then 'accepted' else 'withdrawn' end where job_id=j.id;
 insert into cleaning_outbox(website_id,job_id,kind,dedupe_key) values(j.website_id,j.id,'assigned_customer','assigned_customer:'||j.id),(j.website_id,j.id,'assigned_operator','assigned_operator:'||j.id) on conflict do nothing;
 return jsonb_build_object('job_id',j.id,'customer_name',j.customer_name,'customer_email',j.customer_email,'private_details',j.private_details,'starts_at',j.starts_at,'provider_pay_cents',j.provider_pay_cents);
end $$;

create function public.cleaning_complete_job(p_job_id uuid,p_website_id uuid,p_note text) returns void language plpgsql security invoker set search_path=public as $$
declare j cleaning_jobs;
begin
 select * into j from cleaning_jobs where id=p_job_id and website_id=p_website_id for update;
 if j.id is null or j.status not in ('assigned','completed') or length(p_note) not between 5 and 2000 then raise exception 'Assigned job and completion evidence required'; end if;
 if not exists(select 1 from billing_invoices where id=j.invoice_id and status='paid') then raise exception 'Payment not verified'; end if;
 insert into cleaning_job_accounts(job_id,invoice_id,provider_id,collected_cents,provider_payable_cents,discount_cents,platform_gross_cents) values(j.id,j.invoice_id,j.provider_id,j.customer_cents,j.provider_pay_cents,j.discount_cents,j.customer_cents-j.provider_pay_cents) on conflict(job_id) do nothing;
 update cleaning_jobs set status='completed',completion_note=p_note where id=j.id;
end $$;

create function public.cleaning_expire_quotes(p_website_id uuid) returns integer language plpgsql security invoker set search_path=public as $$
declare j cleaning_jobs; total integer:=0;
begin
 for j in select * from cleaning_jobs where website_id=p_website_id and status='quoted' and quote_expires_at<now() for update skip locked loop
 -- A confirmed paid invoice must be fulfilled or reviewed, never silently cancelled.
 if exists(select 1 from billing_invoices where fulfillment_type='cleaning_job' and fulfillment_payload->>'job_id'=j.id::text and status='paid') then continue; end if;
 update cleaning_jobs set status='cancelled' where id=j.id;
 update cleaning_discount_ledger set status='released' where job_id=j.id and status='reserved';
 total:=total+1;
 end loop;
 return total;
end $$;

revoke all on function public.cleaning_activate_membership(uuid),public.cleaning_cancel_membership(uuid,uuid),public.cleaning_quote_job(uuid,uuid,integer,numeric,text,numeric),public.cleaning_mark_job_paid(uuid),public.cleaning_accept_offer(uuid,uuid,text),public.cleaning_complete_job(uuid,uuid,text),public.cleaning_expire_quotes(uuid) from public,anon,authenticated;
grant execute on function public.cleaning_activate_membership(uuid),public.cleaning_cancel_membership(uuid,uuid),public.cleaning_quote_job(uuid,uuid,integer,numeric,text,numeric),public.cleaning_mark_job_paid(uuid),public.cleaning_accept_offer(uuid,uuid,text),public.cleaning_complete_job(uuid,uuid,text),public.cleaning_expire_quotes(uuid) to service_role;

create function public.cleaning_queue_offer(p_job_id uuid,p_provider_id uuid,p_hash text,p_capability text) returns boolean language plpgsql security invoker set search_path=public as $$
declare j cleaning_jobs; p cleaning_providers; oid uuid;
begin
 select * into j from cleaning_jobs where id=p_job_id for update;
 select * into p from cleaning_providers where id=p_provider_id and website_id=j.website_id for share;
 if j.status<>'offered' or p.eligibility<>'eligible' or not p.opted_in or not j.zip=any(p.zips) or not j.service=any(p.services) or p.hourly_cents>j.hourly_cents or p_capability !~ '^[a-f0-9]{64}$' or p_hash<>encode(sha256(p_capability::bytea),'hex') then return false; end if;
 insert into cleaning_offers(website_id,job_id,provider_id,token_hash,expires_at) values(j.website_id,j.id,p.id,p_hash,least(now()+interval '72 hours',j.starts_at)) on conflict(job_id,provider_id) do nothing returning id into oid;
 if oid is null then return false; end if;
 insert into cleaning_outbox(website_id,job_id,kind,dedupe_key,offer_id,capability) values(j.website_id,j.id,'offer','offer:'||oid,oid,p_capability);
 return true;
end $$;
create function public.cleaning_cancel_job(p_job_id uuid,p_website_id uuid) returns text language plpgsql security invoker set search_path=public as $$
declare j cleaning_jobs; next_status text;
begin
 select * into j from cleaning_jobs where id=p_job_id and website_id=p_website_id for update;
 if j.id is null then raise exception 'Job unavailable'; end if;
 next_status:=case when exists(select 1 from billing_invoices where fulfillment_type='cleaning_job' and fulfillment_payload->>'job_id'=j.id::text and status='paid') then 'refund_review' else 'cancelled' end;
 update cleaning_jobs set status=next_status where id=j.id;
 update cleaning_offers set status='withdrawn' where job_id=j.id;
 if next_status='cancelled' then update cleaning_discount_ledger set status='released' where job_id=j.id and status='reserved'; end if;
 update cleaning_job_accounts set status='refund_review' where job_id=j.id;
 return next_status;
end $$;
revoke all on function public.cleaning_queue_offer(uuid,uuid,text,text),public.cleaning_cancel_job(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cleaning_queue_offer(uuid,uuid,text,text),public.cleaning_cancel_job(uuid,uuid) to service_role;

alter table public.cleaning_outbox add column reviewed_by uuid references auth.users(id),add column reviewed_at timestamptz,add column review_note text;
create function public.cleaning_reissue_delivery(p_outbox_id uuid,p_actor uuid,p_note text,p_capability text,p_hash text) returns void language plpgsql security invoker set search_path=public as $$
declare o cleaning_outbox; j cleaning_jobs; p cleaning_providers; ofr cleaning_offers;
begin
 select * into o from cleaning_outbox where id=p_outbox_id;
 select * into j from cleaning_jobs where id=o.job_id for update;
 select * into o from cleaning_outbox where id=p_outbox_id for update;
 if o.id is null or o.status<>'unknown' or length(p_note) not between 10 and 2000 then raise exception 'Delivery review required';end if;
 if o.kind='offer' then
 select * into ofr from cleaning_offers where id=o.offer_id;
 select * into p from cleaning_providers where id=ofr.provider_id for update;
 if j.status<>'offered' or j.starts_at<=now() or p.eligibility<>'eligible' or not p.opted_in or p_capability !~ '^[a-f0-9]{64}$' or p_hash<>encode(sha256(p_capability::bytea),'hex') then raise exception 'Offer cannot be reissued';end if;
 update cleaning_offers set token_hash=p_hash,expires_at=least(now()+interval '72 hours',j.starts_at),status='open' where id=ofr.id;
 elsif o.kind='quote' and (j.status<>'quoted' or j.quote_expires_at<=now()) then raise exception 'Quote is no longer available';
 end if;
 update cleaning_outbox set status='pending',capability=case when kind='offer' then p_capability else null end,attempted_at=null,error=null,reviewed_by=p_actor,reviewed_at=now(),review_note=p_note where id=o.id;
end $$;
revoke all on function public.cleaning_reissue_delivery(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.cleaning_reissue_delivery(uuid,uuid,text,text,text) to service_role;
