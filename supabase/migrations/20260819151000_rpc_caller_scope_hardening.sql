-- Enterprise acceptance hardening for remaining browser-callable SECURITY DEFINER RPCs.
-- Preserve legitimate self-service while preventing arbitrary cross-user mutations
-- and reads. System-maintained license counters are service-role only.

begin;

-- ---------------------------------------------------------------------------
-- Enrollment workflow step completion: owner or staff only.
-- ---------------------------------------------------------------------------
create or replace function public.mark_step_complete(
  p_step_id uuid,
  p_external_enrollment_id text default null::text
)
returns uuid
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_enrollment_id uuid;
  v_next_step_id uuid;
begin
  select es.enrollment_id
    into v_enrollment_id
  from public.enrollment_steps es
  where es.id = p_step_id;

  if v_enrollment_id is null then
    raise exception 'Enrollment step not found' using errcode = 'P0002';
  end if;

  if coalesce(auth.role(), '') <> 'service_role'
     and not exists (
       select 1
       from public.enrollments e
       where e.id = v_enrollment_id
         and (e.user_id = auth.uid() or e.student_id = auth.uid())
     )
     and not exists (
       select 1
       from public.profiles p
       where p.id = auth.uid()
         and p.role in ('admin', 'super_admin', 'staff', 'org_admin')
     ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.enrollment_steps
  set status = 'completed',
      completed_at = now(),
      external_enrollment_id = coalesce(p_external_enrollment_id, external_enrollment_id)
  where id = p_step_id;

  v_next_step_id := public.advance_to_next_step(v_enrollment_id);
  return v_next_step_id;
end;
$function$;

revoke all on function public.mark_step_complete(uuid, text) from public, anon;
grant execute on function public.mark_step_complete(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- License usage is accounting/system state. Browsers must not be able to alter
-- counters or create usage-log entries for arbitrary licenses/enrollments.
-- ---------------------------------------------------------------------------
revoke all on function public.increment_license_usage(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.increment_license_usage(uuid, uuid, uuid) to service_role;

revoke all on function public.decrement_license_usage(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.decrement_license_usage(uuid, uuid, uuid) to service_role;

-- Trigger function privileges are unnecessary on the REST/RPC surface. Existing
-- triggers continue to invoke their configured function internally.
revoke all on function public.decrement_license_usage() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Career application state: owner or operational staff only.
-- ---------------------------------------------------------------------------
create or replace function public.get_application_state(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_result jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not exists (
       select 1
       from public.career_applications ca
       where ca.id = p_application_id
         and ca.user_id = auth.uid()
     )
     and not exists (
       select 1
       from public.profiles p
       where p.id = auth.uid()
         and p.role in ('admin', 'super_admin', 'staff', 'org_admin')
     ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'application_id', id,
    'current_state', application_state,
    'submitted_at', submitted_at,
    'last_transition_at', last_transition_at,
    'state_history', state_history,
    'can_submit', application_state = 'review_ready'
  )
  into v_result
  from public.career_applications
  where id = p_application_id;

  if v_result is null then
    return jsonb_build_object('success', false, 'error', 'Application not found');
  end if;

  return jsonb_build_object('success', true) || v_result;
end;
$function$;

revoke all on function public.get_application_state(uuid) from public, anon;
grant execute on function public.get_application_state(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Application readiness contains funding/partner workflow information. Restrict
-- it to the applicant and operational staff.
-- ---------------------------------------------------------------------------
create or replace function public.check_application_access_readiness(p_application_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_app record;
  v_financial record;
  v_partner record;
  v_program record;
  v_blockers text[] := '{}';
begin
  select * into v_app from public.applications where id = p_application_id;

  if not found then
    return jsonb_build_object('ready', false, 'blockers', array['APPLICATION_NOT_FOUND']);
  end if;

  if coalesce(auth.role(), '') <> 'service_role'
     and v_app.user_id is distinct from auth.uid()
     and not exists (
       select 1
       from public.profiles p
       where p.id = auth.uid()
         and p.role in ('admin', 'super_admin', 'staff', 'org_admin')
     ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if v_app.status not in ('submitted','in_review','financially_cleared','awaiting_financial_verification') then
    v_blockers := array_append(v_blockers, 'APPLICATION_STATUS_NOT_ELIGIBLE:' || coalesce(v_app.status,'null'));
  end if;

  if v_app.email is null or v_app.email = '' then
    v_blockers := array_append(v_blockers, 'MISSING_EMAIL');
  end if;
  if v_app.program_slug is null or v_app.program_slug = '' then
    v_blockers := array_append(v_blockers, 'MISSING_PROGRAM_SLUG');
  end if;

  select * into v_financial
  from public.application_financials
  where application_id = p_application_id;

  if not found then
    v_blockers := array_append(v_blockers, 'FINANCIAL_RECORD_MISSING');
  elsif v_financial.verification_status <> 'verified' then
    v_blockers := array_append(v_blockers,
      'FINANCIAL_VERIFICATION_REQUIRED:status=' || v_financial.verification_status);
  end if;

  if v_app.program_slug is not null then
    select id into v_program from public.programs where slug = v_app.program_slug limit 1;
    if not found then
      v_blockers := array_append(v_blockers, 'PROGRAM_NOT_FOUND:' || v_app.program_slug);
    end if;

    if v_app.program_slug = 'cna' then
      select id into v_partner from public.partners
      where name = 'Choice Medical Institute' limit 1;
      if not found then
        v_blockers := array_append(v_blockers, 'PARTNER_NOT_FOUND:Choice Medical Institute');
      end if;
      if v_app.user_id is null then
        v_blockers := array_append(v_blockers, 'USER_NOT_RESOLVED');
      end if;
    end if;
  end if;

  if v_app.user_id is not null and v_app.program_slug is not null then
    if exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pr.id = pe.program_id
      where pe.user_id = v_app.user_id
        and pr.slug = v_app.program_slug
        and pe.enrollment_state = 'active'
    ) then
      v_blockers := array_append(v_blockers, 'ACTIVE_ENROLLMENT_EXISTS');
    end if;
  end if;

  return jsonb_build_object(
    'ready', array_length(v_blockers, 1) is null,
    'blockers', v_blockers,
    'application_id', p_application_id,
    'program_slug', v_app.program_slug,
    'status', v_app.status
  );
end;
$function$;

revoke all on function public.check_application_access_readiness(uuid) from public, anon;
grant execute on function public.check_application_access_readiness(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- User document readiness: self or staff only.
-- ---------------------------------------------------------------------------
create or replace function public.get_user_document_requirements(p_user_id uuid)
returns table(
  document_type text,
  is_required boolean,
  description text,
  instructions text,
  has_uploaded boolean,
  upload_status text
)
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_user_role text;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_user_id
     and not exists (
       select 1
       from public.profiles p
       where p.id = auth.uid()
         and p.role in ('admin', 'super_admin', 'staff', 'org_admin')
     ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select role into v_user_role
  from public.profiles
  where id = p_user_id;

  return query
  select dr.document_type,
         dr.is_required,
         dr.description,
         dr.instructions,
         d.id is not null as has_uploaded,
         d.status as upload_status
  from public.document_requirements dr
  left join public.documents d
    on d.user_id = p_user_id
   and d.document_type = dr.document_type
  where dr.role = v_user_role
  order by dr.is_required desc, dr.document_type;
end;
$function$;

revoke all on function public.get_user_document_requirements(uuid) from public, anon;
grant execute on function public.get_user_document_requirements(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Partner license details include the license key. Only the holder or staff may
-- retrieve them.
-- ---------------------------------------------------------------------------
create or replace function public.get_partner_license_info(p_partner_id uuid)
returns table(
  license_key text,
  license_type text,
  lms_model text,
  can_create_courses boolean,
  can_upload_scorm boolean,
  max_enrollments integer,
  current_enrollments integer,
  status text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_partner_id
     and not exists (
       select 1
       from public.profiles p
       where p.id = auth.uid()
         and p.role in ('admin', 'super_admin', 'staff', 'org_admin')
     ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  select pl.license_key,
         pl.license_type,
         pl.lms_model,
         pl.can_create_courses,
         pl.can_upload_scorm,
         pl.max_enrollments,
         pl.current_enrollments,
         pl.status,
         pl.expires_at
  from public.program_licenses pl
  where pl.license_holder_id = p_partner_id
    and pl.status = 'active'
    and (pl.expires_at is null or pl.expires_at > now())
  order by pl.created_at desc;
end;
$function$;

revoke all on function public.get_partner_license_info(uuid) from public, anon;
grant execute on function public.get_partner_license_info(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Inactive learner roster contains learner names and email addresses. Staff only.
-- ---------------------------------------------------------------------------
create or replace function public.get_inactive_learners(days_inactive integer default 7)
returns table(
  student_id uuid,
  full_name text,
  email text,
  last_active_at timestamptz,
  inactive_days integer
)
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not exists (
       select 1
       from public.profiles p
       where p.id = auth.uid()
         and p.role in ('admin', 'super_admin', 'staff', 'org_admin')
     ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  select s.id as student_id,
         trim(concat_ws(' ', s.first_name, s.last_name)) as full_name,
         s.email,
         s.updated_at as last_active_at,
         floor(extract(epoch from (now() - s.updated_at)) / 86400)::integer as inactive_days
  from public.students s
  where s.updated_at is not null
    and s.updated_at < now() - make_interval(days => days_inactive)
  order by s.updated_at asc;
end;
$function$;

revoke all on function public.get_inactive_learners(integer) from public, anon;
grant execute on function public.get_inactive_learners(integer) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Risk recalculation writes student_risk_status. A learner may recalculate only
-- their own status; operational staff may recalculate any learner.
-- ---------------------------------------------------------------------------
create or replace function public.calculate_student_risk_status(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_last_activity timestamptz;
  v_days_inactive integer := 0;
  v_progress numeric := 0;
  v_overdue integer := 0;
  v_risk_score numeric := 0;
  v_status text;
  v_factors jsonb := '[]'::jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_student_id
     and not exists (
       select 1
       from public.profiles p
       where p.id = auth.uid()
         and p.role in ('admin', 'super_admin', 'staff', 'org_admin')
     ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select max(lp.created_at)
    into v_last_activity
  from public.lesson_progress lp
  where lp.user_id = p_student_id;

  if v_last_activity is null then
    select max(coalesce(pe.started_at, pe.enrolled_at, pe.created_at))
      into v_last_activity
    from public.program_enrollments pe
    where pe.user_id = p_student_id
      and pe.status = 'active';
  end if;

  v_days_inactive := greatest(0, coalesce(extract(day from now() - v_last_activity)::int, 0));

  select coalesce(avg(pe.progress_percent), 0)
    into v_progress
  from public.program_enrollments pe
  where pe.user_id = p_student_id
    and pe.status = 'active';

  select count(*)::int
    into v_overdue
  from public.enrollment_requirements er
  join public.program_enrollments pe on pe.id = er.enrollment_id
  where pe.user_id = p_student_id
    and pe.status = 'active'
    and er.due_date is not null
    and er.due_date < current_date
    and coalesce(er.status, 'pending') not in ('completed', 'verified', 'waived');

  v_risk_score := least(100,
    (case when v_days_inactive > 14 then 40 when v_days_inactive > 7 then 20 when v_days_inactive > 3 then 10 else 0 end)
    + (case when v_progress < 10 then 30 when v_progress < 30 then 15 when v_progress < 50 then 5 else 0 end)
    + least(30, v_overdue * 5)
  );

  v_status := case
    when v_risk_score >= 70 then 'critical'
    when v_risk_score >= 40 then 'at_risk'
    when v_risk_score >= 20 then 'watch'
    else 'on_track'
  end;

  if v_days_inactive > 7 then
    v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor', 'inactivity', 'days', v_days_inactive));
  end if;
  if v_progress < 30 then
    v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor', 'low_progress', 'pct', v_progress));
  end if;
  if v_overdue > 0 then
    v_factors := v_factors || jsonb_build_array(jsonb_build_object('factor', 'overdue_requirements', 'count', v_overdue));
  end if;

  insert into public.student_risk_status (
    user_id, status, days_since_activity, progress_percentage,
    overdue_count, risk_score, risk_factors, updated_at
  ) values (
    p_student_id, v_status, v_days_inactive, v_progress,
    v_overdue, v_risk_score, v_factors, now()
  )
  on conflict (user_id) do update set
    status = excluded.status,
    days_since_activity = excluded.days_since_activity,
    progress_percentage = excluded.progress_percentage,
    overdue_count = excluded.overdue_count,
    risk_score = excluded.risk_score,
    risk_factors = excluded.risk_factors,
    updated_at = now();

  return jsonb_build_object(
    'status', v_status,
    'score', v_risk_score,
    'days', v_days_inactive,
    'progress', v_progress,
    'overdue', v_overdue,
    'factors', v_factors
  );
end;
$function$;

revoke all on function public.calculate_student_risk_status(uuid) from public, anon;
grant execute on function public.calculate_student_risk_status(uuid) to authenticated, service_role;

commit;
