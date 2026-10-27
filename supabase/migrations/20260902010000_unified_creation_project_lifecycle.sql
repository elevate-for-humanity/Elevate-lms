-- Extend the existing cross-surface agentic project authority into the canonical
-- creation lifecycle. Additive and backward-compatible: existing Website Builder,
-- Course Builder, admissions and marketing consumers keep their current target
-- tables while progressively adopting these shared project contracts.

alter table public.agentic_build_projects
  add column if not exists lifecycle_status text not null default 'discovery',
  add column if not exists source_type text not null default 'prompt',
  add column if not exists artifact_manifest jsonb not null default '{}'::jsonb,
  add column if not exists design_system jsonb not null default '{}'::jsonb,
  add column if not exists approved_plan jsonb not null default '{}'::jsonb,
  add column if not exists subscription_requirements jsonb not null default '{}'::jsonb,
  add column if not exists template_version_id uuid null,
  add column if not exists current_checkpoint_id uuid null,
  add column if not exists current_release_id uuid null;

alter table public.agentic_build_projects
  drop constraint if exists agentic_build_projects_lifecycle_status_check;
alter table public.agentic_build_projects
  add constraint agentic_build_projects_lifecycle_status_check check (
    lifecycle_status = any (array[
      'discovery','planned','approved','designing','building','validating','repairing',
      'preview_ready','awaiting_approval','publishing','live','blocked','publish_failed',
      'rolling_back','rolled_back','cancelled','archived'
    ]::text[])
  );

alter table public.agentic_build_projects
  drop constraint if exists agentic_build_projects_source_type_check;
alter table public.agentic_build_projects
  add constraint agentic_build_projects_source_type_check check (
    source_type = any (array[
      'blank','prompt','template','remix','github','gitlab','public_site','existing_elevate_asset'
    ]::text[])
  );

create index if not exists agentic_build_projects_lifecycle_idx
  on public.agentic_build_projects(lifecycle_status, updated_at desc);

create table if not exists public.system_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null references public.tenants(id) on delete cascade,
  publisher_user_id uuid null references auth.users(id) on delete set null,
  slug text not null,
  name text not null,
  description text not null default '',
  category text not null,
  visibility text not null default 'private',
  license text not null default 'proprietary',
  status text not null default 'draft',
  verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_templates_visibility_check check (visibility in ('private','organization','commercial','public')),
  constraint system_templates_status_check check (status in ('draft','review','published','suspended','archived')),
  constraint system_templates_tenant_slug_unique unique nulls not distinct (tenant_id, slug)
);

create table if not exists public.system_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.system_templates(id) on delete cascade,
  version text not null,
  manifest jsonb not null,
  compatibility jsonb not null default '{}'::jsonb,
  install_contract jsonb not null default '{}'::jsonb,
  acceptance_contract jsonb not null default '{}'::jsonb,
  changelog text not null default '',
  status text not null default 'draft',
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz null,
  constraint system_template_versions_status_check check (status in ('draft','review','published','deprecated','withdrawn')),
  constraint system_template_versions_unique unique (template_id, version)
);

create table if not exists public.agentic_build_artifacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.agentic_build_projects(id) on delete cascade,
  artifact_type text not null,
  authority text not null,
  target_id uuid null,
  manifest jsonb not null default '{}'::jsonb,
  validation_status text not null default 'not_run',
  blocking_findings jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agentic_build_artifacts_validation_check check (validation_status in ('not_run','running','passed','failed')),
  constraint agentic_build_artifacts_project_type_unique unique (project_id, artifact_type)
);

create table if not exists public.agentic_build_previews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.agentic_build_projects(id) on delete cascade,
  checkpoint_id uuid null references public.agentic_build_checkpoints(id) on delete set null,
  environment text not null default 'preview',
  status text not null default 'pending',
  url text null,
  runtime_ref text null,
  expires_at timestamptz null,
  health jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agentic_build_previews_environment_check check (environment in ('preview','staging')),
  constraint agentic_build_previews_status_check check (status in ('pending','building','ready','failed','expired','stopped'))
);

create table if not exists public.agentic_build_releases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.agentic_build_projects(id) on delete cascade,
  checkpoint_id uuid not null references public.agentic_build_checkpoints(id) on delete restrict,
  previous_release_id uuid null references public.agentic_build_releases(id) on delete set null,
  environment text not null default 'production',
  status text not null default 'pending',
  commit_sha text null,
  build_id text null,
  deployment_id text null,
  url text null,
  health jsonb not null default '{}'::jsonb,
  release_notes text not null default '',
  approved_by uuid null references auth.users(id) on delete set null,
  approved_at timestamptz null,
  published_at timestamptz null,
  rolled_back_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint agentic_build_releases_environment_check check (environment in ('staging','production')),
  constraint agentic_build_releases_status_check check (status in ('pending','building','deploying','live','failed','rolling_back','rolled_back'))
);

alter table public.agentic_build_projects
  drop constraint if exists agentic_build_projects_template_version_fk;
alter table public.agentic_build_projects
  drop constraint if exists agentic_build_projects_checkpoint_fk;
alter table public.agentic_build_projects
  drop constraint if exists agentic_build_projects_release_fk;
alter table public.agentic_build_projects
  add constraint agentic_build_projects_template_version_fk
    foreign key (template_version_id) references public.system_template_versions(id) on delete set null,
  add constraint agentic_build_projects_checkpoint_fk
    foreign key (current_checkpoint_id) references public.agentic_build_checkpoints(id) on delete set null,
  add constraint agentic_build_projects_release_fk
    foreign key (current_release_id) references public.agentic_build_releases(id) on delete set null;

create index if not exists agentic_build_artifacts_project_idx on public.agentic_build_artifacts(project_id, updated_at desc);
create index if not exists agentic_build_previews_project_idx on public.agentic_build_previews(project_id, created_at desc);
create index if not exists agentic_build_releases_project_idx on public.agentic_build_releases(project_id, created_at desc);
create index if not exists system_template_versions_template_idx on public.system_template_versions(template_id, created_at desc);

alter table public.system_templates enable row level security;
alter table public.system_template_versions enable row level security;
alter table public.agentic_build_artifacts enable row level security;
alter table public.agentic_build_previews enable row level security;
alter table public.agentic_build_releases enable row level security;

drop policy if exists "system templates readable" on public.system_templates;
create policy "system templates readable" on public.system_templates for select to authenticated
  using ((select auth.uid()) is not null and (publisher_user_id = (select auth.uid()) or visibility in ('public', 'commercial') or (visibility = 'organization' and tenant_id in (
    select tenant_id from public.profiles where id = (select auth.uid())
  ))));
drop policy if exists "system templates publisher manage" on public.system_templates;
create policy "system templates publisher manage" on public.system_templates for all to authenticated
  using (publisher_user_id = (select auth.uid())) with check (publisher_user_id = (select auth.uid()));

drop policy if exists "system template versions readable" on public.system_template_versions;
create policy "system template versions readable" on public.system_template_versions for select to authenticated
  using (exists (select 1 from public.system_templates t where t.id = template_id and (
    t.publisher_user_id = (select auth.uid()) or t.visibility in ('public', 'commercial') or (t.visibility = 'organization' and t.tenant_id in (
      select tenant_id from public.profiles where id = (select auth.uid())
    ))
  )));
drop policy if exists "system template versions publisher manage" on public.system_template_versions;
create policy "system template versions publisher manage" on public.system_template_versions for all to authenticated
  using (exists (select 1 from public.system_templates t where t.id = template_id and t.publisher_user_id = (select auth.uid())))
  with check (exists (select 1 from public.system_templates t where t.id = template_id and t.publisher_user_id = (select auth.uid())));

drop policy if exists "agentic artifacts own project" on public.agentic_build_artifacts;
create policy "agentic artifacts own project" on public.agentic_build_artifacts for select to authenticated
  using (exists (select 1 from public.agentic_build_projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists "agentic previews own project" on public.agentic_build_previews;
create policy "agentic previews own project" on public.agentic_build_previews for select to authenticated
  using (exists (select 1 from public.agentic_build_projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists "agentic releases own project" on public.agentic_build_releases;
create policy "agentic releases own project" on public.agentic_build_releases for select to authenticated
  using (exists (select 1 from public.agentic_build_projects p where p.id = project_id and p.user_id = (select auth.uid())));

grant select on public.system_templates, public.system_template_versions,
  public.agentic_build_artifacts, public.agentic_build_previews, public.agentic_build_releases to authenticated;
grant all on public.system_templates, public.system_template_versions,
  public.agentic_build_artifacts, public.agentic_build_previews, public.agentic_build_releases to service_role;

comment on table public.system_templates is 'Canonical reusable system template identity; installable content is versioned separately.';
comment on table public.agentic_build_artifacts is 'Typed artifact manifests belonging to the canonical cross-surface creation project.';
comment on table public.agentic_build_releases is 'Auditable, checkpoint-backed staging and production releases with rollback lineage.';
