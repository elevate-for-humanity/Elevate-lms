-- Align live query contracts observed in production logs on 2026-08-23.
-- Canonical names remain authoritative; compatibility fields are deliberately narrow.

alter table public.faqs
  add column if not exists "order" integer generated always as (display_order) stored;

alter table public.license_tiers
  add column if not exists is_active boolean not null default true;

update public.license_tiers
set is_active = false
where lower(coalesce(status, '')) in ('inactive', 'disabled', 'archived');

alter table public.staff
  add column if not exists accepts_appointments boolean not null default false;

alter table public.appointment_types
  add column if not exists is_active boolean not null default true;

comment on column public.faqs."order" is
  'Read-only compatibility alias for canonical display_order; remove after all callers use display_order.';
comment on column public.license_tiers.is_active is
  'Runtime visibility flag retained alongside legacy textual status.';
comment on column public.staff.accepts_appointments is
  'Explicit scheduling opt-in; false by default.';
comment on column public.appointment_types.is_active is
  'Runtime appointment-type visibility flag.';
