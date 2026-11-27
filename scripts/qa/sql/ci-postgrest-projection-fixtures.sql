-- QA-only PostgREST contracts. All rows here are synthetic.
create table public.ultimate_course_builds (id uuid primary key default gen_random_uuid(), profile jsonb not null);
create table public.ultimate_build_jobs (
 id uuid primary key default gen_random_uuid(), build_id uuid not null references public.ultimate_course_builds(id),
 job_type text not null, status text not null, available_at timestamptz not null default now(), heartbeat_at timestamptz,
 execution_generation integer not null default 0, attempts integer not null default 0, max_attempts integer not null default 3,
 last_error text, priority integer not null default 0, created_at timestamptz not null default now(), lease_expires_at timestamptz
);
create table public.ultimate_autopilot_pools (
 id uuid primary key default gen_random_uuid(), build_id uuid not null unique references public.ultimate_course_builds(id), state text not null
);
create table public.messages (
 id uuid primary key default gen_random_uuid(), sender_id uuid, recipient_id uuid,
 content text, body text, created_at timestamptz not null default now(), read_at timestamptz
);
alter table public.ultimate_course_builds enable row level security;
alter table public.ultimate_build_jobs enable row level security;
alter table public.ultimate_autopilot_pools enable row level security;
alter table public.messages enable row level security;
revoke all on public.ultimate_course_builds,public.ultimate_build_jobs,public.ultimate_autopilot_pools,public.messages from public,anon,authenticated;
grant select on public.ultimate_course_builds,public.ultimate_build_jobs,public.ultimate_autopilot_pools,public.messages to anon;
create policy ci_synthetic_build on public.ultimate_course_builds for select to anon using (profile @> '{"ciSynthetic":true}');
create policy ci_synthetic_job on public.ultimate_build_jobs for select to anon using (exists (select 1 from public.ultimate_course_builds b where b.id=build_id));
create policy ci_synthetic_pool on public.ultimate_autopilot_pools for select to anon using (exists (select 1 from public.ultimate_course_builds b where b.id=build_id));
-- The inbox probe checks structural compatibility with limit=0. No row policy.
with builds as (
 insert into public.ultimate_course_builds(profile) values
 ('{"ciSynthetic":true,"ownerPaused":false,"fixture":"eligible"}'),
 ('{"ciSynthetic":true,"ownerPaused":true,"fixture":"paused"}'),
 ('{"ciSynthetic":true,"ownerPaused":false,"fixture":"pool"}') returning id,profile
), jobs as (
 insert into public.ultimate_build_jobs(build_id,job_type,status,available_at)
 select id,'ci_projection_fixture','queued','2026-01-01T00:00:00Z' from builds returning id
)
insert into public.ultimate_autopilot_pools(build_id,state) select id,'active' from builds where profile->>'fixture'='pool';
notify pgrst, 'reload schema';
