-- Shared provider download access, rendered only after verified HVAC enrollment.
-- Never commit actual provider access codes in migrations or frontend bundles.
create table public.program_study_access_codes (
  program_id uuid not null references public.programs(id),
  resource_key text not null check (resource_key = 'qwik608'),
  access_code text not null check (length(btrim(access_code)) between 8 and 128),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (program_id, resource_key)
);
alter table public.program_study_access_codes enable row level security;
revoke all on public.program_study_access_codes from public, anon, authenticated;
grant select, insert, update, delete on public.program_study_access_codes to service_role;
create policy study_codes_service_only
on public.program_study_access_codes for all to service_role
using (true) with check (true);
comment on table public.program_study_access_codes is
  'Server-only shared provider study codes. Authenticate and verify current program enrollment before rendering.';
