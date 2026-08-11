-- Lock Website Builder/app credit RPCs to the authenticated owner or service role.
-- The original migration allowed null auth context through its mismatch guard.

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
  v_role text := auth.role();
begin
  if v_role is distinct from 'service_role' then
    if auth.uid() is null or auth.uid() <> p_user_id then
      raise exception 'not authorized';
    end if;
  end if;

  insert into public.user_app_credit_wallets (
    user_id, app_slug, balance, lifetime_granted, lifetime_used
  ) values (
    p_user_id, p_app_slug, greatest(p_trial_credits, 0), greatest(p_trial_credits, 0), 0
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
  v_role text := auth.role();
begin
  if v_role is distinct from 'service_role' then
    if auth.uid() is null or auth.uid() <> p_user_id then
      raise exception 'not authorized';
    end if;
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
    user_id, app_slug, operation, credits_delta, balance_after, source
  ) values (
    p_user_id, p_app_slug, p_operation, -p_cost, v_next, 'usage'
  );

  return query select true, v_next;
end;
$$;

revoke all on function public.ensure_app_trial_wallet(uuid, text, integer)
  from public, anon;
revoke all on function public.consume_app_credits(uuid, text, text, integer)
  from public, anon;

grant execute on function public.ensure_app_trial_wallet(uuid, text, integer)
  to authenticated, service_role;
grant execute on function public.consume_app_credits(uuid, text, text, integer)
  to authenticated, service_role;
