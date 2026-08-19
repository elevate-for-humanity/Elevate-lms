create or replace function private.assert_tenant_member_or_staff(p_tenant uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare v_role text;
begin
  if auth.role() = 'service_role' then return; end if;
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if exists (select 1 from public.tenant_memberships tm where tm.tenant_id=p_tenant and tm.user_id=auth.uid()) then return; end if;
  select lower(coalesce(role,'')) into v_role from public.profiles where id=auth.uid();
  if v_role in ('admin','super_admin','staff','provider_admin','workforce_board_admin') then return; end if;
  raise exception 'Not authorized for requested tenant' using errcode='42501';
end;
$$;
revoke all on function private.assert_tenant_member_or_staff(uuid) from public, anon, authenticated;

create or replace function private.assert_reporting_staff()
returns void
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare v_role text;
begin
  if auth.role() = 'service_role' then return; end if;
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select lower(coalesce(role,'')) into v_role from public.profiles where id=auth.uid();
  if v_role in ('admin','super_admin','staff','workforce_board_admin','case_manager') then return; end if;
  raise exception 'Reporting role required' using errcode='42501';
end;
$$;
revoke all on function private.assert_reporting_staff() from public, anon, authenticated;

alter function public.evaluate_exam_eligibility(uuid,uuid) rename to evaluate_exam_eligibility_internal;
revoke all on function public.evaluate_exam_eligibility_internal(uuid,uuid) from public, anon, authenticated;
create function public.evaluate_exam_eligibility(p_learner_id uuid, p_credential_id uuid)
returns table(domain_key text, is_eligible boolean, sims_passed integer, sims_required integer)
language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_educator(p_learner_id);
  return query select * from public.evaluate_exam_eligibility_internal(p_learner_id,p_credential_id);
end;$$;
revoke all on function public.evaluate_exam_eligibility(uuid,uuid) from public, anon;
grant execute on function public.evaluate_exam_eligibility(uuid,uuid) to authenticated;

alter function public.evaluate_exam_eligibility_v2(uuid,uuid,uuid) rename to evaluate_exam_eligibility_v2_internal;
revoke all on function public.evaluate_exam_eligibility_v2_internal(uuid,uuid,uuid) from public, anon, authenticated;
create function public.evaluate_exam_eligibility_v2(p_learner_id uuid, p_credential_id uuid, p_program_id uuid)
returns table(out_domain_key text, out_domain_name text, out_weight_percent integer, out_lessons_required integer, out_lessons_completed integer, out_is_domain_covered boolean, out_blocking_reason text)
language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_educator(p_learner_id);
  return query select * from public.evaluate_exam_eligibility_v2_internal(p_learner_id,p_credential_id,p_program_id);
end;$$;
revoke all on function public.evaluate_exam_eligibility_v2(uuid,uuid,uuid) from public, anon;
grant execute on function public.evaluate_exam_eligibility_v2(uuid,uuid,uuid) to authenticated;

alter function public.sim_readiness_score(uuid,uuid) rename to sim_readiness_score_internal;
revoke all on function public.sim_readiness_score_internal(uuid,uuid) from public, anon, authenticated;
create function public.sim_readiness_score(p_learner_id uuid, p_credential_id uuid)
returns jsonb language plpgsql stable security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_educator(p_learner_id);
  return public.sim_readiness_score_internal(p_learner_id,p_credential_id);
end;$$;
revoke all on function public.sim_readiness_score(uuid,uuid) from public, anon;
grant execute on function public.sim_readiness_score(uuid,uuid) to authenticated;

alter function public.get_active_license(uuid) rename to get_active_license_internal;
revoke all on function public.get_active_license_internal(uuid) from public, anon, authenticated;
create function public.get_active_license(p_tenant_id uuid)
returns table(id uuid, tenant_id uuid, status text, plan_type text, expires_at timestamptz, paid_through timestamptz, features jsonb, max_users integer)
language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_tenant_member_or_staff(p_tenant_id);
  return query select * from public.get_active_license_internal(p_tenant_id);
end;$$;
revoke all on function public.get_active_license(uuid) from public, anon;
grant execute on function public.get_active_license(uuid) to authenticated;

alter function public.wioa_summary_metrics(date,date,uuid,text) rename to wioa_summary_metrics_internal;
revoke all on function public.wioa_summary_metrics_internal(date,date,uuid,text) from public, anon, authenticated;
create function public.wioa_summary_metrics(p_start_date date default null, p_end_date date default null, p_program_id uuid default null, p_funding text default null)
returns table(total_participants bigint, active_enrollments bigint, completed bigint, exited bigint, job_placements bigint, credentials_issued bigint, avg_hourly_wage numeric, wioa_funded bigint, wrg_funded bigint, self_pay bigint, employer_sponsored bigint)
language plpgsql stable security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_reporting_staff();
  return query select * from public.wioa_summary_metrics_internal(p_start_date,p_end_date,p_program_id,p_funding);
end;$$;
revoke all on function public.wioa_summary_metrics(date,date,uuid,text) from public, anon;
grant execute on function public.wioa_summary_metrics(date,date,uuid,text) to authenticated;
