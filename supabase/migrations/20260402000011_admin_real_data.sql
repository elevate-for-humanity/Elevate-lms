-- Admin real data tables: replaces all hardcoded fake data in admin pages.
-- Covers: financial assurance, email automations, social campaigns, workflows, MOU documents.

-- 1) Financial assurance records
create table if not exists public.financial_assurance_records (
  id                        uuid primary key default gen_random_uuid(),
  record_type               text not null check (record_type in ('surety_bond','letter_of_credit','insurance','other')),
  provider_name             text not null,
  policy_or_reference_number text,
  coverage_amount           numeric(12,2),
  effective_date            date,
  expiration_date           date,
  status                    text not null default 'active' check (status in ('active','expired','pending','cancelled')),
  state                     text,
  notes                     text,
  document_url              text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists financial_assurance_records_status_idx
  on public.financial_assurance_records(status);
create index if not exists financial_assurance_records_expiration_idx
  on public.financial_assurance_records(expiration_date);

-- 2) Email automations
create table if not exists public.email_automations (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text unique,
  trigger_type          text not null check (trigger_type in (
                          'application_submitted','application_approved',
                          'payment_failed','payment_received','manual','other')),
  audience_type         text not null default 'mixed' check (audience_type in ('students','applicants','partners','mixed')),
  is_active             boolean not null default false,
  last_run_at           timestamptz,
  last_run_status       text check (last_run_status in ('success','failed','partial')),
  last_recipient_count  integer not null default 0,
  total_runs            integer not null default 0,
  total_recipients      integer not null default 0,
  provider              text default 'sendgrid',
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- 3) Social campaigns
create table if not exists public.social_campaigns (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  platform          text not null check (platform in ('facebook','instagram','linkedin','youtube','x','tiktok','multi')),
  status            text not null default 'draft' check (status in ('draft','scheduled','active','paused','completed','failed')),
  scheduled_posts   integer not null default 0,
  published_posts   integer not null default 0,
  failed_posts      integer not null default 0,
  last_published_at timestamptz,
  start_date        timestamptz,
  end_date          timestamptz,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 4) Workflows
create table if not exists public.workflows (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  workflow_key     text unique,
  category         text not null default 'operations',
  status           text not null default 'inactive' check (status in ('active','inactive','paused','error')),
  last_run_at      timestamptz,
  last_run_status  text check (last_run_status in ('success','failed','partial')),
  run_count        integer not null default 0,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 5) MOU documents
create table if not exists public.mou_documents (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  organization_name     text,
  document_status       text not null default 'draft' check (document_status in ('draft','sent','signed','expired','archived')),
  effective_date        date,
  expiration_date       date,
  file_url              text,
  external_document_id  text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- updated_at trigger (idempotent)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_financial_assurance_records_updated_at') then
    create trigger trg_financial_assurance_records_updated_at
    before update on public.financial_assurance_records
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_email_automations_updated_at') then
    create trigger trg_email_automations_updated_at
    before update on public.email_automations
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_social_campaigns_updated_at') then
    create trigger trg_social_campaigns_updated_at
    before update on public.social_campaigns
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_workflows_updated_at') then
    create trigger trg_workflows_updated_at
    before update on public.workflows
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_mou_documents_updated_at') then
    create trigger trg_mou_documents_updated_at
    before update on public.mou_documents
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- RLS
alter table public.financial_assurance_records enable row level security;
alter table public.email_automations           enable row level security;
alter table public.social_campaigns            enable row level security;
alter table public.workflows                   enable row level security;
alter table public.mou_documents               enable row level security;

-- Policies — uses profiles.role (matches existing project pattern)
drop policy if exists "admins_manage_financial_assurance" on public.financial_assurance_records;
create policy "admins_manage_financial_assurance"
  on public.financial_assurance_records for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ));

drop policy if exists "admins_manage_email_automations" on public.email_automations;
create policy "admins_manage_email_automations"
  on public.email_automations for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ));

drop policy if exists "admins_manage_social_campaigns" on public.social_campaigns;
create policy "admins_manage_social_campaigns"
  on public.social_campaigns for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ));

drop policy if exists "admins_manage_workflows" on public.workflows;
create policy "admins_manage_workflows"
  on public.workflows for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ));

drop policy if exists "admins_manage_mou_documents" on public.mou_documents;
create policy "admins_manage_mou_documents"
  on public.mou_documents for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin','staff')
  ));

-- Summary view for financial assurance dashboard
create or replace view public.v_admin_financial_assurance_summary as
select
  count(*)::int                                                                          as total_records,
  count(*) filter (where status = 'active')::int                                        as active_records,
  count(*) filter (where expiration_date is not null
                     and expiration_date < current_date)::int                           as expired_records,
  count(*) filter (where expiration_date is not null
                     and expiration_date >= current_date
                     and expiration_date <= current_date + interval '30 days')::int     as expiring_soon_records,
  coalesce(sum(coverage_amount) filter (where status = 'active'), 0)::numeric(12,2)    as active_coverage_total
from public.financial_assurance_records;
