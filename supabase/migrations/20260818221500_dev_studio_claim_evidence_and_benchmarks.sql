create table if not exists public.dev_studio_claim_evidence (
  id uuid primary key default gen_random_uuid(),
  claim_key text not null unique,
  claim_type text not null check (claim_type in ('code','benchmark','runtime','certification')),
  display_label text not null,
  status text not null default 'draft' check (status in ('draft','verified','expired','rejected')),
  value_numeric numeric,
  value_text text,
  evidence_url text,
  evidence_summary text,
  source text,
  verified_at timestamptz,
  expires_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dev_studio_benchmarks (
  id uuid primary key default gen_random_uuid(),
  scenario text not null,
  baseline_seconds numeric not null check (baseline_seconds > 0),
  studio_seconds numeric not null check (studio_seconds > 0),
  speedup numeric generated always as (baseline_seconds / studio_seconds) stored,
  notes text,
  evidence_url text,
  run_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.dev_studio_claim_evidence enable row level security;
alter table public.dev_studio_benchmarks enable row level security;

drop policy if exists dev_studio_claims_public_read on public.dev_studio_claim_evidence;
create policy dev_studio_claims_public_read
on public.dev_studio_claim_evidence for select
to anon, authenticated
using (status = 'verified' and (expires_at is null or expires_at > now()));

drop policy if exists dev_studio_claims_admin_manage on public.dev_studio_claim_evidence;
create policy dev_studio_claims_admin_manage
on public.dev_studio_claim_evidence for all
to authenticated
using (is_admin())
with check (is_admin());

drop policy if exists dev_studio_benchmarks_admin_read on public.dev_studio_benchmarks;
create policy dev_studio_benchmarks_admin_read
on public.dev_studio_benchmarks for select
to authenticated
using (is_admin());

drop policy if exists dev_studio_benchmarks_admin_write on public.dev_studio_benchmarks;
create policy dev_studio_benchmarks_admin_write
on public.dev_studio_benchmarks for insert
to authenticated
with check (is_admin());

insert into public.dev_studio_claim_evidence
  (claim_key, claim_type, display_label, status, evidence_summary, source)
values
  ('language_modes_50_plus','code','50+ language modes','draft','Requires CI-verified maintained Monaco language registry with at least 50 supported language modes.','repository'),
  ('productivity_10x','benchmark','10x faster development','draft','Requires sufficient recorded benchmark runs with a median speedup of at least 10x.','dev_studio_benchmarks'),
  ('zero_downtime','runtime','Zero-downtime deployments','draft','Requires readiness-probe configuration plus runtime deployment evidence showing healthy handoff with no failed availability checks.','northflank'),
  ('soc2_certified','certification','SOC 2 certified','draft','Requires a current independent SOC 2 report or auditor-issued evidence covering the relevant system and organization.','external-auditor')
on conflict (claim_key) do nothing;
