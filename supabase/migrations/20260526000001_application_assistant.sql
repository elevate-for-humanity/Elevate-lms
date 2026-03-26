-- Application Assistant tables
-- Stores org profile, narratives, application answers, and approval history

-- Organization profile (single row per org)
create table if not exists public.org_profile (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  dba_name text,
  ein text,
  uei text,
  cage_code text,
  sam_expiration date,
  address_line1 text,
  city text,
  state text,
  zip text,
  phone text,
  email text,
  website text,
  contact_name text,
  contact_title text,
  org_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Narrative bank
create table if not exists public.org_narratives (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.org_profile(id) on delete cascade,
  key text not null,           -- e.g. 'mission_statement', 'capability_statement'
  label text not null,         -- human-readable label
  content text not null,
  context text,                -- e.g. 'grant/workforce', 'contract/federal'
  version int default 1,
  created_at timestamptz default now()
);

create index if not exists idx_org_narratives_key on public.org_narratives(key);

-- Application templates (form schemas)
create table if not exists public.application_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,          -- e.g. 'SAEF 3 Round 2'
  form_url text,
  deadline date,
  agency text,
  fields jsonb not null default '[]',  -- array of field definitions
  created_at timestamptz default now()
);

-- Application instances (one per submission attempt)
create table if not exists public.grant_application_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.application_templates(id),
  org_id uuid references public.org_profile(id),
  status text default 'draft',  -- draft | reviewed | submitted | awarded | declined
  submitted_at timestamptz,
  confirmation_number text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Per-field answers with approval tracking
create table if not exists public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.grant_application_instances(id) on delete cascade,
  field_name text not null,
  field_label text,
  suggested_answer text,
  selected_answer text,
  source text,                  -- 'profile' | 'narrative' | 'prior_approved' | 'manual'
  confidence_score numeric,
  approved_by_user boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_application_answers_app on public.application_answers(application_id);
create index if not exists idx_application_answers_field on public.application_answers(field_name);

-- Seed Elevate org profile
insert into public.org_profile (
  legal_name, dba_name, ein, uei, cage_code, sam_expiration,
  address_line1, city, state, zip,
  phone, email, website,
  contact_name, contact_title, org_type
) values (
  '2Exclusive LLC-S',
  'Elevate for Humanity Technical and Career Institute',
  'Available upon request',
  'VX2GK5S8SZH8',
  '0QH19',
  '2026-06-29',
  '8888 Keystone Crossing, Suite 1300',
  'Indianapolis',
  'Indiana',
  '46240',
  '(317) 314-3757',
  'elizabethpowell6262@gmail.com',
  'https://www.elevateforhumanity.org',
  'Elizabeth Greene',
  'Founder & Chief Executive Officer',
  'Nonprofit'
) on conflict do nothing;

-- Seed SAEF Round 2 template
insert into public.application_templates (name, form_url, deadline, agency) values (
  'SAEF 3 Competitive Grant — Round 2',
  'https://docs.google.com/forms/d/e/1FAIpQLSdEfMQFOf50SJF4-YeUGGOGlEa0FKsWzTgeuE3v1OK6e5bZ0w/viewform',
  '2025-04-10',
  'Indiana Department of Workforce Development'
) on conflict do nothing;
