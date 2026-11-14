-- Platform Event Bus
--
-- Central event log for all significant platform actions.
-- The AI operator consumes these events for situational awareness.
-- Supabase Realtime is enabled so the Command Center dashboard
-- receives live updates without polling.
--
-- Apply in Supabase Dashboard → SQL Editor.

-- ── Platform events table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.platform_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   text NOT NULL,   -- e.g. 'student.enrolled', 'deployment.failed'
  category     text NOT NULL,   -- 'lms', 'enrollment', 'deployment', 'payment', 'auth', 'ai', 'compliance'
  severity     text NOT NULL DEFAULT 'info',  -- 'info', 'warning', 'error', 'critical'
  actor_id     uuid,            -- user who triggered the event (null = system)
  actor_type   text,            -- 'user', 'system', 'ai', 'cron'
  subject_id   text,            -- ID of the affected entity (enrollment_id, program_id, etc.)
  subject_type text,            -- 'enrollment', 'program', 'student', 'migration', etc.
  payload      jsonb DEFAULT '{}',
  message      text,
  resolved     boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS platform_events_type_idx      ON public.platform_events (event_type);
CREATE INDEX IF NOT EXISTS platform_events_category_idx  ON public.platform_events (category);
CREATE INDEX IF NOT EXISTS platform_events_severity_idx  ON public.platform_events (severity);
CREATE INDEX IF NOT EXISTS platform_events_created_idx   ON public.platform_events (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_events_actor_idx     ON public.platform_events (actor_id);
CREATE INDEX IF NOT EXISTS platform_events_subject_idx   ON public.platform_events (subject_id, subject_type);

-- Enable Supabase Realtime for live Command Center updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_events;

-- ── Snapshot table ───────────────────────────────────────────────────────────
-- Point-in-time config snapshots before AI-initiated changes.
-- Used for rollback if a deployment or migration causes issues.

CREATE TABLE IF NOT EXISTS public.platform_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type   text NOT NULL,  -- 'pre_migration', 'pre_deploy', 'pre_config_change', 'manual'
  label           text NOT NULL,
  triggered_by    uuid,           -- user or AI actor
  trigger_type    text DEFAULT 'ai',  -- 'ai', 'manual', 'cron'
  data            jsonb NOT NULL DEFAULT '{}',  -- the snapshot payload
  rollback_sql    text,           -- SQL to undo the change (if applicable)
  rolled_back     boolean DEFAULT false,
  rolled_back_at  timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_snapshots_type_idx    ON public.platform_snapshots (snapshot_type);
CREATE INDEX IF NOT EXISTS platform_snapshots_created_idx ON public.platform_snapshots (created_at DESC);

-- ── Seed initial events from known platform history ──────────────────────────

INSERT INTO public.platform_events (event_type, category, severity, actor_type, subject_type, message) VALUES
('platform.initialized',    'deployment', 'info',    'system', 'platform',   'Platform event bus initialized'),
('ai_console.upgraded',     'ai',         'info',    'ai',     'platform',   'AI console upgraded with knowledge graph, platform state feed, semantic tools, and operational memory'),
('sitemap.canonicalized',   'deployment', 'info',    'ai',     'sitemap',    'Sitemap canonicalized: removed non-canonical slugs, added 12 missing program URLs'),
('routes.canonicalized',    'deployment', 'info',    'ai',     'routes',     'Program routes canonicalized: thin wrapper pages removed, [program] dynamic route handles all'),
('rag.initialized',         'ai',         'info',    'ai',     'platform',   'RAG embeddings infrastructure created: pgvector, platform_knowledge_chunks, search_platform_knowledge RPC'),
('memory.seeded',           'ai',         'info',    'ai',     'platform',   'Operational memory seeded with 10 canonical decisions and known platform issues')
ON CONFLICT DO NOTHING;
