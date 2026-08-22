-- Canonical publication database backstop. Human review is intentionally not a
-- publication checkpoint: Course Builder's objective governance/procurement
-- validator is the automated approval authority.
create or replace function public.publish_course(p_course_id uuid)
returns public.courses
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_course public.courses;
  v_module_count integer;
  v_null_ct_count integer;
  v_gating_count integer;
  v_mod record;
  v_lesson_count integer;
  v_required_count integer;
  v_role text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
    select role into v_role from public.profiles where id = auth.uid();
    if v_role is null or v_role not in ('admin','super_admin','program_holder') then raise exception 'Publishing role required' using errcode='42501'; end if;
  end if;
  select * into v_course from public.courses where id = p_course_id for update;
  if not found then raise exception 'PUBLISH_BLOCKED: course % not found', p_course_id; end if;
  select count(*)::integer into v_required_count from public.course_lessons where course_id=p_course_id and coalesce(is_required,true)=true;
  if v_required_count=0 then raise exception 'PUBLISH_BLOCKED: course has no required lessons'; end if;
  if not public.course_is_publishable(p_course_id) then raise exception 'PUBLISH_BLOCKED: course % needs title, slug, at least one module, and at least one lesson', p_course_id; end if;
  select count(*) into v_null_ct_count from public.course_lessons where course_id=p_course_id and lesson_type is null;
  if v_null_ct_count>0 then raise exception 'PUBLISH_BLOCKED: % lesson(s) have NULL lesson_type',v_null_ct_count; end if;
  for v_mod in select cm.id,cm.title from public.course_modules cm where cm.course_id=p_course_id loop
    select count(*) into v_lesson_count from public.course_lessons where module_id=v_mod.id;
    if v_lesson_count=0 then raise exception 'PUBLISH_BLOCKED: module "%" has no lessons',v_mod.title; end if;
  end loop;
  select count(*) into v_gating_count from public.module_completion_rules where course_id=p_course_id;
  select count(*) into v_module_count from public.course_modules where course_id=p_course_id;
  if v_module_count>1 and v_gating_count=0 then raise exception 'PUBLISH_BLOCKED: course % has % modules but no module_completion_rules',p_course_id,v_module_count; end if;
  update public.course_lessons set status='published',is_published=true,published_at=coalesce(published_at,now()),generation_status=case when generation_status in ('generated','completed','verification_ready','certificate_ready') then 'published' else generation_status end,updated_at=now() where course_id=p_course_id;
  update public.course_modules set is_published=true,is_draft=false,updated_at=now() where course_id=p_course_id;
  update public.courses set status='published',is_active=true,published_at=coalesce(published_at,now()),generation_status='published',generation_progress=100,total_lessons=v_required_count,updated_at=now() where id=p_course_id returning * into v_course;
  return v_course;
end;
$function$;
