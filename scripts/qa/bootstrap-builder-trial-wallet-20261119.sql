-- QA ONLY: isolated project isdgjcdabhxxozarmxta.
-- Preserve the normal free-trial wallet helper used by startAppTrial.
-- No subscription, balance or identity is created by this stage.
-- Run transactionally with stop-on-error, after qa_builder_schema_contract_stage.
do $qa$
begin
 if to_regclass('public.user_app_credit_wallets') is null or to_regclass('public.website_builder_edit_commits') is null then
  raise exception 'Apply the isolated QA builder database contract first';
 end if;
 if to_regprocedure('public.ensure_app_trial_wallet(uuid,text,integer)') is not null or to_regprocedure('rpc_private.ensure_app_trial_wallet(uuid,text,integer)') is not null then
  raise exception 'Refusing trial wallet bootstrap: target helper already exists';
 end if;
end;
$qa$;

CREATE OR REPLACE FUNCTION rpc_private.ensure_app_trial_wallet(p_user_id uuid, p_app_slug text, p_trial_credits integer DEFAULT 500)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare v_balance integer; v_role text := auth.role(); begin if v_role is distinct from 'service_role' then if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'not authorized'; end if; end if; insert into public.user_app_credit_wallets(user_id,app_slug,balance,lifetime_granted,lifetime_used) values(p_user_id,p_app_slug,greatest(p_trial_credits,0),greatest(p_trial_credits,0),0) on conflict(user_id,app_slug) do nothing; select balance into v_balance from public.user_app_credit_wallets where user_id=p_user_id and app_slug=p_app_slug; return coalesce(v_balance,0); end; $function$;
revoke all on function rpc_private.ensure_app_trial_wallet(p_user_id uuid, p_app_slug text, p_trial_credits integer) from public, anon, authenticated, service_role;
grant execute on function rpc_private.ensure_app_trial_wallet(p_user_id uuid, p_app_slug text, p_trial_credits integer) to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ensure_app_trial_wallet(p_user_id uuid, p_app_slug text, p_trial_credits integer DEFAULT 500)
 RETURNS integer
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public', 'rpc_private'
AS $function$SELECT rpc_private.ensure_app_trial_wallet($1, $2, $3)$function$;
revoke all on function public.ensure_app_trial_wallet(p_user_id uuid, p_app_slug text, p_trial_credits integer) from public, anon, authenticated, service_role;
grant execute on function public.ensure_app_trial_wallet(p_user_id uuid, p_app_slug text, p_trial_credits integer) to authenticated, service_role;
