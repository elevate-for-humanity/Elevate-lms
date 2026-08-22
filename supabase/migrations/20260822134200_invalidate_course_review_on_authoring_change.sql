-- A human approval applies to a specific course package. Any substantive
-- authoring change must invalidate that approval before publication can occur.

create or replace function public.invalidate_course_review_from_authoring_change()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_course_id uuid;
begin
  v_course_id := coalesce(new.course_id, old.course_id);
  if v_course_id is null then
    return coalesce(new, old);
  end if;

  update public.courses
  set review_status = 'draft',
      submitted_for_review_at = null,
      submitted_by = null,
      reviewed_at = null,
      reviewed_by = null,
      review_notes = null,
      updated_at = now()
  where id = v_course_id
    and coalesce(review_status, 'draft') <> 'draft';

  return coalesce(new, old);
end;
$function$;

drop trigger if exists trg_course_modules_invalidate_review_insert_delete on public.course_modules;
create trigger trg_course_modules_invalidate_review_insert_delete
after insert or delete on public.course_modules
for each row execute function public.invalidate_course_review_from_authoring_change();

drop trigger if exists trg_course_modules_invalidate_review_update on public.course_modules;
create trigger trg_course_modules_invalidate_review_update
after update of title, description, order_index, domain_key, target_hours, is_required
on public.course_modules
for each row execute function public.invalidate_course_review_from_authoring_change();

drop trigger if exists trg_course_lessons_invalidate_review_insert_delete on public.course_lessons;
create trigger trg_course_lessons_invalidate_review_insert_delete
after insert or delete on public.course_lessons
for each row execute function public.invalidate_course_review_from_authoring_change();

drop trigger if exists trg_course_lessons_invalidate_review_update on public.course_lessons;
create trigger trg_course_lessons_invalidate_review_update
after update of
  title,
  lesson_type,
  content,
  content_json,
  rendered_html,
  quiz_questions,
  passing_score,
  activities,
  duration_minutes,
  video_url,
  video_config,
  learning_objectives,
  competency_checks,
  instructor_notes,
  practical_required,
  required_artifacts,
  unlock_rule,
  partner_exam_code,
  domain_key,
  hour_category,
  evidence_type,
  delivery_method,
  requires_instructor_signoff,
  instructor_requirement,
  minimum_seat_time_minutes,
  fieldwork_eligible,
  is_required,
  compliance_profile_key,
  script_text,
  script,
  bullet_points,
  scene_data
on public.course_lessons
for each row execute function public.invalidate_course_review_from_authoring_change();
