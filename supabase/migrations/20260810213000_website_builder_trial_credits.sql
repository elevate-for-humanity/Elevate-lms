-- Shared credit wallet for individual app trials and future paid credit packs.
-- Website Builder trial starts with 500 credits. Paid plan credit bundles can
-- reuse the same wallet/ledger without creating another billing system.

create table if not exists public.user_app_credit_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_slug text not null,
  balance integer not null default 0 check (balance >= 0),
  lifetime_granted integer not null default 0 check (lifetime_granted >= 0),
  lifetime_used integer not null default 0 check (lifetime_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, app_slug)
);

create table if not exists public.user_app_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_slug text not null,
  operation text not null,
  credits_delta integer not null,
  balance_after integer not null check (balance_after >= 0),
  source text not null default 'usage',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_app_credit_ledger_user_app_created
  on public.user_app_credit_ledger (user_id, app_slug, created_at desc);

alter table public.user_app_credit_wallets enable row level security;
alter table public.user_app_credit_ledger enable row level security;

drop policy if exists "users read own app credit wallet" on public.user_app_credit_wallets;
create policy "users read own app credit wallet"
  on public.user_app_credit_wallets
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users read own app credit ledger" on public.user_app_credit_ledger;
create policy "users read own app credit ledger"
  on public.user_app_credit_ledger
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.ensure_app_trial_wallet(
  p_user_id uuid,
  p_app_slug text,
  p_trial_credits integer default 500
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'not authorized';
  end if;

  insert into public.user_app_credit_wallets (
    user_id,
    app_slug,
    balance,
    lifetime_granted,
    lifetime_used
  ) values (
    p_user_id,
    p_app_slug,
    greatest(p_trial_credits, 0),
    greatest(p_trial_credits, 0),
    0
  )
  on conflict (user_id, app_slug) do nothing;

  select balance into v_balance
  from public.user_app_credit_wallets
  where user_id = p_user_id and app_slug = p_app_slug;

  return coalesce(v_balance, 0);
end;
$$;

create or replace function public.consume_app_credits(
  p_user_id uuid,
  p_app_slug text,
  p_operation text,
  p_cost integer
)
returns table (success boolean, balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_next integer;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'not authorized';
  end if;

  if p_cost <= 0 then
    select w.balance into v_balance
    from public.user_app_credit_wallets w
    where w.user_id = p_user_id and w.app_slug = p_app_slug;
    return query select true, coalesce(v_balance, 0);
    return;
  end if;

  select w.balance into v_balance
  from public.user_app_credit_wallets w
  where w.user_id = p_user_id and w.app_slug = p_app_slug
  for update;

  if v_balance is null or v_balance < p_cost then
    return query select false, coalesce(v_balance, 0);
    return;
  end if;

  v_next := v_balance - p_cost;

  update public.user_app_credit_wallets
  set balance = v_next,
      lifetime_used = lifetime_used + p_cost,
      updated_at = now()
  where user_id = p_user_id and app_slug = p_app_slug;

  insert into public.user_app_credit_ledger (
    user_id,
    app_slug,
    operation,
    credits_delta,
    balance_after,
    source
  ) values (
    p_user_id,
    p_app_slug,
    p_operation,
    -p_cost,
    v_next,
    'usage'
  );

  return query select true, v_next;
end;
$$;

grant execute on function public.ensure_app_trial_wallet(uuid, text, integer) to authenticated;
grant execute on function public.consume_app_credits(uuid, text, text, integer) to authenticated;

grant select on public.user_app_credit_wallets to authenticated;
grant select on public.user_app_credit_ledger to authenticated;
