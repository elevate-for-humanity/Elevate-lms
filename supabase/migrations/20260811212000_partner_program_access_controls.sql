-- Align partner_program_access with the Host Shop portal and legacy partner provisioning.
-- The portal already filters revoked_at, and older provisioning code writes the
-- three capability flags. Production previously had only partner_id/program_id.

alter table public.partner_program_access
  add column if not exists can_view_apprentices boolean not null default true,
  add column if not exists can_enter_progress boolean not null default true,
  add column if not exists can_view_reports boolean not null default true,
  add column if not exists revoked_at timestamptz;

create index if not exists partner_program_access_active_idx
  on public.partner_program_access (partner_id, program_id)
  where revoked_at is null;
