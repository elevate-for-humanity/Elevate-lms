-- Keep the video job constraint aligned with bounded lease recovery.
-- The claim function terminalizes an expired third attempt with the distinct
-- retry_exhausted class; without this value the entire claim transaction rolls
-- back and leaves the job incorrectly stuck in rendering.

alter table public.video_jobs
  drop constraint if exists video_jobs_failure_class_check;

alter table public.video_jobs
  add constraint video_jobs_failure_class_check
  check (
    failure_class is null
    or failure_class = any (array[
      'transient'::text,
      'configuration'::text,
      'authorization'::text,
      'storage'::text,
      'renderer'::text,
      'quality'::text,
      'content'::text,
      'not_found'::text,
      'retry_exhausted'::text,
      'unknown'::text
    ])
  ) not valid;

alter table public.video_jobs
  validate constraint video_jobs_failure_class_check;

comment on constraint video_jobs_failure_class_check on public.video_jobs is
  'Canonical media failure classes, including terminal retry exhaustion.';
