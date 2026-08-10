-- Canonical host-shop attendance ledger.
-- Direct client access is intentionally blocked by RLS; writes must pass through
-- the authenticated host-shop API, which validates active partner/shop placement.

create table if not exists public.host_shop_attendance_records (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  tenant_id uuid not null,
  placement_id uuid not null references public.apprentice_placements(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present', 'absent', 'excused', 'late')),
  notes text,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (placement_id, attendance_date)
);

create index if not exists idx_host_shop_attendance_partner_date
  on public.host_shop_attendance_records(partner_id, attendance_date desc);

create index if not exists idx_host_shop_attendance_shop_date
  on public.host_shop_attendance_records(shop_id, attendance_date desc);

create index if not exists idx_host_shop_attendance_student_date
  on public.host_shop_attendance_records(student_id, attendance_date desc);

alter table public.host_shop_attendance_records enable row level security;

comment on table public.host_shop_attendance_records is
  'Host-shop attendance records validated against active apprentice placements. Service-role API access only unless explicit RLS policies are added.';
