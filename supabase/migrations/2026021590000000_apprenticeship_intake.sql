-- Funding & Apprenticeship Intake table
-- Screens applicants, tags funding eligibility (JRI, self-pay, workforce),
-- stores leads for submission to Employer Indy and workforce partners.

-- funding_needed values: jri, wioa, wrg, self-pay, pending-review
create table if not exists public.apprenticeship_intake (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  city text,
  state text default 'IN',
  program_interest text default 'barbering',
  employment_status text,
  funding_needed boolean default true,
  workforce_connection text,
  referral_source text,
  probation_or_reentry boolean default false,
  preferred_location text,
  notes text,
  status text default 'new',
  funding_needed text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for admin queries
create index if not exists idx_intake_status on public.apprenticeship_intake(status);
create index if not exists idx_intake_funding on public.apprenticeship_intake(funding_needed);
create index if not exists idx_intake_created on public.apprenticeship_intake(created_at desc);

-- RLS: only service role can insert/read (API route uses admin client)
alter table public.apprenticeship_intake enable row level security;
