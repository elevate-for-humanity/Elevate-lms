-- Enforce the publication boundary for all writers, including direct database
-- updates and admin shortcuts. Deferred checks allow an atomic publisher to
-- create the parent before its children, then validate the committed state.
create or replace function public.course_publication_ready(p_course_id uuid)
returns boolean
language sql
stable
set search_path = pg_catalog
as $function$
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and c.status = 'published'
      and c.is_active is true
      and c.published_at is not null
      and c.generation_status in ('completed', 'published')
      and nullif(btrim(c.slug), '') is not null
      and nullif(btrim(c.title), '') is not null
      and exists (select 1 from public.course_modules m where m.course_id = c.id)
      and exists (
        select 1 from public.course_lessons l where l.course_id = c.id
          and coalesce(l.is_required, true)
      )
      and not exists (
        select 1 from public.course_modules m where m.course_id = c.id
          and (m.is_published is not true or m.is_draft is not false
            or nullif(btrim(m.title), '') is null
            or not exists (
              select 1 from public.course_lessons l
              where l.course_id = c.id and l.module_id = m.id and l.is_published is true
            ))
      )
      and not exists (
        select 1 from public.course_lessons l where l.course_id = c.id
          and (l.is_published is not true or l.status is distinct from 'published'
            or nullif(btrim(l.title), '') is null or l.lesson_type is null
            or case when l.lesson_type::text in ('quiz', 'checkpoint', 'exam', 'certification') then
              case when jsonb_typeof(l.quiz_questions) = 'array'
                then jsonb_array_length(l.quiz_questions) = 0 else true end
            else
              nullif(btrim(l.rendered_html), '') is null
              and nullif(btrim(l.video_url), '') is null
              and coalesce(l.content::text, 'null') in ('null', '{}', '[]', '""')
              and coalesce(l.content_json::text, 'null') in ('null', '{}', '[]', '""')
            end
            or not exists (
              select 1 from public.course_modules m where m.course_id = c.id and m.id = l.module_id
            ))
      )
  )
$function$;

revoke all on function public.course_publication_ready(uuid) from public, anon, authenticated, service_role;

create or replace function public.enforce_course_publication_readiness()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
begin
  if tg_op = 'UPDATE' then
    if old.status = 'published' and (old.is_active is true or new.is_active is not true)
       and old.program_id is not distinct from new.program_id
       and old.published_at is not distinct from new.published_at
       and old.generation_status is not distinct from new.generation_status then
      return null;
    end if;
  end if;

  -- A later statement in this transaction can withdraw the publication.
  if exists (select 1 from public.courses c where c.id = new.id and c.status = 'published')
     and not public.course_publication_ready(new.id) then
    raise exception using errcode = '23514',
      message = 'PUBLISH_BLOCKED: Finish course generation and publish every complete module and lesson through Course Builder.';
  end if;
  return null;
end
$function$;

revoke all on function public.enforce_course_publication_readiness() from public, anon, authenticated, service_role;

create constraint trigger enforce_course_publication_readiness
after insert or update on public.courses
deferrable initially deferred
for each row when (new.status = 'published')
execute function public.enforce_course_publication_readiness();

create or replace function public.enforce_program_publication_readiness()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  program public.programs%rowtype;
begin
  if tg_op = 'UPDATE' then
    if old.published is true and (old.is_active is true or new.is_active is not true)
       and old.status is not distinct from new.status
       and old.has_lms_course is not distinct from new.has_lms_course
       and old.delivery_model is not distinct from new.delivery_model then
      return null;
    end if;
  end if;

  select * into program from public.programs where id = new.id and published is true;
  if not found then return null; end if;

  if nullif(btrim(program.slug), '') is null
     or nullif(btrim(program.title), '') is null
     or nullif(btrim(program.description), '') is null then
    raise exception using errcode = '23514',
      message = 'PUBLISH_BLOCKED: Supply the program slug, title, and description.';
  end if;

  if not exists (
      select 1 from public.program_media where program_id = program.id
        and media_type in ('hero_image', 'hero_video') and nullif(btrim(url), '') is not null
    ) or not exists (
      select 1 from public.program_ctas where program_id = program.id
        and nullif(btrim(label), '') is not null and nullif(btrim(href), '') is not null
    ) or not exists (
      select 1 from public.program_tracks where program_id = program.id
        and available is true and nullif(btrim(title), '') is not null
    ) then
    raise exception using errcode = '23514',
      message = 'PUBLISH_BLOCKED: Supply program hero media, a public call to action, and an available enrollment track.';
  end if;

  if (program.has_lms_course is true or program.delivery_model = 'internal_lms') and (
    not exists (
      select 1 from public.program_modules where program_id = program.id
        and is_published is true and nullif(btrim(title), '') is not null
    ) or not exists (
      select 1 from public.courses where program_id = program.id
        and public.course_publication_ready(id)
    )
  ) then
    raise exception using errcode = '23514',
      message = 'PUBLISH_BLOCKED: Publish the catalog outline and finish publishing the linked LMS course before listing the program.';
  end if;

  return null;
end
$function$;

revoke all on function public.enforce_program_publication_readiness() from public, anon, authenticated, service_role;

create constraint trigger enforce_program_publication_readiness
after insert or update on public.programs
deferrable initially deferred
for each row when (new.published is true)
execute function public.enforce_program_publication_readiness();

-- Version history and public visibility advance in the same transaction.
create or replace function public.publish_catalog_program(p_program_id uuid, p_actor_id uuid)
returns integer
language plpgsql
set search_path = pg_catalog
as $function$
declare
  program public.programs%rowtype;
  next_version integer;
  saved_at timestamptz := now();
  snapshot jsonb;
begin
  select * into program from public.programs where id = p_program_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Program not found'; end if;
  if program.review_status is distinct from 'approved' then
    raise exception using errcode = '23514', message = 'PUBLISH_BLOCKED: Approve the program before publishing.';
  end if;
  if program.org_id is null then
    raise exception using errcode = '23514', message = 'PUBLISH_BLOCKED: Assign the program to an organization.';
  end if;

  if nullif(btrim(program.hero_image_url), '') is not null and not exists (
    select 1 from public.program_media where program_id = program.id
      and media_type in ('hero_image', 'hero_video') and nullif(btrim(url), '') is not null
  ) then
    insert into public.program_media (program_id, media_type, url, alt_text, sort_order)
      values (program.id, 'hero_image', program.hero_image_url, program.title, 0);
  end if;

  next_version := coalesce(program.version, 0) + 1;
  snapshot := to_jsonb(program) || jsonb_build_object(
    'program_media', (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) from public.program_media m where m.program_id = program.id),
    'program_outcomes', (select coalesce(jsonb_agg(to_jsonb(o)), '[]'::jsonb) from public.program_outcomes o where o.program_id = program.id),
    'program_credentials', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from public.program_credentials c where c.program_id = program.id),
    'program_modules', (select coalesce(jsonb_agg(to_jsonb(m) || jsonb_build_object(
      'program_lessons', (select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) from public.program_lessons l where l.module_id = m.id)
    )), '[]'::jsonb) from public.program_modules m where m.program_id = program.id),
    'program_ctas', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from public.program_ctas c where c.program_id = program.id),
    'program_tracks', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.program_tracks t where t.program_id = program.id)
  );

  update public.programs set version = next_version, published = true, is_active = true,
    status = 'published', review_status = 'published', published_at = saved_at,
    published_by = p_actor_id, updated_at = saved_at
    where id = program.id;

  insert into public.program_versions
    (org_id, program_id, version, snapshot, created_by, created_at)
    values (program.org_id, program.id, next_version, snapshot, p_actor_id, saved_at);
  return next_version;
end
$function$;

revoke all on function public.publish_catalog_program(uuid, uuid) from public, anon, authenticated;
grant execute on function public.publish_catalog_program(uuid, uuid) to service_role;
