-- Owner-authorized source repair. Queue and policy are service-only.
create table if not exists public.paris_autopilot_policy (
 id boolean primary key default true check (id),
 actor_id uuid not null references auth.users(id),
 enabled boolean not null default false,
 max_daily_repairs integer not null default 3 check(max_daily_repairs between 1 and 3),
 authorized_at timestamptz not null default now()
);
create table if not exists public.paris_code_repairs (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references auth.users(id),
 fingerprint text not null unique,
 goal text not null,
 status text not null default 'queued' check(status in ('queued','dispatched','patching','validating','deploying','verifying','verified','blocked')),
 candidate jsonb,
 source_job_id uuid,
 workflow_run_id bigint,
 release_sha text,
 verification jsonb,
 error_code text,
 dispatched_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.paris_autopilot_policy enable row level security;
alter table public.paris_code_repairs enable row level security;
revoke all on public.paris_autopilot_policy,public.paris_code_repairs from anon,authenticated;
grant all on public.paris_autopilot_policy,public.paris_code_repairs to service_role;
create index if not exists paris_code_repairs_pending on public.paris_code_repairs(status,created_at);
create unique index if not exists paris_code_repairs_one_active on public.paris_code_repairs ((true)) where status in ('dispatched','patching','validating','deploying','verifying');
