create table if not exists public.ultimate_release_versions(
 id uuid primary key default gen_random_uuid(), build_id uuid not null references public.ultimate_course_builds(id) on delete restrict,
 course_id uuid not null references public.courses(id) on delete restrict, version integer not null, package jsonb not null,
 status text not null default 'released' check(status in('released','superseded','rolled_back')), released_by uuid references auth.users(id) on delete set null,
 released_at timestamptz not null default now(), rolled_back_from uuid references public.ultimate_release_versions(id) on delete set null, unique(course_id,version));
create index if not exists ultimate_release_versions_course_idx on public.ultimate_release_versions(course_id,version desc);
alter table public.ultimate_release_versions enable row level security;
revoke all on public.ultimate_release_versions from anon,authenticated;
grant all on public.ultimate_release_versions to service_role;