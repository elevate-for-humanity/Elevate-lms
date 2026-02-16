-- ============================================================
-- COMPLETE WORKFORCE INFRASTRUCTURE - ONE SHOT
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1) REQUIRED EXTENSIONS
create extension if not exists pgcrypto;

-- 2) TENANT + LICENSE + MEMBERSHIP HARDENING
create index if not exists idx_tenant_memberships_tenant on tenant_memberships(tenant_id);
create index if not exists idx_tenant_memberships_user on tenant_memberships(user_id);
create index if not exists idx_tenant_licenses_tenant on tenant_licenses(tenant_id);

-- 3) BOOTSTRAP FUNCTION: Create tenant + owner + starter license
create or replace function public.create_tenant_with_owner(
  tenant_name text,
  tenant_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  existing_tenant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- If slug already exists, return it and ensure membership/license exist
  select id into existing_tenant_id from public.tenants where slug = tenant_slug limit 1;

  if existing_tenant_id is not null then
    new_tenant_id := existing_tenant_id;
  else
    insert into public.tenants(name, slug)
    values (tenant_name, tenant_slug)
    returning id into new_tenant_id;
  end if;

  -- Membership upsert
  insert into public.tenant_memberships(tenant_id, user_id, role)
  values (new_tenant_id, auth.uid(), 'owner')
  on conflict (tenant_id, user_id) do update
    set role = excluded.role;

  -- License ensure exists (starter defaults)
  insert into public.tenant_licenses(
    tenant_id,
    plan,
    max_employers,
    max_apprentices,
    active
  )
  values (
    new_tenant_id,
    'starter',
    5,
    25,
    true
  )
  on conflict (tenant_id) do nothing;

  return new_tenant_id;
end;
$$;

grant execute on function public.create_tenant_with_owner(text, text) to authenticated;

-- 4) PUSH TOKENS + NOTIFICATION LOGS (IDEMPOTENT)
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  device_id text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, device_id)
);

create index if not exists idx_push_tokens_user on public.push_tokens(user_id);
create index if not exists idx_push_tokens_token on public.push_tokens(token);

alter table public.push_tokens enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='push_tokens' and policyname='Users can view own tokens') then
    create policy "Users can view own tokens" on public.push_tokens for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='push_tokens' and policyname='Users can insert own tokens') then
    create policy "Users can insert own tokens" on public.push_tokens for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='push_tokens' and policyname='Users can update own tokens') then
    create policy "Users can update own tokens" on public.push_tokens for update using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='push_tokens' and policyname='Users can delete own tokens') then
    create policy "Users can delete own tokens" on public.push_tokens for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='push_tokens' and policyname='Service role can manage all tokens') then
    create policy "Service role can manage all tokens" on public.push_tokens for all using ((auth.jwt() ->> 'role') = 'service_role');
  end if;
end $$;

create or replace function public.update_push_tokens_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists push_tokens_updated_at on public.push_tokens;
create trigger push_tokens_updated_at
before update on public.push_tokens
for each row execute function public.update_push_tokens_updated_at();

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  data jsonb,
  type text not null,
  status text not null check (status in ('sent', 'failed', 'pending')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notification_logs_user on public.notification_logs(user_id);
create index if not exists idx_notification_logs_type on public.notification_logs(type);
create index if not exists idx_notification_logs_status on public.notification_logs(status);
create index if not exists idx_notification_logs_created on public.notification_logs(created_at desc);

alter table public.notification_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notification_logs' and policyname='Users can view own notification logs') then
    create policy "Users can view own notification logs" on public.notification_logs for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notification_logs' and policyname='Service role can manage notification logs') then
    create policy "Service role can manage notification logs" on public.notification_logs for all using ((auth.jwt() ->> 'role') = 'service_role');
  end if;
end $$;

comment on table public.push_tokens is 'Stores Expo push notification tokens for mobile devices';
comment on table public.notification_logs is 'Logs push notifications sent to users';

-- 5) STRIPE LICENSE UPDATE HELPER (SERVICE ROLE)
create or replace function public.upsert_license_from_stripe(
  p_tenant_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_status text,
  p_plan_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role recommended
  if (auth.jwt() ->> 'role') <> 'service_role' then
    raise exception 'Service role required';
  end if;

  update public.tenant_licenses
  set
    stripe_customer_id = p_stripe_customer_id,
    stripe_subscription_id = p_stripe_subscription_id,
    plan = coalesce(p_plan_name, plan),
    active = (p_status = 'active' or p_status = 'trialing'),
    updated_at = now()
  where tenant_id = p_tenant_id;

  if not found then
    insert into public.tenant_licenses(
      tenant_id,
      stripe_customer_id,
      stripe_subscription_id,
      plan,
      max_employers,
      max_apprentices,
      active
    )
    values (
      p_tenant_id,
      p_stripe_customer_id,
      p_stripe_subscription_id,
      coalesce(p_plan_name, 'starter'),
      5,
      25,
      (p_status = 'active' or p_status = 'trialing')
    );
  end if;
end;
$$;

grant execute on function public.upsert_license_from_stripe(uuid, text, text, text, text, text) to service_role;

comment on function public.create_tenant_with_owner is 'Bootstrap function: creates tenant + owner membership + starter license in one transaction';
comment on function public.upsert_license_from_stripe is 'Stripe webhook helper: updates tenant license from payment events';
