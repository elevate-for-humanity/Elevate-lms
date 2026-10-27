-- Repair production contracts observed in live Postgres logs.
--
-- 1. Server-side callers use service_role when rendering the public Host Shop
--    directory. The facade is SECURITY INVOKER, so that role must be able to
--    resolve and execute the locked projection function.
-- 2. The booking page orders and renders appointment_types.name, while the
--    legacy baseline stored the human-readable label in description only.

grant usage on schema directory_private to service_role;
grant execute on function directory_private.list_public_host_shops()
  to service_role;

alter table public.appointment_types
  add column if not exists name text;

update public.appointment_types
set name = description
where nullif(btrim(coalesce(name, '')), '') is null
  and nullif(btrim(coalesce(description, '')), '') is not null;

comment on column public.appointment_types.name is
  'Human-readable appointment type label used by public booking surfaces.';
