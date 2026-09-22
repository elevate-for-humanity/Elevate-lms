-- Organization billing preferences exist independently from payment schedules.
-- They preserve an agreed cadence without inventing an amount, provider
-- agreement, or automatic-payment authorization that is not on file.

create table if not exists public.billing_account_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  account_name text not null,
  cadence text not null check (cadence in ('weekly', 'monthly', 'quarterly', 'annual')),
  billing_day_of_month integer check (billing_day_of_month between 1 and 28),
  is_apprentice_tuition boolean not null default false,
  setup_status text not null default 'configuration_required'
    check (setup_status in ('configuration_required', 'ready', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

create unique index if not exists billing_account_preferences_name_uidx
  on public.billing_account_preferences (lower(account_name))
  where organization_id is null;

alter table public.billing_account_preferences enable row level security;
revoke all on public.billing_account_preferences from anon, authenticated;

insert into public.billing_account_preferences (
  organization_id,
  account_name,
  cadence,
  billing_day_of_month,
  is_apprentice_tuition,
  setup_status,
  notes
)
select
  organization.id,
  organization.name,
  'monthly',
  15,
  false,
  'configuration_required',
  'Bill on the 15th of each month. Keep separate from weekly apprentice tuition collection.'
from public.organizations organization
where lower(organization.name) = lower('Legacy 83 Business Inc.')
on conflict (organization_id) do update
set cadence = excluded.cadence,
    billing_day_of_month = excluded.billing_day_of_month,
    is_apprentice_tuition = excluded.is_apprentice_tuition,
    notes = excluded.notes,
    updated_at = now();

comment on table public.billing_account_preferences is
  'Account cadence instructions that are not executable payment schedules. setup_status must be ready before an associated schedule is activated.';
comment on column public.billing_account_preferences.is_apprentice_tuition is
  'False excludes an account from the weekly apprentice tuition collection job.';
