create or replace function public.enforce_single_registered_apprenticeship_course()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_slug text;
begin
  if new.program_id is null then
    return new;
  end if;

  select p.slug
    into v_program_slug
  from public.programs p
  join public.apprenticeship_standard_versions s
    on s.program_slug = p.slug
   and s.is_active = true
  where p.id = new.program_id
  limit 1;

  if v_program_slug is null then
    return new;
  end if;

  if new.slug is distinct from v_program_slug then
    raise exception 'Registered apprenticeship course slug must equal canonical program slug %', v_program_slug
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.courses c
    where c.program_id = new.program_id
      and c.id <> new.id
  ) then
    raise exception 'Registered apprenticeship program % may have only one canonical course', v_program_slug
      using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_single_registered_apprenticeship_course on public.courses;
create trigger trg_enforce_single_registered_apprenticeship_course
before insert or update of program_id, slug on public.courses
for each row execute function public.enforce_single_registered_apprenticeship_course();

comment on function public.enforce_single_registered_apprenticeship_course() is
'Prevents duplicate/alternate-slug course shells for active registered apprenticeship occupations. Course Factory must publish one course whose slug matches the canonical program slug.';
