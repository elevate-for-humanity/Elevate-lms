
-- Credential lessons are one atomic lesson + media package.
-- A credential lesson may be persisted only when its teaching package already
-- contains the locked narration/storyboard contract, and its primary video job
-- is created in the same transaction.

create or replace function public.attach_credential_lesson_primary_media_job()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_profile text;
  v_job_id uuid;
  v_scene_count integer;
  v_caption_count integer;
  v_event_count integer;
  v_experience jsonb;
begin
  select compliance_profile_key
    into v_profile
  from public.courses
  where id = new.course_id;

  if v_profile is null or v_profile = 'internal_basic' then
    return new;
  end if;

  v_experience := coalesce(new.content_json->'experience', '{}'::jsonb);

  if jsonb_typeof(v_experience) <> 'object'
     or not (v_experience ? 'readingGuide')
     or not (v_experience ? 'narrationScript')
     or not (v_experience ? 'knowledgeChecks')
     or not (v_experience ? 'scenario')
     or not (v_experience ? 'caseStudy')
     or not (v_experience ? 'exercises')
     or not (v_experience ? 'practicalTask')
     or not (v_experience ? 'remediation') then
    raise exception 'CREDENTIAL_LESSON_PACKAGE_INCOMPLETE:%', new.slug;
  end if;

  if jsonb_typeof(coalesce(new.learning_objectives, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(new.learning_objectives, '[]'::jsonb)) < 1 then
    raise exception 'CREDENTIAL_LESSON_OBJECTIVES_REQUIRED:%', new.slug;
  end if;

  if nullif(trim(coalesce(new.domain_key, '')), '') is null then
    raise exception 'CREDENTIAL_LESSON_DOMAIN_REQUIRED:%', new.slug;
  end if;

  if nullif(trim(coalesce(new.script, new.script_text, '')), '') is null
     or length(trim(coalesce(new.script, new.script_text, ''))) < 200 then
    raise exception 'CREDENTIAL_LESSON_NARRATION_REQUIRED:%', new.slug;
  end if;

  if coalesce((new.video_config->>'narration_locked')::boolean, false) is not true
     or nullif(trim(coalesce(new.video_config->>'source_fingerprint', '')), '') is null then
    raise exception 'CREDENTIAL_LESSON_SOURCE_LOCK_REQUIRED:%', new.slug;
  end if;

  if jsonb_typeof(coalesce(new.scene_data->'scenes', '[]'::jsonb)) <> 'array' then
    raise exception 'CREDENTIAL_LESSON_STORYBOARD_REQUIRED:%', new.slug;
  end if;

  v_scene_count := jsonb_array_length(coalesce(new.scene_data->'scenes', '[]'::jsonb));
  if v_scene_count < 6 then
    raise exception 'CREDENTIAL_LESSON_STORYBOARD_MIN_6:%', new.slug;
  end if;

  if jsonb_typeof(coalesce(new.scene_data->'captions', '[]'::jsonb)) <> 'array' then
    raise exception 'CREDENTIAL_LESSON_CAPTIONS_REQUIRED:%', new.slug;
  end if;
  v_caption_count := jsonb_array_length(coalesce(new.scene_data->'captions', '[]'::jsonb));
  if v_caption_count < 1 then
    raise exception 'CREDENTIAL_LESSON_CAPTIONS_REQUIRED:%', new.slug;
  end if;

  if jsonb_typeof(coalesce(new.scene_data->'timeline_events', '[]'::jsonb)) <> 'array' then
    raise exception 'CREDENTIAL_LESSON_INTERACTION_EVENT_REQUIRED:%', new.slug;
  end if;
  v_event_count := jsonb_array_length(coalesce(new.scene_data->'timeline_events', '[]'::jsonb));
  if v_event_count < 1 then
    raise exception 'CREDENTIAL_LESSON_INTERACTION_EVENT_REQUIRED:%', new.slug;
  end if;

  insert into public.video_jobs (
    lesson_id,
    course_id,
    lesson_title,
    script,
    bullet_points,
    scene_data,
    asset_kind,
    asset_key,
    status,
    queued_at,
    retry_count,
    review_status,
    quality_evidence,
    created_at,
    updated_at
  ) values (
    new.id,
    new.course_id,
    new.title,
    coalesce(new.script, new.script_text),
    case
      when jsonb_typeof(new.learning_objectives) = 'array'
        then new.learning_objectives
      else '[]'::jsonb
    end,
    new.scene_data,
    'lesson',
    null,
    'queued',
    now(),
    0,
    'not_ready',
    '{}'::jsonb,
    now(),
    now()
  )
  returning id into v_job_id;

  update public.course_lessons
  set
    video_job_id = v_job_id,
    video_status = 'queued',
    video_error = null,
    media_quality_status = 'pending',
    media_quality_evidence = '{}'::jsonb,
    approved = false,
    is_published = false,
    status = 'draft',
    generation_status = 'generating',
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_attach_credential_lesson_primary_media_job on public.course_lessons;
create trigger trg_attach_credential_lesson_primary_media_job
after insert on public.course_lessons
for each row
execute function public.attach_credential_lesson_primary_media_job();

create or replace function public.enforce_credential_lesson_media_completion()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_profile text;
  v_job_status text;
  v_review_status text;
  v_job_url text;
begin
  select compliance_profile_key
    into v_profile
  from public.courses
  where id = new.course_id;

  if v_profile is null or v_profile = 'internal_basic' then
    return new;
  end if;

  if (
    new.generation_status in ('generated','verification_ready','certificate_ready','approved','complete','completed','published')
    or new.approved = true
    or new.is_published = true
    or new.status = 'published'
  ) then
    if new.video_job_id is null then
      raise exception 'CREDENTIAL_LESSON_PRIMARY_VIDEO_JOB_REQUIRED:%', new.slug;
    end if;

    select status, review_status, video_url
      into v_job_status, v_review_status, v_job_url
    from public.video_jobs
    where id = new.video_job_id
      and lesson_id = new.id
      and course_id = new.course_id
      and asset_kind = 'lesson'
      and asset_key is null;

    if v_job_status is distinct from 'complete'
       or v_review_status is distinct from 'approved'
       or nullif(trim(coalesce(v_job_url, '')), '') is null
       or new.video_status is distinct from 'complete'
       or new.media_quality_status is distinct from 'approved'
       or nullif(trim(coalesce(new.video_url, '')), '') is null then
      raise exception 'CREDENTIAL_LESSON_MEDIA_NOT_APPROVED:%', new.slug;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_credential_lesson_media_completion on public.course_lessons;
create trigger trg_enforce_credential_lesson_media_completion
before update of generation_status, approved, is_published, status, video_status, media_quality_status, video_url
on public.course_lessons
for each row
execute function public.enforce_credential_lesson_media_completion();
