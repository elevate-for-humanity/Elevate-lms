-- Keep Telnyx production routing unchanged. Asterisk is enabled per extension
-- only after the VM provisioner and controlled acceptance tests are deployed.
alter table public.communication_extensions
  add column if not exists webrtc_provider text not null default 'telnyx'
    check (webrtc_provider in ('telnyx', 'asterisk'));

alter table public.phone_webrtc_devices
  add column if not exists provider text not null default 'telnyx'
    check (provider in ('telnyx', 'asterisk')),
  add column if not exists registration_state text not null default 'unregistered'
    check (registration_state in ('unregistered', 'registered')),
  add column if not exists connection_state text not null default 'disconnected'
    check (connection_state in ('disconnected', 'connected')),
  add column if not exists registration_verified_at timestamptz;

-- Preserve all records and keep each provider's credentials independently
-- revocable. Minting a credential never establishes presence.
-- Keep the legacy uniqueness contract for old revisions during rollout.
-- Asterisk uses an asterisk_ device namespace so existing Telnyx rows survive.
alter table public.phone_webrtc_devices
  alter column last_seen_at drop not null,
  alter column last_seen_at drop default;
create unique index if not exists phone_webrtc_devices_provider_profile_device_key
  on public.phone_webrtc_devices(provider, profile_id, device_id);
create index if not exists phone_webrtc_devices_connected_idx
  on public.phone_webrtc_devices(extension_id, provider, last_seen_at desc)
  where status = 'active' and connection_state = 'connected';

comment on column public.communication_extensions.webrtc_provider is
  'Per-extension PWA registration provider. Defaults to existing Telnyx; independent PBX requires controlled verification before activation.';
comment on column public.phone_webrtc_devices.registration_verified_at is
  'Last server observation of SIP registration (Asterisk) or authenticated client ready heartbeat (Telnyx). Credential creation is not registration.';
comment on table public.phone_webrtc_devices is
  'Provider-scoped PWA credentials and independent registration/connection state. Secrets and SIP passwords are never stored here.';
