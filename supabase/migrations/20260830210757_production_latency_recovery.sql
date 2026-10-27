-- Keep recovery-critical polling and homepage media lookups index-backed.
-- These are partial indexes because only queued work and the one approved
-- homepage asset participate in request-adjacent queries.

create index if not exists agentic_build_tasks_queue_created_idx
  on public.agentic_build_tasks (created_at)
  where status = 'queued';

create index if not exists media_assets_approved_home_hero_created_idx
  on public.media_assets (created_at desc)
  where status = 'active'
    and metadata @> '{"kind":"homepage-hero-commercial","homepage_hero":true,"approved":true,"qa_approved":true}'::jsonb;

create index if not exists progress_entries_pending_auto_clock_out_idx
  on public.progress_entries (outside_geofence_since)
  where clock_out_at is null
    and outside_geofence_since is not null;
