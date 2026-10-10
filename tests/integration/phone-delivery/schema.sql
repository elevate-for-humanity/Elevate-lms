-- Test fixtures ONLY. Run in an empty, isolated test database, never production.
create role anon;
create role authenticated;
create role service_role;
create table public.communication_extensions (id uuid primary key);
create table public.phone_webrtc_devices (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null, extension_id uuid not null,
 device_id text not null, provider_credential_id text unique, sip_username text unique,
 status text not null default 'active', last_seen_at timestamptz not null default now(),
 constraint phone_webrtc_devices_profile_id_device_id_key unique(profile_id,device_id)
);
create table public.notification_outbox (
 id uuid primary key default gen_random_uuid(), to_email text not null, template_key text not null,
 template_data jsonb default '{}', entity_type text, entity_id uuid,
 status text default 'queued', attempts integer default 0, max_attempts integer default 5,
 scheduled_for timestamptz default now(), created_at timestamptz default now(),
 processed_at timestamptz, sent_at timestamptz, last_error text, dead_letter boolean default false
);
grant all on public.notification_outbox to service_role;
insert into public.notification_outbox(to_email,template_key) values ('backlog@example.invalid','enrollment_welcome');
