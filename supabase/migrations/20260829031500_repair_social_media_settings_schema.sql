-- Repair schema drift between the legacy public-directory table and the
-- canonical OAuth-backed social publishing integration.

alter table public.social_media_settings
  add column if not exists access_token text,
  add column if not exists refresh_token text,
  add column if not exists expires_at timestamptz,
  add column if not exists organization_id text,
  add column if not exists organizations jsonb not null default '[]'::jsonb,
  add column if not exists enabled boolean not null default false,
  add column if not exists profile_data jsonb not null default '{}'::jsonb,
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz not null default now();

-- Preserve the intent of legacy directory records without treating them as
-- OAuth-connected accounts. A platform becomes publish-enabled only when a
-- valid OAuth token is stored by the canonical connection flow.
update public.social_media_settings
set
  enabled = false,
  profile_data = coalesce(profile_data, '{}'::jsonb) || jsonb_strip_nulls(
    jsonb_build_object('name', handle, 'url', url)
  ),
  updated_at = now()
where access_token is null;

create unique index if not exists social_media_settings_platform_key
  on public.social_media_settings (platform);

alter table public.social_media_settings enable row level security;

-- Repair the legacy tenant UPDATE policy so both the existing row and the
-- proposed row must remain inside the caller's authorized tenant.
drop policy if exists social_media_settings_tenant_update
  on public.social_media_settings;
create policy social_media_settings_tenant_update
  on public.social_media_settings
  for update
  to authenticated
  using (
    rpc_private.is_super_admin()
    or tenant_id = rpc_private.get_current_tenant_id()
  )
  with check (
    rpc_private.is_super_admin()
    or tenant_id = rpc_private.get_current_tenant_id()
  );

comment on table public.social_media_settings is
  'Canonical OAuth credentials and public profile metadata for social publishing integrations';

