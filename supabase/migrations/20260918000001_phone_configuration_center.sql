-- Complete configuration model for Elevate Phone. Carrier credentials stay in
-- the server secret store; dashboards persist only safe configuration and
-- opaque provider identifiers.

alter table public.phone_systems
  add column if not exists tenant_id uuid null,
  add column if not exists routing_mode text not null default 'menu'
    check (routing_mode in ('menu', 'ai_receptionist', 'direct_forward')),
  add column if not exists default_destination_id uuid null,
  add column if not exists voicemail_enabled boolean not null default true,
  add column if not exists voicemail_transcription_enabled boolean not null default true,
  add column if not exists call_recording_enabled boolean not null default false,
  add column if not exists recording_disclosure text null,
  add column if not exists max_queue_seconds integer not null default 90
    check (max_queue_seconds between 15 and 600),
  add column if not exists ai_enabled boolean not null default false,
  add column if not exists ai_name text not null default 'Elevate Assistant',
  add column if not exists ai_voice text not null default 'natural',
  add column if not exists ai_instructions text not null default
    'Answer questions about Elevate for Humanity, collect caller information, and transfer to a person when requested or uncertain.',
  add column if not exists ai_language text not null default 'en-US',
  add column if not exists ai_allow_interruptions boolean not null default true,
  add column if not exists ai_human_handoff_enabled boolean not null default true;

create unique index if not exists phone_systems_one_per_tenant
  on public.phone_systems(tenant_id) where tenant_id is not null;
create unique index if not exists phone_systems_one_platform_system
  on public.phone_systems((true)) where tenant_id is null;

create index if not exists phone_systems_tenant_idx
  on public.phone_systems(tenant_id);

do $$ begin
  alter table public.phone_systems
    add constraint phone_systems_default_destination_fk
    foreign key (default_destination_id)
    references public.phone_destinations(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

alter table public.phone_destinations
  add column if not exists department text null,
  add column if not exists priority smallint not null default 0,
  add column if not exists simultaneous_group text null,
  add column if not exists fallback_to_voicemail boolean not null default true;

alter table public.phone_menu_options
  add column if not exists spoken_keywords text[] not null default '{}';

create table if not exists public.phone_provider_connections (
  id uuid primary key default gen_random_uuid(),
  phone_system_id uuid not null references public.phone_systems(id) on delete cascade,
  provider text not null check (provider in ('telnyx', 'twilio', 'bandwidth', 'other')),
  connection_name text not null,
  provider_connection_id text null,
  webhook_status text not null default 'not_configured'
    check (webhook_status in ('not_configured', 'pending', 'verified', 'failed')),
  credential_status text not null default 'not_configured'
    check (credential_status in ('not_configured', 'configured', 'invalid')),
  last_verified_at timestamptz null,
  last_error text null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone_system_id, provider)
);

create table if not exists public.phone_call_events (
  id uuid primary key default gen_random_uuid(),
  phone_system_id uuid not null references public.phone_systems(id) on delete cascade,
  call_id uuid null references public.phone_calls(id) on delete cascade,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index if not exists phone_call_events_call_idx
  on public.phone_call_events(call_id, occurred_at);
create index if not exists phone_provider_connections_system_idx
  on public.phone_provider_connections(phone_system_id);

alter table public.phone_provider_connections enable row level security;
alter table public.phone_call_events enable row level security;

comment on table public.phone_provider_connections is
  'Non-secret carrier connection metadata. API keys and signing secrets remain in the server secret store.';
comment on table public.phone_call_events is
  'Idempotent provider call-event ledger for routing, observability, and replay-safe webhook processing.';
comment on column public.phone_systems.tenant_id is
  'Organization boundary for white-label phone service. Null is reserved for the Elevate platform account.';
