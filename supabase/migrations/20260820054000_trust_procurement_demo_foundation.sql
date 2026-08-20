-- Trust, procurement, and demo foundation.
-- Extends existing program-level regulatory evidence without replacing it.

create table if not exists public.public_claim_registry (
  id uuid primary key default gen_random_uuid(),
  claim_key text not null unique,
  claim_text text not null,
  claim_category text not null check (claim_category in (
    'regulatory','partnership','credential_relationship','security','privacy',
    'accessibility','governance','operational_metric','outcome','benchmark','demo'
  )),
  scope_type text not null default 'institution' check (scope_type in ('institution','program','platform','partner','demo')),
  scope_id uuid,
  status text not null default 'draft' check (status in ('draft','pending_review','verified','rejected','expired')),
  public_claim_allowed boolean not null default false,
  evidence_type text,
  evidence_reference text,
  evidence_url text,
  methodology text,
  measurement_period_start date,
  measurement_period_end date,
  valid_from date,
  valid_through date,
  verified_at timestamptz,
  verified_by uuid,
  reviewed_at timestamptz,
  reviewed_by uuid,
  owner_user_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_claim_requires_verification check (
    public_claim_allowed = false or (status = 'verified' and verified_at is not null)
  )
);

create index if not exists idx_public_claim_registry_public
  on public.public_claim_registry(public_claim_allowed, status, claim_category);
create index if not exists idx_public_claim_registry_scope
  on public.public_claim_registry(scope_type, scope_id);
create index if not exists idx_public_claim_registry_validity
  on public.public_claim_registry(valid_through) where public_claim_allowed = true;

alter table public.public_claim_registry enable row level security;

comment on table public.public_claim_registry is
  'Institution-wide evidence ledger for material public claims. Only verified records explicitly allowed for publication may render publicly.';

create or replace view public.public_verified_claims as
select
  id, claim_key, claim_text, claim_category, scope_type, scope_id,
  evidence_type, evidence_reference, evidence_url, methodology,
  measurement_period_start, measurement_period_end,
  valid_from, valid_through, verified_at
from public.public_claim_registry
where public_claim_allowed = true
  and status = 'verified'
  and (valid_from is null or valid_from <= current_date)
  and (valid_through is null or valid_through >= current_date);

create table if not exists public.demo_personas (
  id uuid primary key default gen_random_uuid(),
  persona_key text not null unique,
  role text not null check (role in ('student','apprentice','employer','partner','vr_counselor','workforce_board','admin')),
  display_name text not null,
  organization_name text,
  scenario text,
  synthetic boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_personas_must_be_synthetic check (synthetic = true)
);

create table if not exists public.demo_events (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.demo_personas(id) on delete cascade,
  event_type text not null,
  event_label text not null,
  event_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  synthetic boolean not null default true,
  constraint demo_events_must_be_synthetic check (synthetic = true)
);

create index if not exists idx_demo_events_persona on public.demo_events(persona_id, occurred_at desc);

alter table public.demo_personas enable row level security;
alter table public.demo_events enable row level security;

comment on table public.demo_personas is 'Synthetic personas used only for buyer demonstrations. Never populate from production participant records.';
comment on table public.demo_events is 'Synthetic lifecycle events for isolated demo experiences.';

insert into public.demo_personas (persona_key, role, display_name, organization_name, scenario)
values
  ('demo-student','student','Jordan Demo','Elevate Demo Organization','Referral through enrollment, training, credentialing, and completion'),
  ('demo-apprentice','apprentice','Taylor Demo','Demo Host Shop','OJT hours, RTI progress, competencies, documents, and verification'),
  ('demo-employer','employer','Morgan Demo','Demo Employer','Apprentice oversight, hour verification, compliance, and reporting'),
  ('demo-partner','partner','Casey Demo','Demo Training Partner','Programs, MOU, referrals, documents, and reports'),
  ('demo-vr','vr_counselor','Riley Demo','Demo Vocational Rehabilitation Agency','Assigned participant review and progress visibility'),
  ('demo-workforce-board','workforce_board','Avery Demo','Demo Workforce Board','Participant oversight, funding evidence, and aggregate reporting')
on conflict (persona_key) do update set
  role = excluded.role,
  display_name = excluded.display_name,
  organization_name = excluded.organization_name,
  scenario = excluded.scenario,
  active = true,
  updated_at = now();

insert into public.public_claim_registry
  (claim_key, claim_text, claim_category, scope_type, status, public_claim_allowed, evidence_type, evidence_reference, verified_at, notes)
values
  ('claim-governance-policy',
   'Material public claims must be backed by evidence and explicitly approved for publication.',
   'governance','institution','verified',true,'system_control',
   'Database constraint and public_verified_claims view',now(),
   'This statement describes the platform control implemented by this migration.'),
  ('demo-data-policy',
   'Public product demonstrations use synthetic demo personas and must not expose production participant records.',
   'demo','demo','verified',true,'system_control',
   'demo_personas synthetic constraint',now(),
   'This statement describes the platform control implemented by this migration.')
on conflict (claim_key) do nothing;
