-- Planned salon schedules remain separate from attendance and verified work hours.
create table if not exists public.host_shop_apprentice_shift_plans (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id),
  shop_id uuid not null references public.shops(id),
  placement_id uuid not null references public.apprentice_placements(id),
  student_id uuid not null references public.profiles(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  work_type text not null default 'salon_practice',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint host_shop_shift_valid_interval check (ends_at > starts_at),
  constraint host_shop_shift_max_24_hours check (ends_at <= starts_at + interval '24 hours')
);
create index if not exists host_shop_shift_partner_placement_start_idx
  on public.host_shop_apprentice_shift_plans(partner_id,placement_id,starts_at desc);
alter table public.host_shop_apprentice_shift_plans enable row level security;
revoke all on public.host_shop_apprentice_shift_plans from anon, authenticated;
comment on table public.host_shop_apprentice_shift_plans is 'Host-Shop-entered planned apprentice shifts, not verified attendance, pay, or OJL hours. Access exclusively through scoped authenticated server operations.';
