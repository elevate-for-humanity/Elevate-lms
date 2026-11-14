-- Keep repository schema authority aligned with the live canonical course_lessons video contract.
-- These columns already exist in production; IF NOT EXISTS makes this migration idempotent.
alter table public.course_lessons
  add column if not exists video_url text,
  add column if not exists video_status text,
  add column if not exists video_error text;
