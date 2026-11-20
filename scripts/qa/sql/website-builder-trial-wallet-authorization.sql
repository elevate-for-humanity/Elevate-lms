-- Isolated QA only. Recorded as qa_builder_authorization_hardening_20261119 (20261119215751).
-- Apply after the QA wallet contract and its authenticated RPC wrapper exist.
CREATE OR REPLACE FUNCTION rpc_private.ensure_app_trial_wallet(p_user_id uuid, p_app_slug text, p_trial_credits integer DEFAULT 500)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_balance integer;
 v_grant integer;
 v_role text := auth.role();
begin
 if v_role is distinct from 'service_role' then
  if auth.uid() is null or auth.uid() <> p_user_id then
   raise exception 'not authorized' using errcode='42501';
  end if;
  if p_app_slug <> 'website-builder' or not exists (
   select 1 from public.user_app_subscriptions s
   where s.user_id=p_user_id and s.app_slug=p_app_slug
    and s.status='trial' and s.trial_ends_at>now()
  ) then
   raise exception 'active Website Builder trial required' using errcode='42501';
  end if;
  -- Match WEBSITE_BUILDER_TRIAL.credits; caller-selected amounts are never authoritative.
  v_grant := 500;
 else
  v_grant := greatest(p_trial_credits,0);
 end if;
 insert into public.user_app_credit_wallets(user_id,app_slug,balance,lifetime_granted,lifetime_used)
 values(p_user_id,p_app_slug,v_grant,v_grant,0)
 on conflict(user_id,app_slug) do nothing;
 select balance into v_balance from public.user_app_credit_wallets
 where user_id=p_user_id and app_slug=p_app_slug;
 return coalesce(v_balance,0);
end;
$function$;
revoke all on function rpc_private.ensure_app_trial_wallet(uuid, text, integer) from public, anon;
grant execute on function rpc_private.ensure_app_trial_wallet(uuid, text, integer) to authenticated, service_role;
