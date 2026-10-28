-- Program-owned practice targets. These are not state-law service counts and
-- do not replace registered Appendix A competency or OJL/RTI evidence.
create table if not exists public.apprenticeship_practical_service_requirements (
  id uuid primary key default gen_random_uuid(),
  program_slug text not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  service_name text not null,
  exercise_title text not null,
  instructions text not null,
  required_count integer not null check (required_count > 0),
  allowed_subject_types text[] not null default array['patron','mannequin','student']::text[],
  counts_for_completion boolean not null default true,
  authority text not null default 'elevate-program-practice',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_slug, lesson_id, service_name),
  check (cardinality(allowed_subject_types) > 0),
  check (allowed_subject_types <@ array['patron','mannequin','student']::text[])
);

create index if not exists apprenticeship_practical_service_requirements_program_idx
  on public.apprenticeship_practical_service_requirements(program_slug, counts_for_completion);
create index if not exists apprenticeship_practical_service_requirements_course_idx
  on public.apprenticeship_practical_service_requirements(course_id, lesson_id);

alter table public.apprenticeship_practical_service_requirements enable row level security;
revoke all on public.apprenticeship_practical_service_requirements from anon, authenticated;
grant select, insert, update, delete on public.apprenticeship_practical_service_requirements to service_role;

create or replace view public.host_shop_practical_service_progress
with (security_invoker = true)
as
select enrollment_id, student_id, service_name, count(*)::integer as recorded_count,
       max(verified_at) as last_verified_at
from public.host_shop_practical_service_entries
where voided_at is null and verified_at is not null
group by enrollment_id, student_id, service_name;

revoke all on public.host_shop_practical_service_progress from anon, authenticated;
grant select on public.host_shop_practical_service_progress to service_role;

insert into public.apprenticeship_practical_service_requirements
  (program_slug,course_id,lesson_id,service_name,exercise_title,instructions,required_count,allowed_subject_types,counts_for_completion,authority)
select 'cosmetology-apprenticeship', l.course_id, l.id,
  case
    when l.title ilike 'Haircutting%' then 'Haircut'
    when l.title ilike 'Hair Coloring%' then 'Single-process color'
    when l.title ilike 'Facial Services%' then 'Basic facial'
  end,
  l.title,
  case
    when l.title ilike 'Haircutting%' then 'Complete consultation, draping, sectioning, the instructor-approved haircut, finish check, tool processing and station cleanup. The Host Shop owner records the service after observing the complete safe workflow.'
    when l.title ilike 'Hair Coloring%' then 'Complete consultation and required product tests, formula and sectioning plan, safe application, manufacturer-directed processing and rinse, result review, cleanup and documentation. The Host Shop owner records the observed service.'
    when l.title ilike 'Facial Services%' then 'Complete consultation and contraindication screening, hand hygiene and setup, cleanse and skin analysis, the approved facial sequence, client aftercare, implement processing and station cleanup. The Host Shop owner records the observed service.'
  end,
  greatest(coalesce(l.required_reps,1),1),
  array['patron','mannequin','student']::text[], true, 'existing-course-required-reps'
from public.course_lessons l
where l.course_id='a6b0b712-1cf0-475a-ba79-ee2023dea8ec'::uuid
  and l.practical_required is true
  and (l.title ilike 'Haircutting%' or l.title ilike 'Hair Coloring%' or l.title ilike 'Facial Services%')
on conflict (program_slug,lesson_id,service_name) do update
set exercise_title=excluded.exercise_title,
    instructions=excluded.instructions,
    required_count=excluded.required_count,
    allowed_subject_types=excluded.allowed_subject_types,
    counts_for_completion=excluded.counts_for_completion,
    authority=excluded.authority,
    updated_at=now();
