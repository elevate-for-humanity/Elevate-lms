-- Shared agentic build foundation for Store, Course Builder, Application, and Dev Studio.
-- This migration intentionally does NOT create a second application or enrollment authority.
-- Application interview state lives in agentic_build_projects.metadata until it is submitted
-- through the canonical public applications API/table.

create table if not exists public.agentic_build_projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null references public.tenants(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id uuid null,
  title text not null,
  original_prompt text null,
  status text not null default 'active',
  locale text not null default 'en',
  resume_token_hash text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agentic_build_projects_target_type_check check (
    target_type = any (array[
      'store_workspace'::text,
      'website'::text,
      'course'::text,
      'application'::text,
      'program'::text,
      'workflow'::text,
      'apprenticeship'::text,
      'marketing_campaign'::text,
      'dev_studio'::text
    ])
  ),
  constraint agentic_build_projects_status_check check (
    status = any (array['active'::text,'paused'::text,'completed'::text,'failed'::text,'archived'::text])
  ),
  constraint agentic_build_projects_locale_check check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

create index if not exists agentic_build_projects_user_idx
  on public.agentic_build_projects(user_id, updated_at desc);
create index if not exists agentic_build_projects_tenant_idx
  on public.agentic_build_projects(tenant_id, updated_at desc);
create index if not exists agentic_build_projects_target_idx
  on public.agentic_build_projects(target_type, target_id);
create unique index if not exists agentic_build_projects_resume_token_hash_uidx
  on public.agentic_build_projects(resume_token_hash)
  where resume_token_hash is not null;

create table if not exists public.agentic_build_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.agentic_build_projects(id) on delete cascade,
  prompt text not null,
  plan jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  credits_used integer not null default 0,
  error text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  failed_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint agentic_build_runs_status_check check (
    status = any (array['queued'::text,'running'::text,'waiting_for_user'::text,'waiting_for_approval'::text,'completed'::text,'failed'::text,'canceled'::text])
  ),
  constraint agentic_build_runs_credits_check check (credits_used >= 0)
);

create index if not exists agentic_build_runs_project_idx
  on public.agentic_build_runs(project_id, created_at desc);

create table if not exists public.agentic_build_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agentic_build_runs(id) on delete cascade,
  worker text not null,
  action text not null,
  dependencies uuid[] not null default '{}'::uuid[],
  status text not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text null,
  cost_class text not null default 'low',
  requires_approval boolean not null default false,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint agentic_build_tasks_status_check check (
    status = any (array['queued'::text,'running'::text,'waiting_for_user'::text,'waiting_for_approval'::text,'completed'::text,'failed'::text,'canceled'::text])
  ),
  constraint agentic_build_tasks_cost_class_check check (
    cost_class = any (array['free'::text,'low'::text,'medium'::text,'high'::text,'gpu'::text])
  )
);

create index if not exists agentic_build_tasks_run_idx
  on public.agentic_build_tasks(run_id, created_at);

create table if not exists public.agentic_build_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.agentic_build_projects(id) on delete cascade,
  run_id uuid null references public.agentic_build_runs(id) on delete set null,
  role text not null,
  content text not null,
  locale text not null default 'en',
  input_mode text not null default 'text',
  confirmed boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint agentic_build_messages_role_check check (
    role = any (array['user'::text,'assistant'::text,'system'::text,'tool'::text])
  ),
  constraint agentic_build_messages_input_mode_check check (
    input_mode = any (array['text'::text,'voice'::text,'system'::text])
  ),
  constraint agentic_build_messages_locale_check check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

create index if not exists agentic_build_messages_project_idx
  on public.agentic_build_messages(project_id, created_at);

create table if not exists public.agentic_build_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.agentic_build_projects(id) on delete cascade,
  run_id uuid null references public.agentic_build_runs(id) on delete set null,
  task_id uuid null references public.agentic_build_tasks(id) on delete set null,
  event_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agentic_build_events_project_idx
  on public.agentic_build_events(project_id, created_at desc);

create table if not exists public.agentic_build_checkpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.agentic_build_projects(id) on delete cascade,
  run_id uuid null references public.agentic_build_runs(id) on delete set null,
  target_type text not null,
  target_id uuid null,
  label text not null,
  snapshot jsonb not null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists agentic_build_checkpoints_project_idx
  on public.agentic_build_checkpoints(project_id, created_at desc);

alter table public.agentic_build_projects enable row level security;
alter table public.agentic_build_runs enable row level security;
alter table public.agentic_build_tasks enable row level security;
alter table public.agentic_build_messages enable row level security;
alter table public.agentic_build_events enable row level security;
alter table public.agentic_build_checkpoints enable row level security;

-- Authenticated users may access only their own agentic projects. Anonymous interview
-- sessions are accessed only through server-side routes using hashed resume tokens.
do $$ begin
  create policy "agentic projects select own" on public.agentic_build_projects
    for select to authenticated
    using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agentic projects insert own" on public.agentic_build_projects
    for insert to authenticated
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agentic projects update own" on public.agentic_build_projects
    for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agentic runs select own project" on public.agentic_build_runs
    for select to authenticated
    using (exists (
      select 1 from public.agentic_build_projects p
      where p.id = project_id and p.user_id = auth.uid()
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agentic tasks select own project" on public.agentic_build_tasks
    for select to authenticated
    using (exists (
      select 1
      from public.agentic_build_runs r
      join public.agentic_build_projects p on p.id = r.project_id
      where r.id = run_id and p.user_id = auth.uid()
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agentic messages select own project" on public.agentic_build_messages
    for select to authenticated
    using (exists (
      select 1 from public.agentic_build_projects p
      where p.id = project_id and p.user_id = auth.uid()
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agentic events select own project" on public.agentic_build_events
    for select to authenticated
    using (exists (
      select 1 from public.agentic_build_projects p
      where p.id = project_id and p.user_id = auth.uid()
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "agentic checkpoints select own project" on public.agentic_build_checkpoints
    for select to authenticated
    using (exists (
      select 1 from public.agentic_build_projects p
      where p.id = project_id and p.user_id = auth.uid()
    ));
exception when duplicate_object then null; end $$;

comment on table public.agentic_build_projects is
  'Canonical cross-surface agentic project authority. Application interview state is stored here until canonical applications submission.';
comment on table public.agentic_build_messages is
  'Shared PARIS conversation history for Store, Course Builder, Application, and Dev Studio agentic workspaces.';
