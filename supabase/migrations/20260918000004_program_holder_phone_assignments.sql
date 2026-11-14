-- Assign carrier-owned business lines to authenticated team members. The
-- forwarding destination remains private in phone_destinations; dashboards
-- expose only the business number and internal extension assigned to a user.

alter table public.phone_numbers
  add column if not exists assigned_profile_id uuid null references public.profiles(id) on delete set null,
  add column if not exists extension text null;

create unique index if not exists phone_numbers_profile_assignment_key
  on public.phone_numbers(phone_system_id, assigned_profile_id)
  where assigned_profile_id is not null;

create unique index if not exists phone_numbers_extension_key
  on public.phone_numbers(phone_system_id, extension)
  where extension is not null;

alter table public.phone_numbers
  drop constraint if exists phone_numbers_extension_format_check;

alter table public.phone_numbers
  add constraint phone_numbers_extension_format_check
  check (extension is null or extension ~ '^[0-9]{2,6}$');

comment on column public.phone_numbers.assigned_profile_id is
  'Authenticated team member who may see and use this business line in their dashboard.';
comment on column public.phone_numbers.extension is
  'Optional 2-6 digit internal extension announced and displayed with the assigned line.';
