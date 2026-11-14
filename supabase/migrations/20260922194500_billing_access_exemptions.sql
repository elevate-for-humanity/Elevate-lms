-- Temporary, auditable access exceptions do not alter or forgive an invoice.
-- They delay only the login/session hold until the approved expiration time.

create table if not exists public.billing_access_exemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  reason text not null,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > starts_at)
);

create index if not exists billing_access_exemptions_user_active_idx
  on public.billing_access_exemptions (user_id, expires_at desc)
  where status = 'active';

alter table public.billing_access_exemptions enable row level security;
revoke all on public.billing_access_exemptions from anon, authenticated;

insert into public.billing_access_exemptions (user_id, starts_at, expires_at, reason)
select
  profile.id,
  timestamptz '2026-09-20 00:00:00-04',
  timestamptz '2026-10-05 00:00:00-04',
  'Sponsor-approved two-week tuition access grace period for Jordan White.'
from public.profiles profile
where lower(profile.email) = lower('jbwhite888@icloud.com')
  and not exists (
    select 1
    from public.billing_access_exemptions existing
    where existing.user_id = profile.id
      and existing.status = 'active'
      and existing.expires_at = timestamptz '2026-10-05 00:00:00-04'
  );

comment on table public.billing_access_exemptions is
  'Auditable, time-limited exceptions to overdue-invoice login enforcement. Invoices remain due and visible.';
