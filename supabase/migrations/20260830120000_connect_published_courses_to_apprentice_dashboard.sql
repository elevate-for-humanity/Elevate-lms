-- The apprentice dashboard resolves its course card from
-- program_enrollments.course_id. Connect only the canonical Cosmetology
-- Apprenticeship after its course passes publication.

create or replace function public.sync_published_cosmetology_to_apprentice_dashboard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  if new.slug is distinct from 'cosmetology-apprenticeship'
     or new.program_id is null
     or new.is_active is distinct from true
     or new.status is distinct from 'published' then
    return new;
  end if;

  update public.program_enrollments pe
  set course_id = new.id,
      updated_at = now()
  where pe.program_id = new.program_id
    and pe.user_id is not null
    and coalesce(pe.enrollment_state, pe.status) = 'active'
    and pe.course_id is distinct from new.id;

  return new;
end;
$function$;

drop trigger if exists trg_sync_published_cosmetology_dashboard on public.courses;
create trigger trg_sync_published_cosmetology_dashboard
after insert or update of program_id, slug, status, is_active on public.courses
for each row execute function public.sync_published_cosmetology_to_apprentice_dashboard();

-- Repair the dashboard pointer only for an already-published canonical
-- Cosmetology course. Inactive enrollments remain unchanged.
update public.program_enrollments pe
set course_id = c.id,
    updated_at = now()
from public.courses c
where c.program_id = pe.program_id
  and c.slug = 'cosmetology-apprenticeship'
  and c.status = 'published'
  and c.is_active = true
  and pe.user_id is not null
  and coalesce(pe.enrollment_state, pe.status) = 'active'
  and pe.course_id is distinct from c.id;
