-- CNA waitlist submissions
create table if not exists public.cna_waitlist (
  id                    uuid primary key default gen_random_uuid(),
  full_name             text not null,
  email                 text not null,
  phone                 text not null,
  program_of_interest   text not null default 'CNA Certification',
  preferred_start_date  text not null,
  city_state            text not null,
  employed_in_healthcare text,
  submitted_at          timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

alter table public.cna_waitlist enable row level security;

-- Admins can read all entries
create policy "admin read cna_waitlist"
  on public.cna_waitlist for select
  using (get_my_role() in ('admin', 'super_admin', 'staff'));

-- Public insert only (no auth required to join waitlist)
create policy "public insert cna_waitlist"
  on public.cna_waitlist for insert
  with check (true);
