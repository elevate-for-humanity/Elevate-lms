-- Reconcile the replayable migration history with the canonical learner
-- workspace columns already present in production. Fresh environments must
-- expose the same contract used by lib/learner/workspace.ts.

alter table public.onboarding_progress
  add column if not exists is_complete boolean default false,
  add column if not exists current_step integer;

alter table public.enrollment_requirements
  add column if not exists completed_at timestamptz;

comment on column public.onboarding_progress.is_complete is
  'Canonical learner-orientation completion state used by the learner workspace.';
comment on column public.onboarding_progress.current_step is
  'Current numbered learner-orientation step when the workflow uses ordered steps.';
comment on column public.enrollment_requirements.completed_at is
  'Timestamp recorded when an enrollment requirement reaches completed status.';
