-- Keep the canonical program/course resolver and program LMS delivery flags in sync
-- whenever Course Builder persists the program's primary course.

create or replace function public.sync_canonical_program_course_authority()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_program_slug text;
begin
  if new.program_id is null or nullif(trim(new.slug), '') is null then
    return new;
  end if;

  select slug
    into v_program_slug
  from public.programs
  where id = new.program_id;

  -- Only the course whose slug matches the program slug becomes the canonical
  -- program-level course. Additional courses remain linked through their own
  -- explicit program/course relationship workflows.
  if v_program_slug is null or new.slug <> v_program_slug then
    return new;
  end if;

  insert into public.program_course_map (program_slug, course_id, updated_at)
  values (v_program_slug, new.id, now())
  on conflict (program_slug)
  do update set
    course_id = excluded.course_id,
    updated_at = now();

  update public.programs
  set
    has_lms_course = true,
    lms_model = 'internal',
    delivery_model = 'internal_lms',
    updated_at = now()
  where id = new.program_id
    and (
      has_lms_course is distinct from true
      or lms_model is distinct from 'internal'
      or delivery_model is distinct from 'internal_lms'
    );

  return new;
end;
$$;

revoke all on function public.sync_canonical_program_course_authority() from public;

drop trigger if exists trg_sync_canonical_program_course_authority on public.courses;
create trigger trg_sync_canonical_program_course_authority
after insert or update of program_id, slug on public.courses
for each row
execute function public.sync_canonical_program_course_authority();

-- Repair existing canonical program/course rows without inventing relationships.
insert into public.program_course_map (program_slug, course_id, updated_at)
select p.slug, c.id, now()
from public.programs p
join public.courses c
  on c.program_id = p.id
 and c.slug = p.slug
where nullif(trim(p.slug), '') is not null
on conflict (program_slug)
do update set
  course_id = excluded.course_id,
  updated_at = now();

update public.programs p
set
  has_lms_course = true,
  lms_model = 'internal',
  delivery_model = 'internal_lms',
  updated_at = now()
where exists (
  select 1
  from public.courses c
  where c.program_id = p.id
    and c.slug = p.slug
)
and (
  p.has_lms_course is distinct from true
  or p.lms_model is distinct from 'internal'
  or p.delivery_model is distinct from 'internal_lms'
);
