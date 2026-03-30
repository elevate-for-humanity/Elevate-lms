-- Forward schema reconciliation for 3 tables where live DB is missing columns
-- that app code actively references.
--
-- Determined by: live DB introspection + grep of .ts/.tsx column references.
-- See docs/schema-drift-decisions.md for full decision rationale.
--
-- All statements use ADD COLUMN IF NOT EXISTS — safe to run against live DB
-- where columns may already exist from manual dashboard edits.

-- ============================================================
-- page_sections
-- Live has: id, page_id, component, position, props, created_at, updated_at
-- lib/data/pages.ts reads: section_type, content, is_visible (newer shape)
-- lib/data/pages.ts writes: component, position, props (older shape)
-- Adding new columns additively — both shapes coexist until a cleanup migration
-- ============================================================

ALTER TABLE public.page_sections
  ADD COLUMN IF NOT EXISTS section_type TEXT NOT NULL DEFAULT 'content',
  ADD COLUMN IF NOT EXISTS content      JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_visible   BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- direct_messages
-- Live has: id, user_id, title, content, is_read, created_at, updated_at
-- MessagesClient.tsx expects: conversation_id, sender_id
-- ============================================================

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID,
  ADD COLUMN IF NOT EXISTS sender_id       UUID;

-- ============================================================
-- credentials
-- Live has: id, partner_id, name, type, description, created_at, expires_at,
--           issued_at, revoked_at
-- App references: abbreviation, issuing_authority (via program_credentials join)
-- ============================================================

ALTER TABLE public.credentials
  ADD COLUMN IF NOT EXISTS abbreviation      TEXT,
  ADD COLUMN IF NOT EXISTS issuing_authority TEXT;

-- ============================================================
-- pages
-- Live has: id, path, title, description, section, is_published,
--           requires_auth, roles_allowed, created_at, updated_at
-- App references: slug (6 refs), status (4 refs)
-- Missing: slug, status, meta_title, meta_desc
-- ============================================================

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS slug        TEXT,
  ADD COLUMN IF NOT EXISTS status      TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS meta_title  TEXT,
  ADD COLUMN IF NOT EXISTS meta_desc   TEXT;

-- Backfill slug from path for existing rows (path is the durable identifier)
UPDATE public.pages
SET slug = regexp_replace(
  regexp_replace(lower(trim(path)), '[^a-z0-9]+', '-', 'g'),
  '^-|-$', '', 'g'
)
WHERE slug IS NULL AND path IS NOT NULL;

-- Backfill status from is_published for existing rows
UPDATE public.pages
SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END
WHERE status = 'published' AND is_published IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pages_slug_unique ON public.pages (slug)
  WHERE slug IS NOT NULL;

-- ============================================================
-- placement_records
-- Live has: id, learner_id, program_id, case_manager_id, employer_name,
--           job_title, employment_type, hourly_wage, start_date, status,
--           verified_at, verified_by, verification_method, notes,
--           created_at, updated_at
-- App references: hire_date (5), employer_id (5), enrollment_id (2),
--                 annual_salary (1), verification_source (2)
-- Missing: hire_date, employer_id, enrollment_id, annual_salary,
--          verification_source
-- ============================================================

ALTER TABLE public.placement_records
  ADD COLUMN IF NOT EXISTS hire_date            DATE,
  ADD COLUMN IF NOT EXISTS employer_id          UUID,
  ADD COLUMN IF NOT EXISTS enrollment_id        UUID,
  ADD COLUMN IF NOT EXISTS annual_salary        NUMERIC,
  ADD COLUMN IF NOT EXISTS verification_source  TEXT,
  ADD COLUMN IF NOT EXISTS employed_q2          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS employed_q4          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS median_earnings_q2   NUMERIC,
  ADD COLUMN IF NOT EXISTS tenant_id            UUID;

-- Backfill hire_date from start_date where not set (same semantic for most records)
UPDATE public.placement_records
SET hire_date = start_date
WHERE hire_date IS NULL AND start_date IS NOT NULL;

-- Backfill verification_source from verification_method where not set
UPDATE public.placement_records
SET verification_source = verification_method
WHERE verification_source IS NULL AND verification_method IS NOT NULL;

-- ============================================================
-- program_modules
-- Live has: id, program_id, module_number, title, description,
--           lesson_count, duration_hours, sort_order, created_at, phase_id
-- App references: order_index (3 refs), is_published (2 refs)
-- Missing: order_index, is_published
-- ============================================================

ALTER TABLE public.program_modules
  ADD COLUMN IF NOT EXISTS order_index  INTEGER,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

-- Backfill order_index from sort_order (same semantic)
UPDATE public.program_modules
SET order_index = sort_order
WHERE order_index IS NULL AND sort_order IS NOT NULL;
