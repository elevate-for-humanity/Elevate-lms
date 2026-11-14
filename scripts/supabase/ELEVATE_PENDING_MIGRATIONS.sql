-- ============================================================
-- ELEVATE PENDING MIGRATIONS BUNDLE
-- Generated: 2026-05-30T23:18:47Z
-- Project:   cuxzzpsyufcewtmicszk
-- Run on:    Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 20260601000006_step_submissions_review_columns.sql
-- ────────────────────────────────────────────────────────────
-- Add instructor review columns to step_submissions.
-- Required for the instructor sign-off UI on lab/assignment step types.

ALTER TABLE public.step_submissions
  ADD COLUMN IF NOT EXISTS reviewed_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS instructor_status   text CHECK (instructor_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS instructor_feedback text;

-- Default existing rows to pending
UPDATE public.step_submissions
SET instructor_status = 'pending'
WHERE instructor_status IS NULL;

-- Index for instructor dashboard queries (all pending submissions)
CREATE INDEX IF NOT EXISTS idx_step_submissions_instructor_status
  ON public.step_submissions (instructor_status, created_at DESC);

-- Index for per-course instructor queries
CREATE INDEX IF NOT EXISTS idx_step_submissions_course_status
  ON public.step_submissions (course_id, instructor_status);

-- ────────────────────────────────────────────────────────────
-- 20260702000001_rls_and_security_hardening.sql
-- ────────────────────────────────────────────────────────────
-- =============================================================================
-- Security hardening: RLS gaps, storage policies, login reliability
-- =============================================================================
-- Findings from 2026-07-02 audit:
--   1. 4 tables with RLS disabled: ai_plan_executions, platform_events,
--      platform_snapshots, program_holder_call_log
--   2. Storage policies using {public} role on private buckets (should be
--      {authenticated} or {service_role})
--   3. Duplicate/redundant SELECT policies on profiles (cosmetic, not harmful)
--   4. demo-audio bucket is public with no mime-type restriction
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enable RLS on the 4 tables that had it disabled
-- -----------------------------------------------------------------------------

ALTER TABLE public.ai_plan_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_call_log ENABLE ROW LEVEL SECURITY;

-- ai_plan_executions: admin-only (internal AI planner state)
DROP POLICY IF EXISTS "ai_plan_executions_admin" ON public.ai_plan_executions;
CREATE POLICY "ai_plan_executions_admin" ON public.ai_plan_executions
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- platform_events: admin-only (internal platform telemetry)
DROP POLICY IF EXISTS "platform_events_admin" ON public.platform_events;
CREATE POLICY "platform_events_admin" ON public.platform_events
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- platform_snapshots: admin-only (internal snapshots)
DROP POLICY IF EXISTS "platform_snapshots_admin" ON public.platform_snapshots;
CREATE POLICY "platform_snapshots_admin" ON public.platform_snapshots
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- program_holder_call_log: admin + own program holder rows
DROP POLICY IF EXISTS "program_holder_call_log_admin" ON public.program_holder_call_log;
CREATE POLICY "program_holder_call_log_admin" ON public.program_holder_call_log
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "program_holder_call_log_own" ON public.program_holder_call_log;
CREATE POLICY "program_holder_call_log_own" ON public.program_holder_call_log
  FOR SELECT TO authenticated
  USING (
    called_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_call_log.program_holder_id
        AND ph.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 2. Fix storage policies using {public} role on private buckets
--    {public} = unauthenticated access. These should be {authenticated}.
-- -----------------------------------------------------------------------------

-- wioa_exports: admin-only private bucket, was {public}
DROP POLICY IF EXISTS "wioa_exports_admin" ON storage.objects;
CREATE POLICY "wioa_exports_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'wioa-exports' AND is_admin())
  WITH CHECK (bucket_id = 'wioa-exports' AND is_admin());

-- partners can upload/view own documents — was {public}, fix to {authenticated}
DROP POLICY IF EXISTS "Partners can upload own documents" ON storage.objects;
CREATE POLICY "Partners can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'partner-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Partners can view own documents" ON storage.objects;
CREATE POLICY "Partners can view own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'partner-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Partners can delete own documents" ON storage.objects;
CREATE POLICY "Partners can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'partner-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload/view own documents — was {public}, fix to {authenticated}
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
CREATE POLICY "Users can read own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all documents — was {public}, fix to {authenticated}
DROP POLICY IF EXISTS "Admins can read all documents" ON storage.objects;
CREATE POLICY "Admins can read all documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('documents', 'enrollment-documents', 'files')
    AND is_admin()
  );

-- users_upload_storage_objects / users_view_own_storage_objects — was {public}
DROP POLICY IF EXISTS "users_upload_storage_objects" ON storage.objects;
CREATE POLICY "users_upload_storage_objects" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_view_own_storage_objects" ON storage.objects;
CREATE POLICY "users_view_own_storage_objects" ON storage.objects
  FOR SELECT TO authenticated
  USING ((storage.foldername(name))[1] = auth.uid()::text);

-- Shop staff upload — was {public}
DROP POLICY IF EXISTS "Shop staff can upload documents 60c2tu_0" ON storage.objects;
-- (duplicate of authenticated version — just drop it)

-- Partners can view own shop onboarding docs — was {public}
DROP POLICY IF EXISTS "Partners can view own shop onboarding docs" ON storage.objects;
CREATE POLICY "Partners can view own shop onboarding docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'shop-onboarding'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can manage all partner documents — was {public}
DROP POLICY IF EXISTS "Admins can manage all partner documents" ON storage.objects;
CREATE POLICY "Admins can manage all partner documents" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'partner-documents' AND is_admin())
  WITH CHECK (bucket_id = 'partner-documents' AND is_admin());

-- -----------------------------------------------------------------------------
-- 3. Remove duplicate SELECT policies on profiles (cosmetic cleanup)
--    Keep: profiles_own_read (canonical), admin_bypass_select, profiles_admin_all
--    Drop: redundant duplicates
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_select_own"          ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
-- Keep: profiles_own_read, admin_bypass_select, profiles_admin_all, profiles_service_role

-- -----------------------------------------------------------------------------
-- 4. Ensure profiles_own_read exists (idempotent)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_own_read" ON public.profiles;
CREATE POLICY "profiles_own_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- -----------------------------------------------------------------------------
-- 5. Add file size limit and mime-type restriction to demo-audio bucket
--    (currently public with no restrictions — risk of abuse)
-- -----------------------------------------------------------------------------
UPDATE storage.buckets
SET
  file_size_limit   = 52428800,  -- 50 MB
  allowed_mime_types = ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/webm']
WHERE id = 'demo-audio';

-- Also restrict curriculum bucket (currently public, no mime restriction)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf','text/html','application/zip',
  'video/mp4','video/webm','image/jpeg','image/png','image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
WHERE id = 'curriculum';

-- ────────────────────────────────────────────────────────────
-- 20260702000002_store_products_product_id.sql
-- ────────────────────────────────────────────────────────────
-- store_products is missing product_id FK to products table.
-- cart-checkout queries store_products.product_id to resolve LMS access grants.
-- Without this column the lookup silently returns empty and no course access is granted.

ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS store_products_product_id_idx ON public.store_products(product_id);

-- Backfill: link existing store_products rows to products by matching name
UPDATE public.store_products sp
SET product_id = p.id
FROM public.products p
WHERE sp.product_id IS NULL
  AND lower(p.name) = lower(sp.name);

-- ────────────────────────────────────────────────────────────
-- 20260702000003_store_products_stripe_id.sql
-- ────────────────────────────────────────────────────────────
-- store_products needs stripe_product_id so the Stripe webhook can look up
-- LMS access grants by Stripe product ID (the webhook receives prod_xxx, not a UUID).
-- Without this, the refund webhook's LMS access revocation silently no-ops.

ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

CREATE INDEX IF NOT EXISTS store_products_stripe_product_id_idx
  ON public.store_products(stripe_product_id)
  WHERE stripe_product_id IS NOT NULL;

-- Backfill from products table where product_id FK is set
UPDATE public.store_products sp
SET stripe_product_id = p.stripe_product_id
FROM public.products p
WHERE sp.product_id = p.id
  AND sp.stripe_product_id IS NULL
  AND p.stripe_product_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 20260702000004_course_pipeline_drafts.sql
-- ────────────────────────────────────────────────────────────
-- Course pipeline draft persistence
-- Stores in-progress course generation configs so admins can resume after
-- page close or session expiry. One draft per user (upsert on save).

create table if not exists public.course_pipeline_drafts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null default '',
  topic         text not null default '',
  difficulty    text not null default 'intermediate',
  program_id    uuid,
  module_count  int  not null default 6,
  lessons_per_module int not null default 5,
  include_videos boolean not null default false,
  dry_run       boolean not null default false,
  updated_at    timestamptz not null default now()
);

-- One draft per user — upsert replaces on save
create unique index if not exists course_pipeline_drafts_user_id_idx
  on public.course_pipeline_drafts(user_id);

-- RLS: users can only read/write their own draft
alter table public.course_pipeline_drafts enable row level security;

create policy "owner_all" on public.course_pipeline_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger course_pipeline_drafts_updated_at
  before update on public.course_pipeline_drafts
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 20260702000005_ai_memory_ttl.sql
-- ────────────────────────────────────────────────────────────
-- ai_operator_memory TTL and archival
-- Adds expires_at column so entries can be given a lifetime.
-- Entries with no expires_at are kept forever (long-term memory).
-- A cleanup function deletes expired rows; called by the cron API route.

alter table public.ai_operator_memory
  add column if not exists expires_at timestamptz default null;

-- Index for efficient TTL cleanup queries
create index if not exists ai_operator_memory_expires_at_idx
  on public.ai_operator_memory(expires_at)
  where expires_at is not null;

-- Cleanup function: deletes expired entries, returns count removed
create or replace function public.cleanup_expired_ai_memory()
returns integer language plpgsql security definer as $$
declare
  deleted_count integer;
begin
  delete from public.ai_operator_memory
  where expires_at is not null and expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Set default TTL for transient memory types (30 days)
-- Long-term types (decision, architecture, note) keep expires_at = null
update public.ai_operator_memory
set expires_at = created_at + interval '30 days'
where memory_type in ('issue', 'deployment', 'audit', 'debug')
  and expires_at is null;

-- ────────────────────────────────────────────────────────────
-- 20260702000006_guardrail_enforcement_log.sql
-- ────────────────────────────────────────────────────────────
-- Guardrail enforcement log
-- Records every enforcement action taken by the guardrail engine.
-- Used to prevent duplicate enforcement within grace periods.

create table if not exists public.guardrail_enforcement_log (
  id                  uuid primary key default gen_random_uuid(),
  program_holder_id   uuid not null,
  policy_id           text not null,
  action              text not null,
  severity            text not null,
  violation_type      text not null,
  mou_section         text,
  mou_clause          text,
  enforced_at         timestamptz not null default now(),
  dry_run             boolean not null default false
);

create index if not exists guardrail_log_holder_policy_idx
  on public.guardrail_enforcement_log(program_holder_id, policy_id, enforced_at desc);

alter table public.guardrail_enforcement_log enable row level security;

-- Only service role can write; admins can read
create policy "service_write" on public.guardrail_enforcement_log
  for all using (auth.role() = 'service_role');

create policy "admin_read" on public.guardrail_enforcement_log
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin', 'staff')
    )
  );

-- ────────────────────────────────────────────────────────────
-- 20260702000007_courses_course_code.sql
-- ────────────────────────────────────────────────────────────
-- Add course_code to public.courses
-- Used by the course builder pipeline to generate short enrollment codes
-- (e.g. "HVAC608", "BARB417") that are human-readable and deterministic.
--
-- Apply in Supabase Dashboard → SQL Editor before running the pipeline.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_code TEXT;

-- Unique constraint — one code per course, nulls allowed during migration window
DO $$ BEGIN
  ALTER TABLE public.courses ADD CONSTRAINT courses_course_code_key UNIQUE (course_code);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill existing rows: first 4 alpha chars of slug (uppercase) + first 6 hex chars of id.
-- Using id suffix guarantees uniqueness across all rows regardless of slug collisions.
UPDATE public.courses
SET course_code = (
  UPPER(SUBSTRING(REGEXP_REPLACE(slug, '[^a-z]', '', 'gi'), 1, 4))
  || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 6))
)
WHERE course_code IS NULL;

-- ────────────────────────────────────────────────────────────
-- 20260702000008_ai_conversation_memory.sql
-- ────────────────────────────────────────────────────────────
-- ai_conversation_memory: per-session chat history for the AI Studio console.
-- Stores user/assistant turns so Ellie has context across messages in a session.
-- Sessions are scoped to user_id + session_id. Rows expire after 7 days.

create table if not exists public.ai_conversation_memory (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  session_id  text        not null,
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '7 days')
);

create index if not exists ai_conversation_memory_user_session_idx
  on public.ai_conversation_memory(user_id, session_id, created_at);

create index if not exists ai_conversation_memory_expires_idx
  on public.ai_conversation_memory(expires_at);

-- RLS: users can only read/write their own memory rows
alter table public.ai_conversation_memory enable row level security;

create policy "Users manage own conversation memory"
  on public.ai_conversation_memory
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role bypass for admin API routes
create policy "Service role full access"
  on public.ai_conversation_memory
  for all
  to service_role
  using (true)
  with check (true);

-- Extend cleanup function to also purge expired conversation memory
create or replace function public.cleanup_expired_ai_memory()
returns integer language plpgsql security definer as $$
declare
  deleted_count integer;
  conv_deleted  integer;
begin
  -- Operator memory (ai_operator_memory)
  delete from public.ai_operator_memory
  where expires_at is not null and expires_at < now();
  get diagnostics deleted_count = row_count;

  -- Conversation memory (ai_conversation_memory)
  delete from public.ai_conversation_memory
  where expires_at < now();
  get diagnostics conv_deleted = row_count;

  return deleted_count + conv_deleted;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 20260702000009_normalize_two_factor_auth.sql
-- ────────────────────────────────────────────────────────────
-- Normalize two_factor_auth table.
--
-- The table was created with both `is_enabled` and `enabled` columns.
-- Application code uses `enabled`. This migration:
--   1. Merges is_enabled into enabled (OR — if either was true, keep true)
--   2. Drops the redundant is_enabled column
--   3. Adds NOT NULL default, FK to auth.users, unique constraint, and index
--   4. Converts backup_codes from text to text[] for proper array handling

-- 1. Merge is_enabled → enabled
UPDATE public.two_factor_auth
SET enabled = TRUE
WHERE is_enabled = TRUE AND (enabled IS NULL OR enabled = FALSE);

-- 2. Drop redundant column
ALTER TABLE public.two_factor_auth
  DROP COLUMN IF EXISTS is_enabled;

-- 3. Set defaults and NOT NULL on key columns
ALTER TABLE public.two_factor_auth
  ALTER COLUMN enabled SET DEFAULT FALSE,
  ALTER COLUMN enabled SET NOT NULL;

UPDATE public.two_factor_auth SET enabled = FALSE WHERE enabled IS NULL;

-- 4. Add primary key if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'two_factor_auth'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.two_factor_auth ADD PRIMARY KEY (id);
  END IF;
END $$;

-- 5. Add unique constraint on user_id (one 2FA record per user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'two_factor_auth'
      AND constraint_name = 'two_factor_auth_user_id_key'
  ) THEN
    ALTER TABLE public.two_factor_auth
      ADD CONSTRAINT two_factor_auth_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 6. Add FK to auth.users with cascade delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'two_factor_auth'
      AND constraint_name = 'two_factor_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.two_factor_auth
      ADD CONSTRAINT two_factor_auth_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 7. Index for fast user_id lookups
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id
  ON public.two_factor_auth (user_id);

-- 8. RLS policies
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own 2FA record" ON public.two_factor_auth;
CREATE POLICY "Users can read own 2FA record"
  ON public.two_factor_auth FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own 2FA record" ON public.two_factor_auth;
CREATE POLICY "Users can update own 2FA record"
  ON public.two_factor_auth FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own 2FA record" ON public.two_factor_auth;
CREATE POLICY "Users can insert own 2FA record"
  ON public.two_factor_auth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on two_factor_auth" ON public.two_factor_auth;
CREATE POLICY "Service role full access on two_factor_auth"
  ON public.two_factor_auth
  USING (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────
-- 20260702000010_onboarding_progress_unique.sql
-- ────────────────────────────────────────────────────────────
-- Add UNIQUE constraint on (user_id, step) so the upsert in
-- /api/onboarding/complete-step can use onConflict: 'user_id,step'.
-- Deduplicate any existing rows first (keep the most-recently completed one).

DELETE FROM public.onboarding_progress op
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, step) id
  FROM public.onboarding_progress
  ORDER BY user_id, step, completed_at DESC NULLS LAST, created_at DESC NULLS LAST
);

ALTER TABLE public.onboarding_progress
  ADD CONSTRAINT onboarding_progress_user_step_unique UNIQUE (user_id, step);

-- ────────────────────────────────────────────────────────────
-- 20260702000011_ensure_storage_buckets.sql
-- ────────────────────────────────────────────────────────────
-- Ensure all storage buckets referenced in application code exist.
-- Uses ON CONFLICT DO NOTHING so re-running is safe.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Document uploads (onboarding, enrollment, compliance)
  ('documents',             'documents',             false, 52428800,  ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('agreements',            'agreements',            false, 20971520,  ARRAY['application/pdf','image/png','image/jpeg']),
  ('assignments',           'assignments',           false, 52428800,  ARRAY['application/pdf','image/jpeg','image/png','video/mp4','application/zip']),
  ('mous',                  'mous',                  false, 20971520,  ARRAY['application/pdf','image/png','image/jpeg']),
  ('contracts',             'contracts',             false, 20971520,  ARRAY['application/pdf','image/png','image/jpeg']),
  ('files',                 'files',                 false, 104857600, NULL),
  ('media',                 'media',                 true,  104857600, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','audio/mpeg']),
  ('avatars',               'avatars',               true,  5242880,   ARRAY['image/jpeg','image/png','image/webp']),
  -- Course content (canonical names: course-content and course-videos, hyphenated)
  ('course-content',        'course-content',        false, 524288000, NULL),
  ('course_content',        'course_content',        false, 524288000, NULL),  -- legacy alias
  ('course-videos',         'course-videos',         false, 524288000, ARRAY['video/mp4','video/webm','video/quicktime']),
  ('course_videos',         'course_videos',         false, 524288000, ARRAY['video/mp4','video/webm','video/quicktime']),  -- legacy alias
  ('curriculum',            'curriculum',            false, 104857600, NULL),
  ('scorm_packages',        'scorm_packages',        false, 524288000, ARRAY['application/zip','application/x-zip-compressed']),
  ('videos',                'videos',                false, 524288000, ARRAY['video/mp4','video/webm','video/quicktime']),
  -- Program holder / partner documents
  ('program_holder_documents', 'program_holder_documents', false, 52428800, ARRAY['application/pdf','image/jpeg','image/png']),
  ('provider_exports',      'provider_exports',      false, 104857600, ARRAY['application/pdf','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('sam_documents',         'sam_documents',         false, 52428800,  ARRAY['application/pdf','image/jpeg','image/png']),
  -- Enrollment / apprenticeship
  ('enrollment-documents',  'enrollment-documents',  false, 52428800,  ARRAY['application/pdf','image/jpeg','image/png']),
  ('apprentice-uploads',    'apprentice-uploads',    false, 52428800,  NULL)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder in documents bucket
-- (policy may already exist from 20260417000013 — use IF NOT EXISTS guard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'users_own_documents_insert'
  ) THEN
    CREATE POLICY users_own_documents_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'users_own_documents_select'
  ) THEN
    CREATE POLICY users_own_documents_select ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'users_own_documents_delete'
  ) THEN
    CREATE POLICY users_own_documents_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 20260702000012_external_courses_support_fee.sql
-- ────────────────────────────────────────────────────────────
-- Add Elevate support fee fields to program_external_courses
--
-- elevate_fee_cents  — what Elevate charges the learner for guided support
--                      (NOT the cost of the external course itself)
-- fee_label          — human-readable label shown at checkout
--                      e.g. "Elevate Guided Support Fee"
-- support_included   — JSONB array of support services included in the fee
--                      e.g. ["Weekly coaching", "Resume support", ...]
-- payer_rule default — existing column; default 'always_student' for support fees
--                      (learner pays Elevate for support; Elevate does not pay
--                       the external provider on the learner's behalf)

ALTER TABLE public.program_external_courses
  ADD COLUMN IF NOT EXISTS elevate_fee_cents  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_label          text    NOT NULL DEFAULT 'Elevate Program Support Fee',
  ADD COLUMN IF NOT EXISTS support_included   jsonb   NOT NULL DEFAULT '[]'::jsonb;

-- Index for admin fee reporting
CREATE INDEX IF NOT EXISTS idx_pec_fee
  ON public.program_external_courses(elevate_fee_cents)
  WHERE elevate_fee_cents > 0;

COMMENT ON COLUMN public.program_external_courses.elevate_fee_cents IS
  'Fee Elevate charges for guided support services (coaching, tracking, job readiness). NOT the external course cost.';

COMMENT ON COLUMN public.program_external_courses.fee_label IS
  'Label shown to learner at checkout, e.g. "Elevate Guided Support Fee".';

COMMENT ON COLUMN public.program_external_courses.support_included IS
  'JSON array of support services included, e.g. ["Weekly coaching","Resume support"].';

-- ────────────────────────────────────────────────────────────
-- 20260702000013_workflow_engine.sql
-- ────────────────────────────────────────────────────────────
-- Workflow Engine: triggers, steps, runs
-- Extends the existing `workflows` table with full trigger→action pipeline support.

-- ── workflow_triggers ─────────────────────────────────────────────────────────
-- Defines what fires a workflow (event-based, schedule, or manual).
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_type  text NOT NULL CHECK (trigger_type IN (
    'event',        -- platform_events row matches filter
    'schedule',     -- cron expression
    'manual',       -- admin fires it manually
    'webhook'       -- inbound HTTP POST
  )),
  -- For event triggers: match on event_type / category / severity
  event_filter  jsonb DEFAULT '{}',
  -- For schedule triggers: cron expression e.g. "0 9 * * *"
  cron_expr     text,
  -- For webhook triggers: shared secret for HMAC verification
  webhook_secret text,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── workflow_steps ────────────────────────────────────────────────────────────
-- Ordered list of actions that execute when a workflow fires.
CREATE TABLE IF NOT EXISTS workflow_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_order    integer NOT NULL DEFAULT 0,
  action_type   text NOT NULL CHECK (action_type IN (
    'send_email',       -- trigger email via delivery_logs / SendGrid
    'send_notification',-- insert into notifications
    'update_record',    -- UPDATE a table row
    'create_record',    -- INSERT a table row
    'emit_event',       -- write to platform_events
    'webhook_call',     -- outbound HTTP POST
    'ai_action',        -- call AI service
    'condition'         -- branch: if/else on payload field
  )),
  action_config jsonb NOT NULL DEFAULT '{}',
  -- condition step: skip remaining steps if false
  is_condition  boolean NOT NULL DEFAULT false,
  condition_expr text,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── workflow_runs ─────────────────────────────────────────────────────────────
-- Execution log: one row per workflow invocation.
CREATE TABLE IF NOT EXISTS workflow_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_id    uuid REFERENCES workflow_triggers(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'success', 'failed', 'skipped'
  )),
  triggered_by  text,           -- 'event', 'schedule', 'manual', 'webhook'
  trigger_payload jsonb DEFAULT '{}',
  steps_total   integer NOT NULL DEFAULT 0,
  steps_done    integer NOT NULL DEFAULT 0,
  error_message text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── workflow_step_logs ────────────────────────────────────────────────────────
-- Per-step execution detail within a run.
CREATE TABLE IF NOT EXISTS workflow_step_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        uuid NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_id       uuid REFERENCES workflow_steps(id) ON DELETE SET NULL,
  step_order    integer NOT NULL DEFAULT 0,
  action_type   text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'success', 'failed', 'skipped'
  )),
  output        jsonb DEFAULT '{}',
  error_message text,
  duration_ms   integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow ON workflow_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow    ON workflow_steps(workflow_id, step_order);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow     ON workflow_runs(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status       ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_step_logs_run     ON workflow_step_logs(run_id, step_order);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE workflow_triggers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access (service role bypasses RLS)
CREATE POLICY "admin_all_workflow_triggers"  ON workflow_triggers  FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff'))
);
CREATE POLICY "admin_all_workflow_steps"     ON workflow_steps     FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff'))
);
CREATE POLICY "admin_all_workflow_runs"      ON workflow_runs      FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff'))
);
CREATE POLICY "admin_all_workflow_step_logs" ON workflow_step_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff'))
);

-- ── Seed a few example workflows ──────────────────────────────────────────────
INSERT INTO workflows (name, workflow_key, category, status, metadata) VALUES
  ('Enrollment Welcome Email',  'enrollment_welcome',   'enrollment',  'active',   '{"description":"Sends welcome email when student enrolls in a program"}'),
  ('At-Risk Student Alert',     'at_risk_alert',        'lms',         'active',   '{"description":"Notifies staff when a student has not logged in for 7 days"}'),
  ('Exam Booking Confirmation', 'exam_booking_confirm', 'compliance',  'active',   '{"description":"Sends confirmation email after exam booking is created"}'),
  ('Daily Progress Summary',    'daily_summary',        'system',      'active',   '{"description":"Sends end-of-day progress digest to instructors"}'),
  ('Certificate Issued Alert',  'cert_issued',          'lms',         'active',   '{"description":"Notifies student and staff when a certificate is issued"}')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 20260702000014_testing_center.sql
-- ────────────────────────────────────────────────────────────
-- Testing Center: seed upcoming slots in the existing testing_slots table.
-- testing_slots already exists — no schema changes needed.

INSERT INTO testing_slots (exam_type, start_time, end_time, capacity, location, notes, is_cancelled)
SELECT
  v.exam_type,
  (CURRENT_DATE + v.days_ahead)::timestamptz + v.start_offset,
  (CURRENT_DATE + v.days_ahead)::timestamptz + v.end_offset,
  v.capacity,
  'Elevate Testing Center — Indianapolis, IN',
  NULL,
  false
FROM (VALUES
  ('epa608',   1, INTERVAL '9 hours',  INTERVAL '12 hours', 10),
  ('epa608',   1, INTERVAL '13 hours', INTERVAL '16 hours', 10),
  ('nccer',    3, INTERVAL '9 hours',  INTERVAL '12 hours',  8),
  ('epa608',   5, INTERVAL '10 hours', INTERVAL '13 hours', 10),
  ('workkeys', 7, INTERVAL '9 hours',  INTERVAL '12 hours', 12)
) AS v(exam_type, days_ahead, start_offset, end_offset, capacity)
WHERE NOT EXISTS (
  SELECT 1 FROM testing_slots
  WHERE exam_type = v.exam_type
    AND start_time = (CURRENT_DATE + v.days_ahead)::timestamptz + v.start_offset
);

-- ────────────────────────────────────────────────────────────
-- 20260530100001_lms_checkpoint_certificate_rpc.sql
-- ────────────────────────────────────────────────────────────
-- =============================================================================
-- record_checkpoint_attempt RPC + certificate auto-issuance
--
-- Depends on: 20260327000003_checkpoint_gating.sql
--   (checkpoint_scores, step_submissions, program_completion_certificates tables)
--
-- Provides:
--   record_checkpoint_attempt(p_user_id, p_lesson_id, p_course_id,
--                              p_module_order, p_score, p_answers)
--     → inserts a checkpoint_scores row, increments attempt_number,
--       and auto-issues a program_completion_certificates row when all
--       checkpoints in the course have passing scores.
--
-- Apply manually via Supabase Dashboard SQL Editor.
-- =============================================================================

BEGIN;

-- ─── record_checkpoint_attempt ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.record_checkpoint_attempt(
  p_user_id      uuid,
  p_lesson_id    uuid,
  p_course_id    uuid,
  p_module_order integer,
  p_score        integer,
  p_answers      jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_passing_score  integer;
  v_attempt_number integer;
  v_passed         boolean;
  v_score_id       uuid;
  v_all_passed     boolean;
  v_cert_id        uuid;
BEGIN
  -- Resolve passing threshold from the lesson definition
  SELECT COALESCE(passing_score, 70)
    INTO v_passing_score
    FROM public.curriculum_lessons
   WHERE id = p_lesson_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'lesson_not_found');
  END IF;

  -- Determine next attempt number for this user+lesson
  SELECT COALESCE(MAX(attempt_number), 0) + 1
    INTO v_attempt_number
    FROM public.checkpoint_scores
   WHERE user_id = p_user_id
     AND lesson_id = p_lesson_id;

  v_passed := p_score >= v_passing_score;

  INSERT INTO public.checkpoint_scores (
    user_id, lesson_id, course_id, module_order,
    score, passing_score, attempt_number, answers
  ) VALUES (
    p_user_id, p_lesson_id, p_course_id, p_module_order,
    p_score, v_passing_score, v_attempt_number, p_answers
  )
  RETURNING id INTO v_score_id;

  -- Auto-issue certificate when every checkpoint in the course has a passing row
  IF v_passed THEN
    SELECT NOT EXISTS (
      SELECT 1
        FROM public.curriculum_lessons cl
       WHERE cl.course_id = p_course_id
         AND cl.step_type IN ('checkpoint', 'exam')
         AND NOT EXISTS (
               SELECT 1
                 FROM public.checkpoint_scores cs
                WHERE cs.user_id  = p_user_id
                  AND cs.lesson_id = cl.id
                  AND cs.passed    = true
             )
    ) INTO v_all_passed;

    IF v_all_passed THEN
      INSERT INTO public.program_completion_certificates (
        user_id, course_id, issued_at
      )
      SELECT p_user_id, p_course_id, now()
      WHERE NOT EXISTS (
        SELECT 1
          FROM public.program_completion_certificates
         WHERE user_id  = p_user_id
           AND course_id = p_course_id
      )
      RETURNING id INTO v_cert_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok',             true,
    'score_id',       v_score_id,
    'passed',         v_passed,
    'attempt_number', v_attempt_number,
    'passing_score',  v_passing_score,
    'certificate_id', v_cert_id
  );
END;
$$;

-- Only the authenticated role and service_role may call this function.
-- Revoke public execute so anon callers cannot record scores.
REVOKE EXECUTE ON FUNCTION public.record_checkpoint_attempt(uuid, uuid, uuid, integer, integer, jsonb)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_checkpoint_attempt(uuid, uuid, uuid, integer, integer, jsonb)
  TO authenticated, service_role;

COMMIT;

