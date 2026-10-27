-- Provider-backed email delivery events and Program Holder Paris preferences.
alter table public.notification_preferences
  add column if not exists email_delivery_updates boolean not null default true,
  add column if not exists sms_delivery_updates boolean not null default false,
  add column if not exists paris_orientation_completed_at timestamptz;

create table if not exists public.email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  email_log_id uuid not null references public.email_logs(id) on delete cascade,
  provider text not null,
  provider_event_id text,
  provider_message_id text,
  event_type text not null,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists email_delivery_events_provider_event_id_key
  on public.email_delivery_events(provider_event_id)
  where provider_event_id is not null;

create index if not exists email_delivery_events_email_log_id_occurred_at_idx
  on public.email_delivery_events(email_log_id, occurred_at desc);

alter table public.email_delivery_events enable row level security;

revoke all on table public.email_delivery_events from anon, authenticated;
