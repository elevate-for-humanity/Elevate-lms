-- Align the public program/enrollment contract and wage progression to Appendix A.

update public.programs
set
  min_rti_hours=260,
  min_ojl_hours=null,
  total_hours=null,
  required_hours=260,
  hours=260,
  training_hours=260,
  estimated_hours=null,
  lms_model='internal',
  lms_config=coalesce(lms_config,'{}'::jsonb) || jsonb_build_object(
    'standard_key','barber-0030cb-2025-07-10',
    'progress_model','competency_based',
    'rti_hours',260,
    'competency_count',14,
    'apprentice_to_mentor_ratio','1:1',
    'probationary_hours',500,
    'rapids_code','0030CB'
  ),
  completion_criteria=jsonb_build_object(
    'model','competency_based',
    'required_competencies',14,
    'required_rti_hours',260,
    'requires_host_shop_verification',true,
    'requires_wage_progression_evidence',true,
    'requires_signed_agreement',true,
    'source','USDOL Appendix A revision 2025-07-10'
  ),
  slug_aliases=array['barber','barber-2024'],
  dol_registered=true,
  is_apprenticeship=true,
  requires_employer_match=true,
  hero_image_url=coalesce(hero_image_url,'/images/barber-hero-new.webp'),
  hero_image=coalesce(hero_image,'/images/barber-hero-new.webp'),
  updated_at=now()
where slug='barber-apprenticeship';

create table if not exists public.apprenticeship_wage_obligations (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  placement_id uuid references public.apprentice_placements(id) on delete set null,
  standard_key text not null references public.apprenticeship_standard_versions(standard_key),
  completed_competencies integer not null,
  appendix_hourly_rate numeric(10,2) not null,
  legal_minimum_override numeric(10,2),
  required_hourly_rate numeric(10,2) generated always as (
    greatest(appendix_hourly_rate,coalesce(legal_minimum_override,appendix_hourly_rate))
  ) stored,
  triggered_at timestamptz not null default now(),
  effective_date date,
  status text not null default 'pending' check (status in ('pending','acknowledged','verified','superseded')),
  verified_wage numeric(10,2),
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  evidence_notes text,
  unique(enrollment_id,standard_key,completed_competencies)
);

create or replace function public.sync_barber_wage_obligation(p_enrollment_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_program_slug text;
  v_student_id uuid;
  v_completed integer;
  v_threshold integer;
  v_rate numeric(10,2);
  v_placement uuid;
begin
  select program_slug,coalesce(user_id,student_id)
  into v_program_slug,v_student_id
  from public.program_enrollments where id=p_enrollment_id;

  if v_program_slug is distinct from 'barber-apprenticeship' then return; end if;

  select count(distinct competency_id)
  into v_completed
  from public.apprentice_competency_records
  where enrollment_id=p_enrollment_id and completed=true;

  select id into v_placement
  from public.apprentice_placements
  where student_id=v_student_id and program_slug='barber-apprenticeship' and status='active'
  order by start_date desc nulls last,created_at desc
  limit 1;

  for v_threshold,v_rate in
    select completed_competencies,appendix_hourly_rate
    from public.apprenticeship_wage_milestones
    where standard_key='barber-0030cb-2025-07-10' and completed_competencies<=v_completed
    order by completed_competencies
  loop
    insert into public.apprenticeship_wage_obligations(
      enrollment_id,placement_id,standard_key,completed_competencies,appendix_hourly_rate,effective_date,status
    ) values (
      p_enrollment_id,v_placement,'barber-0030cb-2025-07-10',v_threshold,v_rate,current_date,'pending'
    ) on conflict(enrollment_id,standard_key,completed_competencies) do nothing;
  end loop;

  update public.apprenticeship_wage_obligations
  set status='superseded'
  where enrollment_id=p_enrollment_id
    and standard_key='barber-0030cb-2025-07-10'
    and completed_competencies < (
      select coalesce(max(completed_competencies),0)
      from public.apprenticeship_wage_obligations
      where enrollment_id=p_enrollment_id and standard_key='barber-0030cb-2025-07-10'
    )
    and status='pending';
end;
$$;

create or replace function public.trg_sync_barber_wage_obligation()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.sync_barber_wage_obligation(new.enrollment_id);
  return new;
end;
$$;

drop trigger if exists sync_barber_wage_obligation_after_competency on public.apprentice_competency_records;
create trigger sync_barber_wage_obligation_after_competency
after insert or update of completed on public.apprentice_competency_records
for each row execute function public.trg_sync_barber_wage_obligation();

create or replace view public.barber_appendix_a_progress_audit
with (security_invoker=true) as
select
  pe.id enrollment_id,
  coalesce(pe.user_id,pe.student_id) apprentice_user_id,
  pe.program_slug,
  count(distinct acr.competency_id) filter (where acr.completed=true) completed_competencies,
  14 required_competencies,
  round((count(distinct acr.competency_id) filter (where acr.completed=true)::numeric/14::numeric)*100,1) competency_progress_percent,
  (select max(appendix_hourly_rate)
   from public.apprenticeship_wage_milestones wm
   where wm.standard_key='barber-0030cb-2025-07-10'
     and wm.completed_competencies<=count(distinct acr.competency_id) filter (where acr.completed=true)) appendix_wage_floor,
  260 required_rti_hours,
  pe.rapids_status,
  pe.rapids_id,
  pe.host_shop_id,
  pe.supervisor_id
from public.program_enrollments pe
left join public.apprentice_competency_records acr on acr.enrollment_id=pe.id
where pe.program_slug='barber-apprenticeship'
group by pe.id;
