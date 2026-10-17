-- Each verified paid invoice funds one expiring, tenant-owned assistant pool.
-- No prices, invoices, charges or external infrastructure are activated here.
create table public.commercial_ai_credit_periods (
  billing_invoice_id uuid primary key references public.billing_invoices(id),
  tenant_id uuid not null references public.tenants(id),
  credits_granted integer not null check(credits_granted > 0),
  balance integer not null check(balance >= 0 and balance <= credits_granted),
  period_start timestamptz not null,
  period_end timestamptz not null check(period_end > period_start),
  created_at timestamptz not null default now()
);
create index commercial_ai_periods_tenant_idx on public.commercial_ai_credit_periods(tenant_id,period_end);
alter table public.commercial_ai_credit_periods enable row level security;
revoke all on public.commercial_ai_credit_periods from public,anon,authenticated;
grant select,insert,update on public.commercial_ai_credit_periods to service_role;

create table public.commercial_ai_credit_usage (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  user_id uuid not null references auth.users(id),
  agent_id text not null check(agent_id in ('paris','ellie','lizzy','zora')),
  credits integer not null check(credits=10),
  balance_after integer not null check(balance_after>=0),
  idempotency_key text not null check(length(idempotency_key) between 1 and 200),
  debits jsonb not null,
  created_at timestamptz not null default now(),
  unique(tenant_id,idempotency_key)
);
create index commercial_ai_usage_user_idx on public.commercial_ai_credit_usage(user_id);
alter table public.commercial_ai_credit_usage enable row level security;
revoke all on public.commercial_ai_credit_usage from public,anon,authenticated;
grant select,insert on public.commercial_ai_credit_usage to service_role;

create or replace function public.grant_commercial_ai_paid_invoice_v1(p_invoice_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare v_invoice public.billing_invoices%rowtype; v_tenant uuid; v_months integer;
  v_credits integer:=0; v_min_cents integer:=0; v_code text; v_end timestamptz;
begin
  if (select auth.role()) is distinct from 'service_role' then raise exception 'not authorized'; end if;
  select * into v_invoice from public.billing_invoices where id=p_invoice_id for update;
  if not found or v_invoice.status is distinct from 'paid' or v_invoice.paid_at is null
    or upper(v_invoice.currency) is distinct from 'USD'
    or v_invoice.fulfillment_type is distinct from 'platform_subscription'
    then raise exception 'verified platform payment required'; end if;
  if jsonb_typeof(v_invoice.fulfillment_payload->'addon_codes') is distinct from 'array' then return false; end if;
  for v_code in select distinct jsonb_array_elements_text(v_invoice.fulfillment_payload->'addon_codes') loop
    case v_code
      when 'paris-assistant' then v_credits:=v_credits+250; v_min_cents:=v_min_cents+1900;
      when 'ellie-assistant' then v_credits:=v_credits+250; v_min_cents:=v_min_cents+1900;
      when 'lizzy-assistant' then v_credits:=v_credits+400; v_min_cents:=v_min_cents+2900;
      when 'zora-assistant' then v_credits:=v_credits+400; v_min_cents:=v_min_cents+2900;
      when 'ai-team' then v_credits:=v_credits+1200; v_min_cents:=v_min_cents+7900;
      else null;
    end case;
  end loop;
  if v_credits=0 then return false; end if;
  v_tenant:=(v_invoice.fulfillment_payload->>'tenant_id')::uuid;
  v_months:=case v_invoice.fulfillment_payload->>'billing_interval' when 'monthly' then 1 when 'annual' then 12 else null end;
  if v_tenant is null or v_months is null
    or v_invoice.customer_external_key is distinct from 'organization:' || (v_invoice.fulfillment_payload->>'organization_id')
    or (v_invoice.fulfillment_payload->>'amount_cents') is null
    or v_invoice.total_cents <> (v_invoice.fulfillment_payload->>'amount_cents')::bigint
    or v_invoice.total_cents < v_min_cents*v_months then raise exception 'payment owner, interval or amount mismatch'; end if;
  perform pg_advisory_xact_lock(hashtextextended('commercial-ai:' || v_tenant::text,0));
  if exists(select 1 from public.commercial_ai_credit_periods where billing_invoice_id=p_invoice_id) then return false; end if;
  v_end:=v_invoice.paid_at + make_interval(months=>v_months);
  if v_invoice.paid_at > now() or v_end <= now() then raise exception 'payment period is not current'; end if;
  insert into public.commercial_ai_credit_periods(billing_invoice_id,tenant_id,credits_granted,balance,period_start,period_end)
    values(p_invoice_id,v_tenant,v_credits*v_months,v_credits*v_months,v_invoice.paid_at,v_end);
  return true;
end;
$$;
revoke all on function public.grant_commercial_ai_paid_invoice_v1(uuid) from public,anon,authenticated;
grant execute on function public.grant_commercial_ai_paid_invoice_v1(uuid) to service_role;

create or replace function public.consume_commercial_ai_reply_v1(
  p_tenant_id uuid,p_user_id uuid,p_agent_id text,p_idempotency_key text
)
returns table(success boolean,duplicate boolean,balance integer)
language plpgsql security definer set search_path=public
as $$
declare v_balance integer; v_remaining integer:=10; v_take integer;
  v_period record; v_debits jsonb:='[]'::jsonb;
begin
  if (select auth.role()) is distinct from 'service_role' then raise exception 'not authorized'; end if;
  if p_tenant_id is null or p_user_id is null or p_agent_id is null or p_agent_id not in ('paris','ellie','lizzy','zora')
    or p_idempotency_key is null or length(trim(p_idempotency_key)) not between 1 and 200 then raise exception 'invalid usage request'; end if;
  perform pg_advisory_xact_lock(hashtextextended('commercial-ai:' || p_tenant_id::text,0));
  if exists(select 1 from public.commercial_ai_credit_usage where tenant_id=p_tenant_id and idempotency_key=p_idempotency_key) then
    return query select false,true,0; return;
  end if;
  select coalesce(sum(p.balance),0)::integer into v_balance from public.commercial_ai_credit_periods p
    join public.billing_invoices i on i.id=p.billing_invoice_id and i.status='paid'
    where p.tenant_id=p_tenant_id and p.period_start<=now() and p.period_end>now();
  if v_balance<10 then return query select false,false,v_balance; return; end if;
  for v_period in select p.billing_invoice_id,p.balance from public.commercial_ai_credit_periods p
    join public.billing_invoices i on i.id=p.billing_invoice_id and i.status='paid'
    where p.tenant_id=p_tenant_id and p.period_start<=now() and p.period_end>now() and p.balance>0
    order by p.period_end,p.billing_invoice_id for update of p loop
    v_take:=least(v_remaining,v_period.balance);
    update public.commercial_ai_credit_periods set balance=commercial_ai_credit_periods.balance-v_take
      where billing_invoice_id=v_period.billing_invoice_id;
    v_debits:=v_debits || jsonb_build_array(jsonb_build_object('invoice_id',v_period.billing_invoice_id,'credits',v_take));
    v_remaining:=v_remaining-v_take;
    exit when v_remaining=0;
  end loop;
  if v_remaining<>0 then raise exception 'usage reconciliation failed'; end if;
  insert into public.commercial_ai_credit_usage(tenant_id,user_id,agent_id,credits,balance_after,idempotency_key,debits)
    values(p_tenant_id,p_user_id,p_agent_id,10,v_balance-10,p_idempotency_key,v_debits);
  return query select true,false,v_balance-10;
end;
$$;
revoke all on function public.consume_commercial_ai_reply_v1(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.consume_commercial_ai_reply_v1(uuid,uuid,text,text) to service_role;
