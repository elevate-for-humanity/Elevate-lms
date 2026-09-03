create or replace function public.privileged_mfa_posture()
returns table(
  privileged_users bigint,
  users_with_verified_mfa bigint,
  users_without_verified_mfa bigint,
  verified_totp_factors bigint,
  verified_phone_factors bigint
)
language sql
security definer
set search_path = pg_catalog, public, auth
as $$
  with privileged as (
    select p.id
    from public.profiles p
    where lower(coalesce(p.role::text,'')) in ('super_admin','admin','org_admin','provider_admin','workforce_board_admin')
  ), factors as (
    select mf.user_id,
           count(*) filter (where mf.status = 'verified') as verified_count,
           count(*) filter (where mf.status = 'verified' and mf.factor_type = 'totp') as totp_count,
           count(*) filter (where mf.status = 'verified' and mf.factor_type = 'phone') as phone_count
    from auth.mfa_factors mf
    group by mf.user_id
  )
  select
    count(*)::bigint,
    count(*) filter (where coalesce(f.verified_count,0) > 0)::bigint,
    count(*) filter (where coalesce(f.verified_count,0) = 0)::bigint,
    coalesce(sum(f.totp_count),0)::bigint,
    coalesce(sum(f.phone_count),0)::bigint
  from privileged p
  left join factors f on f.user_id = p.id;
$$;

revoke all on function public.privileged_mfa_posture() from public, anon, authenticated;
grant execute on function public.privileged_mfa_posture() to service_role;
comment on function public.privileged_mfa_posture() is 'Service-role-only security posture summary for privileged accounts and verified MFA factors.';
