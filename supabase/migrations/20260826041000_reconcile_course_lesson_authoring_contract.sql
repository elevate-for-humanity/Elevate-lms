-- Reconcile replayable migration history with the canonical lesson authoring contract.
-- These columns already exist in production; IF NOT EXISTS keeps replay safe.
alter table public.course_lessons
  add column if not exists status text not null default 'draft',
  add column if not exists content_json jsonb not null default '{}'::jsonb,
  add column if not exists is_published boolean not null default false;

comment on column public.course_lessons.status is
  'Canonical lesson authoring lifecycle state.';
comment on column public.course_lessons.content_json is
  'Canonical structured authored lesson experience.';
comment on column public.course_lessons.is_published is
  'Controls learner-facing lesson visibility.';
