-- RAG embeddings infrastructure
--
-- Enables semantic search over platform knowledge:
-- routes, components, API docs, program descriptions, SOPs.
--
-- Requires pgvector extension (available on Supabase by default).
-- Apply in Supabase Dashboard → SQL Editor.

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Platform knowledge chunks ────────────────────────────────────────────────
-- Each row is a chunk of platform knowledge with an embedding vector.
-- Populated by the embedding pipeline (scripts/embed-platform-knowledge.ts).

CREATE TABLE IF NOT EXISTS public.platform_knowledge_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type   text NOT NULL, -- 'route', 'component', 'api', 'migration', 'doc', 'sop', 'program'
  source_path   text NOT NULL, -- file path or route path
  title         text NOT NULL,
  content       text NOT NULL, -- the raw text chunk
  embedding     vector(1536),  -- OpenAI text-embedding-3-small
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS platform_knowledge_chunks_embedding_idx
  ON public.platform_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for source type filtering
CREATE INDEX IF NOT EXISTS platform_knowledge_chunks_source_type_idx
  ON public.platform_knowledge_chunks (source_type);

-- ── Operational memory ───────────────────────────────────────────────────────
-- Persistent memory for the AI operator: decisions, audits, known issues,
-- deployment events, canonical choices.

CREATE TABLE IF NOT EXISTS public.ai_operator_memory (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_type   text NOT NULL, -- 'decision', 'audit', 'issue', 'deployment', 'migration', 'note'
  title         text NOT NULL,
  content       text NOT NULL,
  tags          text[] DEFAULT '{}',
  severity      text DEFAULT 'info', -- 'info', 'warning', 'critical'
  resolved      boolean DEFAULT false,
  created_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_operator_memory_type_idx ON public.ai_operator_memory (memory_type);
CREATE INDEX IF NOT EXISTS ai_operator_memory_resolved_idx ON public.ai_operator_memory (resolved);
CREATE INDEX IF NOT EXISTS ai_operator_memory_tags_idx ON public.ai_operator_memory USING GIN (tags);

-- ── Platform state snapshots ─────────────────────────────────────────────────
-- Point-in-time snapshots of platform health for trend analysis.

CREATE TABLE IF NOT EXISTS public.platform_state_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at           timestamptz DEFAULT now(),
  active_students       integer,
  total_enrollments     integer,
  pending_applications  integer,
  published_programs    integer,
  certificates_issued   integer,
  deployment_healthy    boolean DEFAULT true,
  ai_provider           text,
  notes                 text,
  raw                   jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS platform_state_snapshots_at_idx
  ON public.platform_state_snapshots (snapshot_at DESC);

-- ── Semantic search RPC ──────────────────────────────────────────────────────
-- Called by the AI console to retrieve relevant context chunks.

CREATE OR REPLACE FUNCTION public.search_platform_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count     int   DEFAULT 10,
  filter_type     text  DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  source_type text,
  source_path text,
  title       text,
  content     text,
  metadata    jsonb,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    pkc.id,
    pkc.source_type,
    pkc.source_path,
    pkc.title,
    pkc.content,
    pkc.metadata,
    1 - (pkc.embedding <=> query_embedding) AS similarity
  FROM public.platform_knowledge_chunks pkc
  WHERE
    (filter_type IS NULL OR pkc.source_type = filter_type)
    AND pkc.embedding IS NOT NULL
    AND 1 - (pkc.embedding <=> query_embedding) > match_threshold
  ORDER BY pkc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── Seed initial operational memory from known platform state ────────────────

INSERT INTO public.ai_operator_memory (memory_type, title, content, tags, severity) VALUES
(
  'decision',
  'Canonical program route architecture',
  'All programs use /programs/[program] via the dynamic route. Dedicated pages only when unique client components are needed (barber, cosmetology, hvac, cna, building-services, finance-bookkeeping, esthetician, drug-collector, direct-support-professional, cpr-first-aid, peer-recovery-specialist, medical-assistant, electrical, plumbing). All other programs fall through to [program].',
  ARRAY['routes', 'programs', 'canonical'],
  'info'
),
(
  'decision',
  'Supabase client import path',
  'Import Supabase clients from @/lib/supabase/* only. All 10 deprecated root-level shims deleted in 2026-Q2. Do not re-introduce them.',
  ARRAY['supabase', 'imports', 'canonical'],
  'info'
),
(
  'decision',
  'Middleware: use proxy.ts only',
  'All middleware logic goes in proxy.ts. Do NOT create middleware.ts — it conflicts with proxy.ts and breaks the build.',
  ARRAY['middleware', 'canonical', 'critical'],
  'warning'
),
(
  'issue',
  'Programs vs Courses terminology split',
  'Public LMS uses "Programs" (/lms/programs) while authenticated app uses "Courses" (/lms/courses). Canonical term is "Program". Renaming requires 20+ inbound href updates and redirect rules. Tracked as explicit debt — do not resolve casually.',
  ARRAY['routes', 'ux-debt', 'lms'],
  'warning'
),
(
  'issue',
  'Workforce board portal has no API routes',
  '5 pages exist at /workforce-board/* but 0 API routes in /api/workforce-board/. Pages are stubs. Need to build /api/workforce-board/* routes.',
  ARRAY['workforce-board', 'api-gap', 'stub'],
  'warning'
),
(
  'issue',
  'Mentor portal has no API routes',
  '3 pages exist at /mentor/* but 0 API routes. Need to build /api/mentor/* routes.',
  ARRAY['mentor', 'api-gap', 'stub'],
  'info'
),
(
  'issue',
  'Auth gaps: 62 routes with no auth check',
  'As of 2026-03-16 audit: 62 routes with no auth check, 13 admin routes with identity-only auth (no role check), 33 routes leaking error.message. Run scripts/audit-auth-gaps.sh for current state.',
  ARRAY['auth', 'security', 'audit'],
  'critical'
),
(
  'issue',
  'Lab/assignment instructor sign-off UI not built',
  'step_submissions table exists and lesson page renders lab/assignment UI shells, but instructor sign-off UI is not yet built.',
  ARRAY['lms', 'instructor', 'incomplete'],
  'info'
),
(
  'decision',
  'LMS course engine is DB-driven and program-agnostic',
  'The course engine routes rendering and completion rules by step_type column on curriculum_lessons. Do not write per-program hardcoded logic. Set step_type in the DB and the renderer handles it automatically.',
  ARRAY['lms', 'architecture', 'canonical'],
  'info'
),
(
  'decision',
  'Rate limiting: use applyRateLimit from @/lib/api/withRateLimit',
  'lib/rateLimit.ts (in-memory) is deprecated — broken in serverless. lib/rateLimiter.ts and lib/api/rate-limiter.ts are deleted. Use applyRateLimit() from @/lib/api/withRateLimit only.',
  ARRAY['rate-limiting', 'canonical', 'security'],
  'info'
)
ON CONFLICT DO NOTHING;
