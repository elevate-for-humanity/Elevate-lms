-- Existing provider settings and directory readers use these contact fields.
-- Keep existing tenant-scoped row policies and grants unchanged.
alter table public.organizations
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip text;
