-- Elevate Phone: carrier-neutral business phone control plane.
-- Provider credentials remain in the server secret store; only opaque provider
-- identifiers are persisted here.

create table if not exists public.phone_systems (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null,
  name text not null default 'Elevate Phone',
  timezone text not null default 'America/Indiana/Indianapolis',
  status text not null default 'setup' check (status in ('setup', 'active', 'paused')),
  business_hours jsonb not null default '{"mon":["09:00","17:00"],"tue":["09:00","17:00"],"wed":["09:00","17:00"],"thu":["09:00","17:00"],"fri":["09:00","17:00"]}'::jsonb,
  greeting text not null default 'Thank you for calling Elevate for Humanity.',
  after_hours_message text not null default 'Our office is currently closed. Please leave a message and we will return your call.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  phone_system_id uuid not null references public.phone_systems(id) on delete cascade,
  e164 text not null,
  label text not null,
  source text not null default 'provider' check (source in ('provider', 'external_forwarding')),
  provider text null,
  provider_number_id text null,
  capabilities jsonb not null default '{"voice":true,"sms":false}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'active', 'released', 'failed')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone_system_id, e164)
);

create unique index if not exists phone_numbers_one_primary_per_system
  on public.phone_numbers(phone_system_id) where is_primary;

create table if not exists public.phone_destinations (
  id uuid primary key default gen_random_uuid(),
  phone_system_id uuid not null references public.phone_systems(id) on delete cascade,
  name text not null,
  destination_type text not null default 'phone' check (destination_type in ('phone', 'voicemail')),
  destination text null,
  ring_seconds integer not null default 25 check (ring_seconds between 5 and 120),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (destination_type = 'voicemail' or destination is not null)
);

create table if not exists public.phone_menu_options (
  id uuid primary key default gen_random_uuid(),
  phone_system_id uuid not null references public.phone_systems(id) on delete cascade,
  digit smallint not null check (digit between 0 and 9),
  label text not null,
  destination_id uuid not null references public.phone_destinations(id) on delete restrict,
  position smallint not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone_system_id, digit)
);

create table if not exists public.phone_calls (
  id uuid primary key default gen_random_uuid(),
  phone_system_id uuid not null references public.phone_systems(id) on delete cascade,
  phone_number_id uuid null references public.phone_numbers(id) on delete set null,
  provider text not null,
  provider_call_id text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_number text not null,
  to_number text not null,
  status text not null,
  destination_id uuid null references public.phone_destinations(id) on delete set null,
  started_at timestamptz null,
  answered_at timestamptz null,
  ended_at timestamptz null,
  duration_seconds integer null,
  recording_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_call_id)
);

alter table public.voicemails add column if not exists phone_system_id uuid references public.phone_systems(id) on delete cascade;
alter table public.voicemails add column if not exists call_id uuid references public.phone_calls(id) on delete set null;
alter table public.voicemails add column if not exists status text default 'new';

create index if not exists phone_calls_system_created_idx on public.phone_calls(phone_system_id, created_at desc);
create index if not exists phone_destinations_system_idx on public.phone_destinations(phone_system_id);
create index if not exists phone_menu_options_system_idx on public.phone_menu_options(phone_system_id, position);

alter table public.phone_systems enable row level security;
alter table public.phone_numbers enable row level security;
alter table public.phone_destinations enable row level security;
alter table public.phone_menu_options enable row level security;
alter table public.phone_calls enable row level security;

comment on table public.phone_systems is 'Carrier-neutral configuration for Elevate business phone systems.';
comment on column public.phone_numbers.source is 'provider is provisioned by the voice carrier; external_forwarding is owned elsewhere and forwards into Elevate Phone.';
