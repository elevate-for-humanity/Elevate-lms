-- The deployed onboarding workflow scopes progress by learner role. Record the
-- production column in replayable migration history so fresh environments and
-- schema-drift validation share the same contract.

alter table public.onboarding_progress
  add column if not exists role text;

comment on column public.onboarding_progress.role is
  'Role-specific onboarding workflow associated with this progress record.';
