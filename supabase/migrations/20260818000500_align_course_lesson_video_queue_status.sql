-- Keep the lesson media state machine aligned with video_jobs and createJob().
-- Course Builder queues jobs as `queued`; the previous constraint rejected
-- that valid transition and left lessons disconnected from their render jobs.

alter table public.course_lessons
  drop constraint if exists course_lessons_video_status_check;

alter table public.course_lessons
  add constraint course_lessons_video_status_check
  check (video_status = any (array[
    'pending'::text,
    'queued'::text,
    'rendering'::text,
    'complete'::text,
    'failed'::text
  ]));
