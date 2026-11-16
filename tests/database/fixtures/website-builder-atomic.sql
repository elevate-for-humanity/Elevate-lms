create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create function auth.role() returns text language sql as $$ select 'service_role'::text $$;
create table public.user_websites(id uuid primary key, user_id uuid, site_name text, subdomain text, site_config jsonb, is_published boolean, updated_at timestamptz);
create table public.website_revisions(id uuid primary key default gen_random_uuid(), website_id uuid, user_id uuid, site_name text, subdomain text, site_config jsonb, is_published boolean, reason text);
create table public.user_app_credit_wallets(user_id uuid,app_slug text,balance integer,lifetime_used integer,updated_at timestamptz,primary key(user_id,app_slug));
create table public.user_app_credit_ledger(id uuid default gen_random_uuid(),user_id uuid,app_slug text,operation text,credits_delta integer,balance_after integer,source text);
-- Existing debit contract, using real locked wallet/ledger statements.
create function public.consume_app_credits(p_user_id uuid,p_app_slug text,p_operation text,p_cost integer)
returns table(success boolean,balance integer) language plpgsql security definer set search_path=public as $$
declare v_balance integer; v_next integer;
begin
 select w.balance into v_balance from public.user_app_credit_wallets w where w.user_id=p_user_id and w.app_slug=p_app_slug for update;
 if v_balance is null or v_balance<p_cost then return query select false,coalesce(v_balance,0);return;end if;
 v_next:=v_balance-p_cost;
 update public.user_app_credit_wallets set balance=v_next,lifetime_used=lifetime_used+p_cost,updated_at=now() where user_id=p_user_id and app_slug=p_app_slug;
 insert into public.user_app_credit_ledger(user_id,app_slug,operation,credits_delta,balance_after,source) values(p_user_id,p_app_slug,p_operation,-p_cost,v_next,'usage');
 return query select true,v_next;
end;$$;
grant usage on schema public to service_role,authenticated,anon;
grant select,update on public.user_websites to service_role;
grant insert,select on public.website_revisions to service_role;
insert into public.user_websites values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','Before','unchanged','{"title":"Before"}',false,'2099-01-01T00:00:00.123Z');
insert into public.user_app_credit_wallets values('00000000-0000-4000-8000-000000000002','website-builder',16,0,now());
