-- Make learner-facing media provenance and automated approval explicit.
alter table public.course_lessons
  add column if not exists media_origin text not null default 'none',
  add column if not exists media_quality_status text not null default 'unverified',
  add column if not exists media_quality_evidence jsonb not null default '{}'::jsonb,
  add column if not exists media_verified_at timestamptz;

alter table public.course_lessons drop constraint if exists course_lessons_media_origin_check;
alter table public.course_lessons add constraint course_lessons_media_origin_check
  check (media_origin in ('none', 'external_reference', 'generated', 'uploaded'));
alter table public.course_lessons drop constraint if exists course_lessons_media_quality_status_check;
alter table public.course_lessons add constraint course_lessons_media_quality_status_check
  check (media_quality_status in ('unverified', 'pending', 'approved', 'rejected'));

update public.course_lessons
set media_origin = case
      when nullif(btrim(video_url), '') is null then 'none'
      when video_url ~* '(youtube\.com|youtu\.be|vimeo\.com)' then 'external_reference'
      else 'uploaded'
    end,
    media_quality_status = 'unverified',
    media_quality_evidence = '{}'::jsonb,
    media_verified_at = null;

update public.course_lessons l
set media_origin = 'generated',
    media_quality_status = 'approved',
    media_quality_evidence = coalesce(j.quality_evidence, '{}'::jsonb),
    media_verified_at = coalesce(j.completed_at, j.updated_at, now())
from public.video_jobs j
where j.lesson_id = l.id
  and j.asset_kind = 'lesson'
  and j.status = 'complete'
  and j.review_status = 'approved'
  and nullif(btrim(j.video_url), '') is not null
  and j.video_url = l.video_url;

create index if not exists course_lessons_media_readiness_idx
  on public.course_lessons (course_id, media_origin, media_quality_status);

comment on column public.course_lessons.media_origin is
  'Source classification. External references never satisfy Course Builder generated-media readiness.';
comment on column public.course_lessons.media_quality_status is
  'Automated media quality-gate state; approved is written only after canonical AV and instructional gates pass.';
