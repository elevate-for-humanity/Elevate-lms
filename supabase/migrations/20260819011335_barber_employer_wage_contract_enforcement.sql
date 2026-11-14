-- Registered Barber wage obligations must combine the immutable occupation
-- baseline, the active employer-specific RAPIDS wage schedule, and any higher
-- legal minimum. Do not flatten employer schedules into Appendix A.

alter table public.apprenticeship_wage_obligations
  add column if not exists employer_registered_rate numeric(10,2);

alter table public.apprenticeship_wage_obligations
  drop column if exists required_hourly_rate;

alter table public.apprenticeship_wage_obligations
  add column required_hourly_rate numeric(10,2)
  generated always as (
    greatest(
      appendix_hourly_rate,
      coalesce(employer_registered_rate, appendix_hourly_rate),
      coalesce(legal_minimum_override, appendix_hourly_rate)
    )
  ) stored;

create or replace function public.sync_barber_wage_obligation(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_slug text;
  v_student_id uuid;
  v_completed integer;
  v_threshold integer;
  v_rate numeric(10,2);
  v_placement uuid;
  v_partner_id uuid;
  v_final_threshold integer;
  v_employer_start numeric(10,2);
  v_employer_end numeric(10,2);
  v_employer_rate numeric(10,2);
begin
  select program_slug, coalesce(user_id, student_id)
    into v_program_slug, v_student_id
  from public.program_enrollments
  where id = p_enrollment_id;

  if v_program_slug is distinct from 'barber-apprenticeship' then
    return;
  end if;

  select count(distinct competency_id)
    into v_completed
  from public.apprentice_competency_records
  where enrollment_id = p_enrollment_id
    and completed = true;

  select ap.id, s.partner_id
    into v_placement, v_partner_id
  from public.apprentice_placements ap
  join public.shops s on s.id = ap.shop_id
  where ap.student_id = v_student_id
    and ap.program_slug = 'barber-apprenticeship'
    and ap.status = 'active'
  order by ap.start_date desc nulls last, ap.created_at desc
  limit 1;

  select max(completed_competencies)
    into v_final_threshold
  from public.apprenticeship_wage_milestones
  where standard_key = 'barber-0030cb-2025-07-10';

  if v_partner_id is not null then
    select starting_hourly_rate,
           coalesce(ending_hourly_rate, journeyworker_hourly_rate, starting_hourly_rate)
      into v_employer_start, v_employer_end
    from public.rapids_employer_wage_schedules
    where partner_id = v_partner_id
      and sponsor_registration_number = '2025-IN-132301'
      and occupation_code = '0030CB'
      and is_active = true
      and (effective_from is null or effective_from <= current_date)
      and (effective_to is null or effective_to >= current_date)
    order by effective_from desc nulls last, updated_at desc
    limit 1;
  end if;

  for v_threshold, v_rate in
    select completed_competencies, appendix_hourly_rate
    from public.apprenticeship_wage_milestones
    where standard_key = 'barber-0030cb-2025-07-10'
      and completed_competencies <= v_completed
    order by completed_competencies
  loop
    v_employer_rate := case
      when v_threshold = v_final_threshold then coalesce(v_employer_end, v_employer_start)
      else v_employer_start
    end;

    insert into public.apprenticeship_wage_obligations(
      enrollment_id,
      placement_id,
      standard_key,
      completed_competencies,
      appendix_hourly_rate,
      employer_registered_rate,
      effective_date,
      status
    ) values (
      p_enrollment_id,
      v_placement,
      'barber-0030cb-2025-07-10',
      v_threshold,
      v_rate,
      v_employer_rate,
      current_date,
      'pending'
    )
    on conflict(enrollment_id, standard_key, completed_competencies)
    do update set
      placement_id = excluded.placement_id,
      appendix_hourly_rate = excluded.appendix_hourly_rate,
      employer_registered_rate = excluded.employer_registered_rate,
      status = case
        when public.apprenticeship_wage_obligations.verified_wage is not null
         and public.apprenticeship_wage_obligations.verified_wage >= greatest(
           excluded.appendix_hourly_rate,
           coalesce(excluded.employer_registered_rate, excluded.appendix_hourly_rate),
           coalesce(public.apprenticeship_wage_obligations.legal_minimum_override, excluded.appendix_hourly_rate)
         )
        then public.apprenticeship_wage_obligations.status
        else 'pending'
      end;
  end loop;

  update public.apprenticeship_wage_obligations
  set status = 'superseded'
  where enrollment_id = p_enrollment_id
    and standard_key = 'barber-0030cb-2025-07-10'
    and completed_competencies < (
      select coalesce(max(completed_competencies), 0)
      from public.apprenticeship_wage_obligations
      where enrollment_id = p_enrollment_id
        and standard_key = 'barber-0030cb-2025-07-10'
    )
    and status = 'pending';
end;
$$;

create or replace function public.trg_resync_barber_wages_for_employer_schedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_partner_id uuid;
begin
  v_partner_id := coalesce(new.partner_id, old.partner_id);

  for r in
    select distinct pe.id as enrollment_id
    from public.program_enrollments pe
    join public.apprentice_placements ap
      on ap.student_id = coalesce(pe.user_id, pe.student_id)
     and ap.program_slug = pe.program_slug
     and ap.status = 'active'
    join public.shops s on s.id = ap.shop_id
    where pe.program_slug = 'barber-apprenticeship'
      and pe.status in ('active', 'enrolled', 'in_progress', 'confirmed')
      and s.partner_id = v_partner_id
  loop
    perform public.sync_barber_wage_obligation(r.enrollment_id);
  end loop;

  return coalesce(new, old);
end;
$$;

drop trigger if exists resync_barber_wages_after_employer_schedule
  on public.rapids_employer_wage_schedules;

create trigger resync_barber_wages_after_employer_schedule
after insert or update of starting_hourly_rate, ending_hourly_rate,
  journeyworker_hourly_rate, is_active, effective_from, effective_to or delete
on public.rapids_employer_wage_schedules
for each row
execute function public.trg_resync_barber_wages_for_employer_schedule();

revoke all on function public.sync_barber_wage_obligation(uuid)
  from public, anon, authenticated;
grant execute on function public.sync_barber_wage_obligation(uuid)
  to service_role;
revoke all on function public.trg_resync_barber_wages_for_employer_schedule()
  from public, anon, authenticated;
