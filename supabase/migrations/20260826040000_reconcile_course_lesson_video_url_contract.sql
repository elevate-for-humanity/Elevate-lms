-- Reconcile replayable migration history with the canonical lesson video contract.
-- Production already exposes this column; IF NOT EXISTS keeps the migration safe
-- for both existing and fresh environments.
alter table public.course_lessons
  add column if not exists video_url text;

comment on column public.course_lessons.video_url is
  'Canonical playable lesson-video URL used by LMS playback and media maintenance.';
