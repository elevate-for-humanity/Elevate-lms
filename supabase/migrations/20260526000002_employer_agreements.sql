-- Employer agreements table for RAPIDS-compliant barbershop partner onboarding
create table if not exists public.employer_agreements (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete set null,
  shop_name text not null,
  owner_name text,
  contact_email text not null,
  phone text,
  address_line1 text,
  city text,
  state text,
  zip text,
  ein text,
  license_number text,
  license_state text,
  license_expiry date,
  mentor_name text,
  mentor_license text,
  mentor_license_expiry date,
  wage_year1 text,
  wage_year2 text,
  wage_year3 text,
  ojl_hours_year text default '2000',
  rti_hours_year text default '144',
  workers_comp text,
  liability_insurance text,
  authorized_signature text,
  authorized_title text,
  agreed boolean default false,
  signed_at timestamptz,
  ip_address text,
  user_agent text,
  rapids_program_number text default '2025-IN-132301',
  sponsor_name text default '2Exclusive LLC-S (DBA: Elevate for Humanity Technical and Career Institute)',
  created_at timestamptz default now()
);

create index if not exists idx_employer_agreements_partner on public.employer_agreements(partner_id);
create index if not exists idx_employer_agreements_email on public.employer_agreements(contact_email);
