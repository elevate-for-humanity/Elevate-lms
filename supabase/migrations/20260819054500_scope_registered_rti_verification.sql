-- Scope registered-apprenticeship RTI verification.
-- Admin/sponsor staff may review across sponsor programs. Instructors may only
-- verify entries for programs explicitly assigned through program_instructors.

create or replace function public.verify_apprenticeship_rti_entry(
  p_entry_id uuid,
  p_minutes_verified integer,
  p_decision text,
  p_notes text default null
)
returns public.apprenticeship_rti_entries
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_row public.apprenticeship_rti_entries%rowtype;
  v_program_id uuid;
begin
  if auth.role() <> 'service_role' then
    if v_actor is null then
      raise exception 'Authentication required' using errcode='42501';
    end if;

    select lower(coalesce(role::text,'')) into v_role
    from public.profiles
    where id = v_actor;

    if v_role not in ('admin','super_admin','staff','org_admin','instructor') then
      raise exception 'Sponsor staff or assigned instructor role required' using errcode='42501';
    end if;
  end if;

  if p_decision not in ('verified','rejected') then
    raise exception 'Invalid decision' using errcode='22023';
  end if;

  select * into v_row
  from public.apprenticeship_rti_entries
  where id = p_entry_id
  for update;

  if not found then
    raise exception 'RTI entry not found' using errcode='P0002';
  end if;

  if auth.role() <> 'service_role' and v_role = 'instructor' then
    select pe.program_id into v_program_id
    from public.program_enrollments pe
    where pe.id = v_row.enrollment_id;

    if v_program_id is null or not exists (
      select 1
      from public.program_instructors pi
      where pi.instructor_id = v_actor
        and pi.program_id = v_program_id
    ) then
      raise exception 'Instructor is not assigned to this apprenticeship program' using errcode='42501';
    end if;
  end if;

  if p_decision='verified' and (
    p_minutes_verified is null or
    p_minutes_verified <= 0 or
    p_minutes_verified > v_row.minutes_claimed
  ) then
    raise exception 'Verified minutes must be between 1 and claimed minutes' using errcode='22023';
  end if;

  update public.apprenticeship_rti_entries
  set status = p_decision,
      minutes_verified = case when p_decision='verified' then p_minutes_verified else null end,
      verified_by = coalesce(v_actor, verified_by),
      verified_at = now(),
      evidence_notes = coalesce(p_notes, evidence_notes),
      rejection_reason = case when p_decision='rejected' then coalesce(p_notes,'Rejected by reviewer') else null end,
      updated_at = now()
  where id = p_entry_id
  returning * into v_row;

  return v_row;
end;
$function$;

revoke all on function public.verify_apprenticeship_rti_entry(uuid,integer,text,text) from public;
revoke all on function public.verify_apprenticeship_rti_entry(uuid,integer,text,text) from anon;
grant execute on function public.verify_apprenticeship_rti_entry(uuid,integer,text,text) to authenticated;
grant execute on function public.verify_apprenticeship_rti_entry(uuid,integer,text,text) to service_role;
