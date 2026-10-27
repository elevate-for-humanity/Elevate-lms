-- Tenant-owned communications hub: team extensions, browser meeting rooms,
-- participants, invitations, and shared conversation history.

create table if not exists public.communication_workspaces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  phone_system_id uuid null references public.phone_systems(id) on delete set null,
  name text not null default 'Communications',
  meeting_provider text not null default 'livekit'
    check (meeting_provider in ('livekit', 'external')),
  meeting_region text null,
  recording_enabled boolean not null default false,
  waiting_room_enabled boolean not null default true,
  guests_allowed boolean not null default true,
  status text not null default 'setup' check (status in ('setup', 'active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists communication_workspaces_one_per_tenant
  on public.communication_workspaces(tenant_id) where tenant_id is not null;
create unique index if not exists communication_workspaces_one_platform_workspace
  on public.communication_workspaces((true)) where tenant_id is null;

create table if not exists public.communication_extensions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.communication_workspaces(id) on delete cascade,
  profile_id uuid null references public.profiles(id) on delete set null,
  destination_id uuid null references public.phone_destinations(id) on delete set null,
  extension text not null,
  display_name text not null,
  department text null,
  presence_status text not null default 'offline'
    check (presence_status in ('offline', 'available', 'busy', 'do_not_disturb')),
  can_host_meetings boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, extension),
  unique (workspace_id, profile_id)
);

create table if not exists public.communication_rooms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.communication_workspaces(id) on delete cascade,
  room_key text not null unique,
  title text not null,
  description text null,
  room_type text not null default 'meeting'
    check (room_type in ('meeting', 'team_huddle', 'webinar', 'support', 'classroom')),
  host_profile_id uuid null references public.profiles(id) on delete set null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'open', 'ended', 'cancelled')),
  scheduled_at timestamptz null,
  started_at timestamptz null,
  ended_at timestamptz null,
  max_participants integer not null default 50 check (max_participants between 2 and 500),
  allow_screen_share boolean not null default true,
  allow_chat boolean not null default true,
  allow_phone_dial_in boolean not null default false,
  recording_enabled boolean not null default false,
  recording_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.communication_room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.communication_rooms(id) on delete cascade,
  profile_id uuid null references public.profiles(id) on delete set null,
  email text null,
  display_name text not null,
  role text not null default 'participant' check (role in ('host', 'moderator', 'participant', 'viewer')),
  invite_status text not null default 'pending'
    check (invite_status in ('pending', 'sent', 'accepted', 'declined')),
  joined_at timestamptz null,
  left_at timestamptz null,
  duration_seconds integer null,
  created_at timestamptz not null default now()
);

create table if not exists public.communication_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.communication_workspaces(id) on delete cascade,
  room_id uuid null references public.communication_rooms(id) on delete cascade,
  sender_profile_id uuid null references public.profiles(id) on delete set null,
  channel text not null check (channel in ('meeting_chat', 'internal', 'sms', 'email_note', 'call_note')),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.communication_onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.communication_workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  announcement_seen_at timestamptz null,
  tour_started_at timestamptz null,
  tour_completed_at timestamptz null,
  completed_steps text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists communication_extensions_workspace_idx
  on public.communication_extensions(workspace_id, enabled);
create index if not exists communication_rooms_workspace_time_idx
  on public.communication_rooms(workspace_id, scheduled_at desc);
create index if not exists communication_participants_room_idx
  on public.communication_room_participants(room_id);
create index if not exists communication_messages_workspace_idx
  on public.communication_messages(workspace_id, created_at desc);

alter table public.communication_workspaces enable row level security;
alter table public.communication_extensions enable row level security;
alter table public.communication_rooms enable row level security;
alter table public.communication_room_participants enable row level security;
alter table public.communication_messages enable row level security;
alter table public.communication_onboarding_progress enable row level security;

comment on table public.communication_rooms is
  'Elevate-owned browser meeting rooms. Media-provider room credentials are generated server-side and never persisted here.';
comment on table public.communication_extensions is
  'Tenant team directory connecting internal extensions to authenticated people and optional cell-phone destinations.';
comment on table public.communication_onboarding_progress is
  'Per-user state for the New Phone and Meetings announcement and guided Communications Hub tour.';
