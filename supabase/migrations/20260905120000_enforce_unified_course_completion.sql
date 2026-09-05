-- Keep all Course Builder work paused while the single-authority architecture
-- is deployed and verified. Resuming is an explicit operator action.
insert into public.system_settings (key, value, updated_at)
values ('course_builder_generation_paused', 'true'::jsonb, now())
on conflict (key) do update
set value = excluded.value,
    updated_at = excluded.updated_at;

-- AI-generated lessons may exist while their media is being rendered, but they
-- cannot enter a completion/publish state without the canonical generated video
-- and its approved quality evidence.
create or replace function public.enforce_unified_lesson_completion()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if coalesce(new.ai_generated, false)
     and new.generation_status in ('approved', 'complete', 'completed', 'published')
     and not (
       nullif(btrim(new.video_url), '') is not null
       and new.video_status = 'complete'
       and new.media_origin = 'generated'
       and new.media_quality_status = 'approved'
       and new.media_quality_evidence <> '{}'::jsonb
       and new.video_job_id is not null
       and exists (
         select 1
         from public.video_jobs job
         where job.id = new.video_job_id
           and job.course_id = new.course_id
           and job.lesson_id = new.id
           and coalesce(job.asset_kind, 'lesson') = 'lesson'
           and job.status = 'complete'
           and job.review_status = 'approved'
           and nullif(btrim(job.video_url), '') is not null
           and job.video_url = new.video_url
           and coalesce(job.quality_evidence, '{}'::jsonb) <> '{}'::jsonb
       )
     ) then
    raise exception using
      errcode = 'check_violation',
      message = format('AI lesson %s cannot be completed without its approved canonical video', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_unified_lesson_completion_trigger on public.course_lessons;
create trigger enforce_unified_lesson_completion_trigger
before insert or update of generation_status, video_url, video_status,
  media_origin, media_quality_status, media_quality_evidence, video_job_id
on public.course_lessons
for each row execute function public.enforce_unified_lesson_completion();

-- A generated course cannot report 100% or completed until every required
-- AI-generated lesson has a matching approved canonical lesson-video job.
create or replace function public.enforce_unified_course_completion()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  generated_lesson_count integer;
  incomplete_lesson_count integer;
begin
  if (new.generation_status = 'completed' or new.generation_progress = 100)
     and (
       tg_op = 'INSERT'
       or old.generation_status is distinct from new.generation_status
       or old.generation_progress is distinct from new.generation_progress
     ) then
    select count(*)
    into generated_lesson_count
    from public.course_lessons lesson
    where lesson.course_id = new.id
      and coalesce(lesson.ai_generated, false);

    if generated_lesson_count > 0 then
      select count(*)
      into incomplete_lesson_count
      from public.course_lessons lesson
      where lesson.course_id = new.id
        and coalesce(lesson.ai_generated, false)
        and coalesce(lesson.is_required, true)
        and not (
          nullif(btrim(lesson.video_url), '') is not null
          and lesson.video_status = 'complete'
          and lesson.media_origin = 'generated'
          and lesson.media_quality_status = 'approved'
          and lesson.media_quality_evidence <> '{}'::jsonb
          and lesson.video_job_id is not null
          and exists (
            select 1
            from public.video_jobs job
            where job.id = lesson.video_job_id
              and job.course_id = new.id
              and job.lesson_id = lesson.id
              and coalesce(job.asset_kind, 'lesson') = 'lesson'
              and job.status = 'complete'
              and job.review_status = 'approved'
              and nullif(btrim(job.video_url), '') is not null
              and job.video_url = lesson.video_url
              and coalesce(job.quality_evidence, '{}'::jsonb) <> '{}'::jsonb
          )
        );

      if incomplete_lesson_count > 0 then
        raise exception using
          errcode = 'check_violation',
          message = format(
            'Generated course %s cannot be completed: %s required lesson video package(s) are incomplete',
            new.id,
            incomplete_lesson_count
          );
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_unified_course_completion_trigger on public.courses;
create trigger enforce_unified_course_completion_trigger
before insert or update of generation_status, generation_progress
on public.courses
for each row execute function public.enforce_unified_course_completion();

revoke execute on function public.enforce_unified_lesson_completion() from public, anon, authenticated;
revoke execute on function public.enforce_unified_course_completion() from public, anon, authenticated;

comment on function public.enforce_unified_lesson_completion() is
  'Prevents AI lesson completion/publication unless its canonical lesson video and quality evidence are approved.';
comment on function public.enforce_unified_course_completion() is
  'Prevents generated course completion at 100 percent until every required AI lesson has approved canonical media.';
