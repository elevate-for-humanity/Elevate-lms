-- Private acceptance records. Never publish test courses or write student progress.
create table if not exists public.ultimate_learner_test_runs (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  lesson_build_id uuid not null references public.ultimate_lesson_builds(id) on delete cascade,
  artifact_hash text not null,
  media_sha256 text not null,
  contract_version text not null,
  snapshot jsonb not null,
  progress jsonb not null default '{}'::jsonb,
  evidence jsonb,
  expires_at timestamptz not null default now() + interval '2 hours',
  created_at timestamptz not null default now()
);
alter table public.ultimate_learner_test_runs enable row level security;
revoke all on public.ultimate_learner_test_runs from anon, authenticated;
grant all on public.ultimate_learner_test_runs to service_role;
create index if not exists ultimate_learner_test_runs_expiry_idx on public.ultimate_learner_test_runs(expires_at);
create table if not exists public.ultimate_learner_test_evidence (
  id uuid primary key,
  lesson_build_id uuid not null references public.ultimate_lesson_builds(id) on delete cascade,
  artifact_hash text not null,
  media_sha256 text not null,
  evidence jsonb not null,
  signature text not null,
  created_at timestamptz not null default now()
);
alter table public.ultimate_learner_test_evidence enable row level security;
revoke all on public.ultimate_learner_test_evidence from anon, authenticated;
grant all on public.ultimate_learner_test_evidence to service_role;
