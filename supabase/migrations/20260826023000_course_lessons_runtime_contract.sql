-- Record the canonical runtime columns already present in production so a
-- clean database and the repository schema contract match the deployed app.
-- This migration is intentionally idempotent and does not weaken RLS.
alter table public.course_lessons
  add column if not exists status text not null default 'draft',
  add column if not exists is_published boolean not null default false,
  add column if not exists content_json jsonb not null default '{}'::jsonb,
  add column if not exists key_terms jsonb;
