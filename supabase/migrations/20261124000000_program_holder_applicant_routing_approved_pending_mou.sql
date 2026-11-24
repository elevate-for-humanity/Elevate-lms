-- ============================================================================
-- Program-holder applicant routing: admit approved-pending-MOU holders
-- ============================================================================
-- TEST IN elevate-lms-qa FIRST. Do NOT apply to production until the
-- assignment flow has been verified end to end in QA (admin preview + apply,
-- holder portal shows the assigned applicants). This migration changes which
-- holders the automatic application router can target.
--
-- Root cause: route_application_to_program_holder_v1() only routed
-- applications to holders whose status is 'active' or 'approved'. Achieve
-- Training Institute is approved — status 'approved_pending_mou' means
-- approved, only the MOU signature is outstanding — so the trigger silently
-- skipped her and no CNA application ever reached her dashboard. The same
-- exclusion is why the admin had no routed applicants to show at all.
--
-- The fix is deliberately narrow: the role filter
-- (owner / primary / training_provider) is unchanged, so coordinators such
-- as Top Ace Solutions (pending MOU, role coordinator) still do NOT receive
-- the owner queue. Only an approved holder awaiting MOU signature, in an
-- owner role, is admitted.
--
-- Deliberately NOT changed here: sync_program_holder_assignment_applicants_v1()
-- (the program_holder_programs backfill). Its backfill assigns EVERY
-- application for the program at once, with no batch cap — the admin assign
-- route (POST /api/admin/program-holders/[id]/assign-applicants) is the
-- controlled path for a reviewed batch such as the 50 CNA referrals.
-- ============================================================================

create or replace function public.route_application_to_program_holder_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program_id uuid;
  v_holder_id uuid;
  v_name text;
begin
  v_program_id := new.program_id;
  if v_program_id is null then
    select p.id into v_program_id
    from public.programs p
    where p.slug = coalesce(nullif(new.program_slug, ''), nullif(new.pathway_slug, ''))
       or lower(p.title) = lower(coalesce(nullif(new.program_name, ''), nullif(new.program_interest, '')))
    order by coalesce(p.is_active, true) desc, p.created_at asc
    limit 1;
  end if;

  if v_program_id is null then return new; end if;

  select php.program_holder_id into v_holder_id
  from public.program_holder_programs php
  join public.program_holders ph on ph.id = php.program_holder_id
  where php.program_id = v_program_id
    and coalesce(php.status, 'active') = 'active'
    and lower(coalesce(php.role_in_program, 'owner')) in ('owner', 'primary', 'training_provider')
    -- Approved holders awaiting MOU signature ARE routing targets. A holder
    -- in 'approved_pending_mou' is approved; only the signature is
    -- outstanding. Coordinators are still excluded by the role filter above.
    and lower(coalesce(ph.status, '')) in ('active', 'approved', 'approved_pending_mou')
  order by coalesce(php.is_primary, false) desc, php.created_at asc, php.id asc
  limit 1;

  if v_holder_id is null then return new; end if;
  v_name := coalesce(nullif(new.full_name, ''), nullif(new.name, ''), trim(concat_ws(' ', new.first_name, new.last_name)));

  update public.program_holder_students phs
  set status = 'routing_replaced',
      updated_at = now()
  where phs.application_id = new.id
    and phs.program_holder_id <> v_holder_id
    and lower(coalesce(phs.status, 'applied')) in ('applied', 'applicant', 'pending', 'inactive', 'removed');

  insert into public.program_holder_students (
    program_holder_id, application_id, student_id, user_id, program_id,
    applicant_name, applicant_email, applicant_phone, status,
    application_status, label, created_at, updated_at
  ) values (
    v_holder_id, new.id, new.user_id, new.user_id, v_program_id,
    v_name, new.email, new.phone, 'applied',
    coalesce(nullif(new.status, ''), 'applied'), 'Student application',
    coalesce(new.created_at, now()), now()
  )
  on conflict (program_holder_id, application_id) where application_id is not null
  do update set
    student_id = excluded.student_id,
    user_id = excluded.user_id,
    program_id = excluded.program_id,
    applicant_name = excluded.applicant_name,
    applicant_email = excluded.applicant_email,
    applicant_phone = excluded.applicant_phone,
    application_status = excluded.application_status,
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.route_application_to_program_holder_v1() from public;
grant execute on function public.route_application_to_program_holder_v1() to service_role;

comment on function public.route_application_to_program_holder_v1()
is 'Routes each canonical application to exactly one approved or active primary training owner; approved holders awaiting MOU signature are routing targets, coordinators do not receive the owner queue.';
