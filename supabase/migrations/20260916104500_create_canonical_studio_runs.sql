-- Canonical durable execution model for the unified Studio command surface.
-- Every plan, tool call, course mutation, media job, evaluation, preview, and
-- publication action must be correlated to one studio_runs.id.

create table if not exists public.studio_runs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.studio_conversations(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid,
  course_id uuid,
  command text not null,
  goal text not null,
  status text not null default 'planning'
    check (status in ('planning','executing','verifying','blocked','completed','failed','canceled')),
  active_step_id uuid,
  preview_url text,
  context jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  failure jsonb,
  cost jsonb not null default '{}'::jsonb,
  idempotency_key text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists public.studio_run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.studio_runs(id) on delete cascade,
  ordinal integer not null check (ordinal >= 0),
  name text not null,
  specialist text,
  tool_name text,
  status text not null default 'pending'
    check (status in ('pending','ready','running','verifying','verified','blocked','failed','skipped')),
  required boolean not null default true,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  error jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, ordinal)
);

alter table public.studio_runs
  drop constraint if exists studio_runs_active_step_id_fkey;
alter table public.studio_runs
  add constraint studio_runs_active_step_id_fkey
  foreign key (active_step_id) references public.studio_run_steps(id) on delete set null;

create table if not exists public.studio_run_step_dependencies (
  step_id uuid not null references public.studio_run_steps(id) on delete cascade,
  depends_on_step_id uuid not null references public.studio_run_steps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (step_id, depends_on_step_id),
  check (step_id <> depends_on_step_id)
);

create table if not exists public.studio_run_events (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.studio_runs(id) on delete cascade,
  step_id uuid references public.studio_run_steps(id) on delete cascade,
  event_type text not null,
  level text not null default 'info' check (level in ('debug','info','warning','error')),
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_run_artifacts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.studio_runs(id) on delete cascade,
  step_id uuid references public.studio_run_steps(id) on delete set null,
  artifact_type text not null,
  name text not null,
  uri text,
  content_hash text,
  status text not null default 'draft'
    check (status in ('draft','generated','validating','verified','failed','published')),
  metadata jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_runs_user_created_idx
  on public.studio_runs(user_id, created_at desc);
create index if not exists studio_runs_status_created_idx
  on public.studio_runs(status, created_at);
create index if not exists studio_runs_course_created_idx
  on public.studio_runs(course_id, created_at desc) where course_id is not null;
create index if not exists studio_run_steps_run_status_idx
  on public.studio_run_steps(run_id, status, ordinal);
create index if not exists studio_run_events_run_id_idx
  on public.studio_run_events(run_id, id);
create index if not exists studio_run_artifacts_run_status_idx
  on public.studio_run_artifacts(run_id, status);

create or replace function public.validate_studio_step_dependency()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  step_run uuid;
  dependency_run uuid;
begin
  select run_id into step_run from public.studio_run_steps where id = new.step_id;
  select run_id into dependency_run from public.studio_run_steps where id = new.depends_on_step_id;
  if step_run is null or dependency_run is null or step_run <> dependency_run then
    raise exception 'Studio step dependencies must belong to the same run';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_studio_step_dependency_trigger
  on public.studio_run_step_dependencies;
create trigger validate_studio_step_dependency_trigger
before insert or update on public.studio_run_step_dependencies
for each row execute function public.validate_studio_step_dependency();

create or replace function public.enforce_studio_step_start()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.status = 'running' and old.status is distinct from 'running' and exists (
    select 1
    from public.studio_run_step_dependencies dependency
    join public.studio_run_steps prerequisite
      on prerequisite.id = dependency.depends_on_step_id
    where dependency.step_id = new.id
      and prerequisite.status not in ('verified','skipped')
  ) then
    raise exception 'Studio step cannot start before all dependencies are verified';
  end if;
  if new.status = 'verified' and jsonb_array_length(coalesce(new.evidence, '[]'::jsonb)) = 0 then
    raise exception 'Studio step cannot be verified without evidence';
  end if;
  new.updated_at := now();
  if new.status = 'running' and new.started_at is null then new.started_at := now(); end if;
  if new.status in ('verified','failed','skipped') and new.completed_at is null then new.completed_at := now(); end if;
  return new;
end;
$$;

drop trigger if exists enforce_studio_step_start_trigger on public.studio_run_steps;
create trigger enforce_studio_step_start_trigger
before update on public.studio_run_steps
for each row execute function public.enforce_studio_step_start();

create or replace function public.enforce_studio_run_completion()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' and exists (
    select 1 from public.studio_run_steps
    where run_id = new.id and required and status not in ('verified','skipped')
  ) then
    raise exception 'Studio run cannot complete while required steps are unverified';
  end if;
  new.updated_at := now();
  if new.status = 'executing' and new.started_at is null then new.started_at := now(); end if;
  if new.status in ('completed','failed','canceled') and new.completed_at is null then new.completed_at := now(); end if;
  return new;
end;
$$;

drop trigger if exists enforce_studio_run_completion_trigger on public.studio_runs;
create trigger enforce_studio_run_completion_trigger
before update on public.studio_runs
for each row execute function public.enforce_studio_run_completion();

alter table public.studio_runs enable row level security;
alter table public.studio_run_steps enable row level security;
alter table public.studio_run_step_dependencies enable row level security;
alter table public.studio_run_events enable row level security;
alter table public.studio_run_artifacts enable row level security;

revoke all on public.studio_runs, public.studio_run_steps,
  public.studio_run_step_dependencies, public.studio_run_events,
  public.studio_run_artifacts from anon, authenticated;
grant select on public.studio_runs, public.studio_run_steps,
  public.studio_run_step_dependencies, public.studio_run_events,
  public.studio_run_artifacts to authenticated;
grant all on public.studio_runs, public.studio_run_steps,
  public.studio_run_step_dependencies, public.studio_run_events,
  public.studio_run_artifacts to service_role;
grant usage, select on sequence public.studio_run_events_id_seq to service_role;

drop policy if exists studio_runs_owner_admin_read on public.studio_runs;
create policy studio_runs_owner_admin_read on public.studio_runs
for select to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists studio_run_steps_owner_admin_read on public.studio_run_steps;
create policy studio_run_steps_owner_admin_read on public.studio_run_steps
for select to authenticated
using (exists (
  select 1 from public.studio_runs run
  where run.id = studio_run_steps.run_id
    and (run.user_id = (select auth.uid()) or public.is_admin())
));

drop policy if exists studio_run_dependencies_owner_admin_read on public.studio_run_step_dependencies;
create policy studio_run_dependencies_owner_admin_read on public.studio_run_step_dependencies
for select to authenticated
using (exists (
  select 1
  from public.studio_run_steps step
  join public.studio_runs run on run.id = step.run_id
  where step.id = studio_run_step_dependencies.step_id
    and (run.user_id = (select auth.uid()) or public.is_admin())
));

drop policy if exists studio_run_events_owner_admin_read on public.studio_run_events;
create policy studio_run_events_owner_admin_read on public.studio_run_events
for select to authenticated
using (exists (
  select 1 from public.studio_runs run
  where run.id = studio_run_events.run_id
    and (run.user_id = (select auth.uid()) or public.is_admin())
));

drop policy if exists studio_run_artifacts_owner_admin_read on public.studio_run_artifacts;
create policy studio_run_artifacts_owner_admin_read on public.studio_run_artifacts
for select to authenticated
using (exists (
  select 1 from public.studio_runs run
  where run.id = studio_run_artifacts.run_id
    and (run.user_id = (select auth.uid()) or public.is_admin())
));

revoke execute on function public.validate_studio_step_dependency() from public, anon, authenticated;
revoke execute on function public.enforce_studio_step_start() from public, anon, authenticated;
revoke execute on function public.enforce_studio_run_completion() from public, anon, authenticated;
grant execute on function public.validate_studio_step_dependency() to service_role;
grant execute on function public.enforce_studio_step_start() to service_role;
grant execute on function public.enforce_studio_run_completion() to service_role;

comment on table public.studio_runs is
  'Canonical parent for every Studio command, plan, task, tool call, artifact, preview, evaluation, and publication decision.';
