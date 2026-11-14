create schema if not exists private;

create or replace function private.assert_self_or_staff(p_target uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare v_role text;
begin
  if auth.role() = 'service_role' then return; end if;
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if auth.uid() = p_target then return; end if;
  select lower(coalesce(role,'')) into v_role from public.profiles where id = auth.uid();
  if v_role in ('admin','super_admin','staff') then return; end if;
  raise exception 'Not authorized for requested user' using errcode='42501';
end;
$$;
revoke all on function private.assert_self_or_staff(uuid) from public, anon, authenticated;

create or replace function private.assert_self_or_educator(p_target uuid)
returns void
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $$
declare v_role text;
begin
  if auth.role() = 'service_role' then return; end if;
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if auth.uid() = p_target then return; end if;
  select lower(coalesce(role,'')) into v_role from public.profiles where id = auth.uid();
  if v_role in ('admin','super_admin','staff','instructor','program_holder','org_admin','provider_admin') then return; end if;
  raise exception 'Not authorized for requested user' using errcode='42501';
end;
$$;
revoke all on function private.assert_self_or_educator(uuid) from public, anon, authenticated;

alter function public.calculate_course_progress(uuid,uuid) rename to calculate_course_progress_internal;
revoke all on function public.calculate_course_progress_internal(uuid,uuid) from public, anon, authenticated;
create function public.calculate_course_progress(p_user_id uuid, p_course_id uuid)
returns integer language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_educator(p_user_id);
  return public.calculate_course_progress_internal(p_user_id,p_course_id);
end;$$;
grant execute on function public.calculate_course_progress(uuid,uuid) to authenticated;

alter function public.can_access_lesson(uuid,uuid) rename to can_access_lesson_internal;
revoke all on function public.can_access_lesson_internal(uuid,uuid) from public, anon, authenticated;
create function public.can_access_lesson(p_user_id uuid, p_lesson_id uuid)
returns boolean language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_educator(p_user_id);
  return public.can_access_lesson_internal(p_user_id,p_lesson_id);
end;$$;
grant execute on function public.can_access_lesson(uuid,uuid) to authenticated;

alter function public.check_enrollment_access(uuid,text) rename to check_enrollment_access_internal;
revoke all on function public.check_enrollment_access_internal(uuid,text) from public, anon, authenticated;
create function public.check_enrollment_access(p_user_id uuid, p_program_slug text default null)
returns table(can_access_portal boolean, can_track_hours boolean, can_access_milady boolean, enrollment_status text, message text)
language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_educator(p_user_id);
  return query select * from public.check_enrollment_access_internal(p_user_id,p_program_slug);
end;$$;
grant execute on function public.check_enrollment_access(uuid,text) to authenticated;

alter function public.check_module_unlock(uuid,uuid,uuid) rename to check_module_unlock_internal;
revoke all on function public.check_module_unlock_internal(uuid,uuid,uuid) from public, anon, authenticated;
create function public.check_module_unlock(p_user_id uuid, p_course_id uuid, p_module_id uuid)
returns boolean language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_educator(p_user_id);
  return public.check_module_unlock_internal(p_user_id,p_course_id,p_module_id);
end;$$;
grant execute on function public.check_module_unlock(uuid,uuid,uuid) to authenticated;

alter function public.check_onboarding_complete(uuid) rename to check_onboarding_complete_internal;
revoke all on function public.check_onboarding_complete_internal(uuid) from public, anon, authenticated;
create function public.check_onboarding_complete(p_user_id uuid)
returns boolean language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_staff(p_user_id);
  return public.check_onboarding_complete_internal(p_user_id);
end;$$;
grant execute on function public.check_onboarding_complete(uuid) to authenticated;

alter function public.check_onboarding_completion(uuid,text) rename to check_onboarding_completion_internal;
revoke all on function public.check_onboarding_completion_internal(uuid,text) from public, anon, authenticated;
create function public.check_onboarding_completion(p_user_id uuid, p_role text)
returns boolean language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_staff(p_user_id);
  return public.check_onboarding_completion_internal(p_user_id,p_role);
end;$$;
grant execute on function public.check_onboarding_completion(uuid,text) to authenticated;

alter function public.evaluate_exam_readiness(uuid,uuid) rename to evaluate_exam_readiness_internal;
revoke all on function public.evaluate_exam_readiness_internal(uuid,uuid) from public, anon, authenticated;
create function public.evaluate_exam_readiness(p_user_id uuid, p_program_id uuid)
returns public.exam_readiness_result language plpgsql stable security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_educator(p_user_id);
  return public.evaluate_exam_readiness_internal(p_user_id,p_program_id);
end;$$;
grant execute on function public.evaluate_exam_readiness(uuid,uuid) to authenticated;

alter function public.is_program_completion_eligible(uuid,uuid) rename to is_program_completion_eligible_internal;
revoke all on function public.is_program_completion_eligible_internal(uuid,uuid) from public, anon, authenticated;
create function public.is_program_completion_eligible(p_user_id uuid, p_program_id uuid)
returns boolean language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_educator(p_user_id);
  return public.is_program_completion_eligible_internal(p_user_id,p_program_id);
end;$$;
grant execute on function public.is_program_completion_eligible(uuid,uuid) to authenticated;

alter function public.verify_enrollment_complete(uuid) rename to verify_enrollment_complete_internal;
revoke all on function public.verify_enrollment_complete_internal(uuid) from public, anon, authenticated;
create function public.verify_enrollment_complete(p_user_id uuid)
returns table(requirement text, status text, verified boolean)
language plpgsql security definer set search_path to 'pg_catalog','public' as $$
begin
  perform private.assert_self_or_staff(p_user_id);
  return query select * from public.verify_enrollment_complete_internal(p_user_id);
end;$$;
grant execute on function public.verify_enrollment_complete(uuid) to authenticated;
