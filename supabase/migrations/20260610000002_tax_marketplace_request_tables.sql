-- Supports documented tax-return intake and marketplace report API routes.
-- Idempotent: safe to run multiple times from the Supabase SQL editor.

create table if not exists public.tax_return_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  tax_year integer not null,
  filing_status text,
  notes text,
  status text not null default 'submitted' check (status in ('queued', 'submitted', 'in_review', 'filed', 'rejected', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tax_return_requests_user_id_idx on public.tax_return_requests(user_id);
create index if not exists tax_return_requests_status_idx on public.tax_return_requests(status);
create index if not exists tax_return_requests_created_at_idx on public.tax_return_requests(created_at desc);

alter table public.tax_return_requests enable row level security;

drop policy if exists "tax_return_requests_users_read_own" on public.tax_return_requests;
create policy "tax_return_requests_users_read_own"
  on public.tax_return_requests
  for select
  using (auth.uid() = user_id);

drop policy if exists "tax_return_requests_users_insert_own" on public.tax_return_requests;
create policy "tax_return_requests_users_insert_own"
  on public.tax_return_requests
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "tax_return_requests_admin_all" on public.tax_return_requests;
create policy "tax_return_requests_admin_all"
  on public.tax_return_requests
  for all
  using (public.is_admin_role())
  with check (public.is_admin_role());

create table if not exists public.marketplace_reports (
  id uuid primary key default gen_random_uuid(),
  product_id text,
  reason text not null,
  details text,
  reporter_email text,
  status text not null default 'new' check (status in ('new', 'open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_reports_status_idx on public.marketplace_reports(status);
create index if not exists marketplace_reports_created_at_idx on public.marketplace_reports(created_at desc);

alter table public.marketplace_reports enable row level security;

drop policy if exists "marketplace_reports_public_insert" on public.marketplace_reports;
create policy "marketplace_reports_public_insert"
  on public.marketplace_reports
  for insert
  with check (true);

drop policy if exists "marketplace_reports_admin_all" on public.marketplace_reports;
create policy "marketplace_reports_admin_all"
  on public.marketplace_reports
  for all
  using (public.is_admin_role())
  with check (public.is_admin_role());
