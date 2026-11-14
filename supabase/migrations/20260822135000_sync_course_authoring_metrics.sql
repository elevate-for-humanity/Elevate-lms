-- Derive procurement-critical hours/count/generation metadata from the
-- canonical lesson graph instead of legacy defaults or duplicated writers.

create or replace function public.sync_course_authoring_metrics()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_course_id uuid;
  v_new_module_id uuid;
  v_old_module_id uuid;
  v_total integer;
  v_bad_generation integer;
  v_minutes numeric;
begin
  v_course_id := coalesce(new.course_id, old.course_id);
  v_new_module_id := case when tg_op <> 'DELETE' then new.module_id else null end;
  v_old_module_id := case when tg_op <> 'INSERT' then old.module_id else null end;

  if v_course_id is null then
    return coalesce(new, old);
  end if;

  if v_new_module_id is not null then
    update public.course_modules m
    set target_hours = coalesce((
          select round(coalesce(sum(l.duration_minutes), 0)::numeric / 60.0, 2)
          from public.course_lessons l
          where l.module_id = v_new_module_id
            and coalesce(l.is_required, true) = true
        ), 0),
        updated_at = now()
    where m.id = v_new_module_id;
  end if;

  if v_old_module_id is not null and v_old_module_id is distinct from v_new_module_id then
    update public.course_modules m
    set target_hours = coalesce((
          select round(coalesce(sum(l.duration_minutes), 0)::numeric / 60.0, 2)
          from public.course_lessons l
          where l.module_id = v_old_module_id
            and coalesce(l.is_required, true) = true
        ), 0),
        updated_at = now()
    where m.id = v_old_module_id;
  end if;

  select
    count(*)::integer,
    count(*) filter (
      where coalesce(generation_status, '') not in ('generated','complete','completed','verification_ready','certificate_ready','published')
    )::integer,
    coalesce(sum(duration_minutes), 0)::numeric
  into v_total, v_bad_generation, v_minutes
  from public.course_lessons
  where course_id = v_course_id
    and coalesce(is_required, true) = true;

  update public.courses
  set duration_hours = round(v_minutes / 60.0, 2),
      total_lessons = v_total,
      generation_status = case
        when v_total > 0 and v_bad_generation = 0 then 'completed'
        else 'draft'
      end,
      generation_progress = case
        when v_total > 0 and v_bad_generation = 0 then 100
        else 0
      end,
      updated_at = now()
  where id = v_course_id;

  return coalesce(new, old);
end;
$function$;

drop trigger if exists trg_course_lessons_sync_authoring_metrics_insert_delete on public.course_lessons;
create trigger trg_course_lessons_sync_authoring_metrics_insert_delete
after insert or delete on public.course_lessons
for each row execute function public.sync_course_authoring_metrics();

drop trigger if exists trg_course_lessons_sync_authoring_metrics_update on public.course_lessons;
create trigger trg_course_lessons_sync_authoring_metrics_update
after update of duration_minutes, module_id, is_required, generation_status
on public.course_lessons
for each row execute function public.sync_course_authoring_metrics();
