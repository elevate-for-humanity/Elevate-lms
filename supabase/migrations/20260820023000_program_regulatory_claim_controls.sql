-- Government-facing program compliance controls.
-- Keeps public ETPL/WIOA/WRG/RAPIDS claims tied to explicit program-level status.

create table if not exists public.program_regulatory_status (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  jurisdiction text not null default 'IN',
  authority text not null,
  status_type text not null check (status_type in ('etpl','wioa','wrg','rapids','state_license','credential_approval')),
  status_value text not null check (status_value in ('verified','not_verified','pending','not_applicable','expired')),
  public_claim_allowed boolean not null default false,
  source_reference text,
  source_url text,
  effective_date date,
  expiration_date date,
  verified_at timestamptz,
  verified_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(program_id, jurisdiction, authority, status_type)
);

create table if not exists public.program_claim_evidence (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  claim_key text not null,
  claim_text text not null,
  evidence_type text not null,
  evidence_reference text,
  evidence_url text,
  valid_from date,
  valid_through date,
  verified_at timestamptz,
  verified_by uuid,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(program_id, claim_key, evidence_reference)
);

create index if not exists idx_program_regulatory_status_program on public.program_regulatory_status(program_id);
create index if not exists idx_program_regulatory_status_public on public.program_regulatory_status(public_claim_allowed, status_type, status_value);
create index if not exists idx_program_claim_evidence_program on public.program_claim_evidence(program_id, is_current);

alter table public.program_regulatory_status enable row level security;
alter table public.program_claim_evidence enable row level security;

comment on table public.program_regulatory_status is 'Authoritative program-level regulatory status used to control public funding, ETPL, WRG, RAPIDS, and licensing claims.';
comment on table public.program_claim_evidence is 'Evidence ledger for material public claims. Service-role access is required unless explicit policies are later granted.';

create or replace view public.public_program_compliance as
select
  p.id as program_id,
  p.slug,
  p.title,
  coalesce(bool_or(prs.public_claim_allowed and prs.status_type='etpl' and prs.status_value='verified'), false) as etpl_claim_allowed,
  coalesce(bool_or(prs.public_claim_allowed and prs.status_type='wioa' and prs.status_value='verified'), false) as wioa_claim_allowed,
  coalesce(bool_or(prs.public_claim_allowed and prs.status_type='wrg' and prs.status_value='verified'), false) as wrg_claim_allowed,
  coalesce(bool_or(prs.public_claim_allowed and prs.status_type='rapids' and prs.status_value='verified'), false) as rapids_claim_allowed,
  max(prs.verified_at) as last_regulatory_verification
from public.programs p
left join public.program_regulatory_status prs on prs.program_id=p.id
where coalesce(p.published,false)=true
group by p.id,p.slug,p.title;

insert into public.program_regulatory_status(program_id,jurisdiction,authority,status_type,status_value,public_claim_allowed,source_reference,source_url,verified_at,notes)
select id,'IN','Indiana Department of Workforce Development','etpl','verified',true,'Canonical public funding registry verified 2026-08-19','https://www.in.gov/dwd/career-training-adult-ed/intraining/training-providers/',now(),'Program-level public ETPL claim allowed only while evidence remains current.'
from public.programs where slug in ('cdl-training','hvac-technician','business-administration')
on conflict (program_id,jurisdiction,authority,status_type) do update set status_value=excluded.status_value,public_claim_allowed=excluded.public_claim_allowed,source_reference=excluded.source_reference,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes,updated_at=now();

insert into public.program_regulatory_status(program_id,jurisdiction,authority,status_type,status_value,public_claim_allowed,source_reference,source_url,verified_at,notes)
select id,'IN','Indiana Department of Workforce Development','wioa','verified',true,'Canonical public funding registry verified 2026-08-19','https://www.in.gov/dwd/career-training-adult-ed/intraining/training-providers/',now(),'Participant eligibility and written agency authorization remain required.'
from public.programs where slug in ('cdl-training','hvac-technician','business-administration')
on conflict (program_id,jurisdiction,authority,status_type) do update set status_value=excluded.status_value,public_claim_allowed=excluded.public_claim_allowed,source_reference=excluded.source_reference,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes,updated_at=now();

insert into public.program_regulatory_status(program_id,jurisdiction,authority,status_type,status_value,public_claim_allowed,source_reference,source_url,verified_at,notes)
select id,'IN','Indiana Department of Workforce Development / Indiana Commission for Higher Education','wrg','verified',true,'Canonical public funding registry verified 2026-08-19','https://www.in.gov/che/state-financial-aid/state-financial-aid-by-program/workforce-ready-grant/apply-as-a-training-provider/',now(),'Public WRG claim allowed only for qualifying participants and qualifying program records.'
from public.programs where slug in ('cdl-training','hvac-technician')
on conflict (program_id,jurisdiction,authority,status_type) do update set status_value=excluded.status_value,public_claim_allowed=excluded.public_claim_allowed,source_reference=excluded.source_reference,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes,updated_at=now();

insert into public.program_regulatory_status(program_id,jurisdiction,authority,status_type,status_value,public_claim_allowed,source_reference,verified_at,notes)
select id,'IN','Indiana Department of Workforce Development','wioa','not_verified',false,'Public claim suppressed pending program-level evidence',now(),'No public WIOA claim may render from legacy flags.'
from public.programs where slug in ('medical-assistant','cna','barber-apprenticeship','cosmetology-apprenticeship','nail-technician-apprenticeship')
on conflict (program_id,jurisdiction,authority,status_type) do update set status_value=excluded.status_value,public_claim_allowed=false,source_reference=excluded.source_reference,verified_at=excluded.verified_at,notes=excluded.notes,updated_at=now();

insert into public.program_regulatory_status(program_id,jurisdiction,authority,status_type,status_value,public_claim_allowed,source_reference,verified_at,notes)
select id,'IN','Indiana Department of Workforce Development / Indiana Commission for Higher Education','wrg','not_verified',false,'Public claim suppressed pending program-level evidence',now(),'No public WRG claim may render from legacy flags.'
from public.programs where slug in ('medical-assistant','cna','barber-apprenticeship','cosmetology-apprenticeship','nail-technician-apprenticeship','business-administration')
on conflict (program_id,jurisdiction,authority,status_type) do update set status_value=excluded.status_value,public_claim_allowed=false,source_reference=excluded.source_reference,verified_at=excluded.verified_at,notes=excluded.notes,updated_at=now();

update public.programs
set funding_eligible=false,
    funding_confirmed=false,
    funding_tags='{}'::text[],
    funding_pathways='{}'::text[],
    funding_eligibility='{}'::text[],
    funding=null,
    wioa_approved=false,
    etpl_listed=false,
    updated_at=now()
where slug in ('medical-assistant','cna','cosmetology-apprenticeship','nail-technician-apprenticeship');

update public.programs
set funding_confirmed=false,
    funding_tags=array['DOL Apprenticeship']::text[],
    funding_pathways='{}'::text[],
    funding_eligibility='{}'::text[],
    funding=null,
    wioa_approved=false,
    etpl_listed=false,
    updated_at=now()
where slug='barber-apprenticeship';

update public.programs
set funding_eligible=true,
    funding_confirmed=true,
    funding_tags=array['WIOA']::text[],
    wioa_approved=true,
    etpl_listed=true,
    updated_at=now()
where slug='business-administration';

update public.programs
set funding_eligible=true,
    funding_confirmed=true,
    funding_tags=array['WIOA','WRG']::text[],
    wioa_approved=true,
    etpl_listed=true,
    updated_at=now()
where slug in ('cdl-training','hvac-technician');

insert into public.funding_change_audit(action,details,created_at,updated_at)
values ('program_compliance_reconciliation',jsonb_build_object('date','2026-08-19','reason','Reconciled public program funding claims to canonical verified registry; suppressed unverified WIOA/WRG claims; added program regulatory status and evidence controls.'),now(),now());
