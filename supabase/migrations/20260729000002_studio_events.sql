-- Migration: 20260729_studio_events.sql
-- Studio events table for real-time collaboration

begin;

-- ============================================================
-- STUDIO EVENTS
-- ============================================================

create table if not exists public.studio_events (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null,
  user_id uuid not null,

  event_type text not null,

  workspace_id text,

  metadata jsonb default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists studio_events_org_created_idx
on public.studio_events (organization_id, created_at desc);

create index if not exists studio_events_workspace_idx
on public.studio_events (workspace_id, created_at desc);

create index if not exists studio_events_user_idx
on public.studio_events (user_id, created_at desc);

create index if not exists studio_events_type_idx
on public.studio_events (event_type, created_at desc);

alter table public.studio_events enable row level security;

drop policy if exists "studio events service role full access" on public.studio_events;
create policy "studio events service role full access"
on public.studio_events for all to service_role using (true) with check (true);

commit;
