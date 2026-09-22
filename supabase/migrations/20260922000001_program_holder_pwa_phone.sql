-- Program-holder PWA phone routing. Provider secrets and credential passwords
-- remain server-side; the database stores only opaque Telnyx identifiers.

alter table public.phone_systems
  add column if not exists webrtc_connection_id text null,
  add column if not exists webrtc_connection_status text not null default 'not_configured'
    check (webrtc_connection_status in ('not_configured', 'configured', 'failed')),
  add column if not exists admin_extension text not null default '100',
  add column if not exists admin_menu_digit smallint not null default 0
    check (admin_menu_digit between 0 and 9),
  add column if not exists paris_intake_enabled boolean not null default true;

alter table public.communication_extensions
  add column if not exists ring_mode text not null default 'ring'
    check (ring_mode in ('ring', 'vibrate', 'silent', 'do_not_disturb', 'offline')),
  add column if not exists availability_source text not null default 'manual'
    check (availability_source in ('manual', 'schedule')),
  add column if not exists availability_schedule jsonb not null default
    '{"mon":["09:00","17:00"],"tue":["09:00","17:00"],"wed":["09:00","17:00"],"thu":["09:00","17:00"],"fri":["09:00","17:00"]}'::jsonb,
  add column if not exists ring_seconds integer not null default 20
    check (ring_seconds between 5 and 60),
  add column if not exists voicemail_greeting text null,
  add column if not exists paris_overflow_enabled boolean not null default true,
  add column if not exists last_presence_at timestamptz null,
  add column if not exists admin_external_fallback boolean not null default false,
  add column if not exists external_fallback_number text null;

alter table public.phone_destinations
  add column if not exists extension_id uuid null references public.communication_extensions(id) on delete set null;

alter table public.phone_destinations
  drop constraint if exists phone_destinations_destination_type_check;
alter table public.phone_destinations
  add constraint phone_destinations_destination_type_check
  check (destination_type in ('phone', 'voicemail', 'webrtc', 'paris'));

alter table public.phone_destinations
  drop constraint if exists phone_destinations_check;
alter table public.phone_destinations
  add constraint phone_destinations_check
  check (
    destination_type in ('voicemail', 'paris')
    or (destination_type = 'webrtc' and extension_id is not null)
    or (destination_type = 'phone' and destination is not null)
  );

alter table public.phone_calls
  add column if not exists assigned_extension_id uuid null references public.communication_extensions(id) on delete set null,
  add column if not exists assigned_profile_id uuid null references public.profiles(id) on delete set null;

alter table public.voicemails
  add column if not exists extension_id uuid null references public.communication_extensions(id) on delete set null,
  add column if not exists assigned_profile_id uuid null references public.profiles(id) on delete set null,
  add column if not exists summary text null;

alter table public.notification_preferences
  add column if not exists email_missed_calls boolean not null default true;

alter table public.program_holder_meetings
  add column if not exists communication_room_id uuid null
    references public.communication_rooms(id) on delete set null;
create unique index if not exists program_holder_meetings_room_idx
  on public.program_holder_meetings(communication_room_id)
  where communication_room_id is not null;

create table if not exists public.phone_webrtc_devices (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid not null references public.communication_extensions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  device_id text not null,
  provider_credential_id text not null,
  sip_username text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, device_id),
  unique (provider_credential_id),
  unique (sip_username)
);

create table if not exists public.phone_call_legs (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.phone_calls(id) on delete cascade,
  provider_call_id text not null,
  extension_id uuid null references public.communication_extensions(id) on delete set null,
  profile_id uuid null references public.profiles(id) on delete set null,
  leg_type text not null check (leg_type in ('webrtc', 'admin_fallback', 'outbound_return')),
  status text not null default 'initiated',
  answered_at timestamptz null,
  ended_at timestamptz null,
  hangup_cause text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_call_id)
);

create table if not exists public.phone_callback_tasks (
  id uuid primary key default gen_random_uuid(),
  call_id uuid null references public.phone_calls(id) on delete set null,
  extension_id uuid null references public.communication_extensions(id) on delete set null,
  assigned_profile_id uuid null references public.profiles(id) on delete set null,
  source text not null default 'paris' check (source in ('paris', 'voicemail', 'missed_call')),
  caller_name text null,
  callback_number text null,
  reason text null,
  program_or_department text null,
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high', 'urgent')),
  preferred_callback_time text null,
  structured_answers jsonb not null default '{}'::jsonb,
  transcript text null,
  summary text null,
  recording_url text null,
  status text not null default 'new' check (status in ('new', 'acknowledged', 'contacted', 'resolved')),
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists phone_webrtc_devices_extension_seen_idx
  on public.phone_webrtc_devices(extension_id, status, last_seen_at desc);
create index if not exists phone_call_legs_call_idx
  on public.phone_call_legs(call_id, created_at desc);
create index if not exists phone_callback_tasks_assignee_idx
  on public.phone_callback_tasks(assigned_profile_id, status, created_at desc);
create unique index if not exists phone_callback_tasks_call_source_idx
  on public.phone_callback_tasks(call_id, source)
  where call_id is not null and source in ('paris', 'voicemail');
create index if not exists phone_calls_assignee_idx
  on public.phone_calls(assigned_profile_id, created_at desc);
alter table public.phone_webrtc_devices enable row level security;
alter table public.phone_call_legs enable row level security;
alter table public.phone_callback_tasks enable row level security;

drop policy if exists "user reads own phone devices" on public.phone_webrtc_devices;
create policy "user reads own phone devices" on public.phone_webrtc_devices
  for select to authenticated using (profile_id = auth.uid());
drop policy if exists "user removes own phone devices" on public.phone_webrtc_devices;
create policy "user removes own phone devices" on public.phone_webrtc_devices
  for delete to authenticated using (profile_id = auth.uid());

drop policy if exists "user reads own phone call legs" on public.phone_call_legs;
create policy "user reads own phone call legs" on public.phone_call_legs
  for select to authenticated using (profile_id = auth.uid());

drop policy if exists "user reads own phone callback tasks" on public.phone_callback_tasks;
create policy "user reads own phone callback tasks" on public.phone_callback_tasks
  for select to authenticated using (assigned_profile_id = auth.uid());
drop policy if exists "user updates own phone callback tasks" on public.phone_callback_tasks;
create policy "user updates own phone callback tasks" on public.phone_callback_tasks
  for update to authenticated
  using (assigned_profile_id = auth.uid())
  with check (assigned_profile_id = auth.uid());

-- Remove the legacy policy that exposed every voicemail to every signed-in user.
drop policy if exists auth_read_voicemails on public.voicemails;
drop policy if exists "Users can view own voicemails" on public.voicemails;
create policy "users read assigned voicemails" on public.voicemails
  for select to authenticated using (assigned_profile_id = auth.uid() or user_id = auth.uid());
drop policy if exists "users update assigned voicemails" on public.voicemails;
create policy "users update assigned voicemails" on public.voicemails
  for update to authenticated
  using (assigned_profile_id = auth.uid() or user_id = auth.uid())
  with check (assigned_profile_id = auth.uid() or user_id = auth.uid());

comment on table public.phone_webrtc_devices is
  'One revocable Telnyx telephony credential per installed PWA device. Passwords and JWTs are never stored.';
comment on table public.phone_callback_tasks is
  'Secure program-holder inbox for PARIS interviews, voicemail, and missed-call follow-up.';

-- Route the current departments to their existing program-holder extensions.
update public.phone_destinations d
set destination_type = 'webrtc',
    destination = null,
    extension_id = e.id,
    updated_at = now()
from public.phone_systems s
join public.communication_workspaces w on w.phone_system_id = s.id
join public.communication_extensions e on e.workspace_id = w.id
where d.phone_system_id = s.id
  and (
    (lower(d.name) like '%administrator%' and e.extension = '100')
    or (lower(d.name) like '%admission%' and e.extension = '100')
    or (lower(d.name) like '%bookkeep%' and e.extension = '104')
    or ((lower(d.name) like '%beauty%' or lower(d.name) like '%barber%' or lower(d.name) like '%cosmet%') and e.extension = '105')
  );

-- Every enabled extension receives a PWA route. Existing named department
-- destinations above are reused so menu labels remain stable.
insert into public.phone_destinations (
  phone_system_id, name, department, destination_type, destination,
  ring_seconds, enabled, fallback_to_voicemail, extension_id
)
select w.phone_system_id,
       coalesce(nullif(e.display_name, ''), 'Extension ' || e.extension),
       e.department,
       'webrtc',
       null,
       e.ring_seconds,
       e.enabled,
       true,
       e.id
from public.communication_extensions e
join public.communication_workspaces w on w.id = e.workspace_id
where w.phone_system_id is not null
  and not exists (
    select 1
    from public.phone_destinations d
    where d.phone_system_id = w.phone_system_id
      and d.extension_id = e.id
  );

update public.communication_extensions e
set destination_id = d.id,
    updated_at = now()
from public.communication_workspaces w
join public.phone_destinations d on d.phone_system_id = w.phone_system_id
where e.workspace_id = w.id
  and d.extension_id = e.id
  and e.destination_id is distinct from d.id;

update public.communication_extensions
set admin_external_fallback = (extension = '100'),
    external_fallback_number = case when extension = '100' then '+13177607908' else null end,
    updated_at = now()
where workspace_id in (
  select id from public.communication_workspaces where tenant_id is null
);

update public.phone_systems
set paris_intake_enabled = true,
    ai_enabled = true,
    ai_name = 'PARIS',
    ai_instructions = 'Answer only approved general Elevate information. Collect a callback when a staff member is unavailable or when uncertain. Never collect Social Security, payment-card, account-password, or medical information.',
    updated_at = now()
where tenant_id is null;

insert into public.phone_menu_options (
  phone_system_id, digit, label, destination_id, position, enabled
)
select d.phone_system_id, 0, 'immediate administrator assistance', d.id, 0, true
from public.phone_destinations d
where lower(d.name) like '%administrator%'
  and d.phone_system_id in (select id from public.phone_systems where tenant_id is null)
order by d.created_at
limit 1
on conflict (phone_system_id, digit) do update
set label = excluded.label,
    destination_id = excluded.destination_id,
    position = excluded.position,
    enabled = excluded.enabled,
    updated_at = now();
