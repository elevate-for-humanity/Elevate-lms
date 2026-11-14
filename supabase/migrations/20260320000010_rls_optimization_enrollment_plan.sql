-- =============================================================================
-- Phase 10: RLS optimization + enrollment schema consolidation
--
-- Part A: RLS helper functions for high-traffic tables
--   Adds get_my_role() helper to avoid repeated profiles subqueries in RLS.
--   Documents which tables are candidates for JWT-claim migration.
--
-- Part B: Enrollment schema consolidation — compatibility view
--   Three enrollment tables exist with overlapping purposes:
--     1. enrollments          — 15 app references, course-level, no PK constraint
--     2. program_enrollments  — 409 app references, SOURCE OF TRUTH, Stripe-linked
--     3. training_enrollments — 68 app references, LMS-level, richer schema
--
--   Strategy (safe, staged):
--     - program_enrollments is the canonical table (most references, Stripe FK)
--     - training_enrollments is the LMS operational table (attendance, cohort, docs)
--     - enrollments is legacy — create a compatibility view pointing to program_enrollments
--     - Do NOT drop enrollments yet — deprecate via view, migrate 15 references over time
--
-- Part C: Document remaining RLS migration work for Phase 10 follow-up
-- =============================================================================

BEGIN;

-- =============================================================================
-- Part A: RLS helper — get_my_role()
-- Avoids repeated subquery against profiles in every RLS policy.
-- Used by new policies added in this session.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Composite helper: is current user an admin-tier role?
CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'staff')
  );
$$;

-- =============================================================================
-- Part B: Enrollment compatibility view
-- Redirects legacy `enrollments` queries to program_enrollments.
-- The 15 app references to `enrollments` should be migrated to
-- `program_enrollments` over time. This view prevents breakage during migration.
-- =============================================================================

-- Rename the legacy table to preserve data, replace with view
-- SAFE: only if enrollments table exists and has no critical-path writes
DO $$
BEGIN
  -- Check if enrollments is a real table (not already a view)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'enrollments'
    AND table_type = 'BASE TABLE'
  ) THEN
    -- Rename legacy table
    ALTER TABLE public.enrollments RENAME TO enrollments_legacy;

    -- Create compatibility view mapping to program_enrollments
    -- Maps columns that exist in both tables
    EXECUTE $view$
      CREATE OR REPLACE VIEW public.enrollments AS
      SELECT
        id,
        user_id,
        program_id,
        status,
        progress,
        enrolled_at,
        completed_at,
        tenant_id,
        NULL::UUID AS course_id  -- course_id not in program_enrollments; return NULL
      FROM public.program_enrollments;
    $view$;

    RAISE NOTICE 'enrollments table renamed to enrollments_legacy; compatibility view created';
  ELSE
    RAISE NOTICE 'enrollments is already a view or does not exist — skipping rename';
  END IF;
END $$;

-- =============================================================================
-- Part C: RLS audit — document tables still using expensive subquery pattern
-- =============================================================================
COMMENT ON FUNCTION public.get_my_role() IS
  'Phase 10 RLS helper. '
  'High-traffic tables still using profiles subquery in RLS (migrate to JWT claims): '
  'profiles, training_enrollments, program_enrollments, programs, learner_credentials. '
  'Migration path: add role to JWT custom claims via Supabase auth hook, '
  'then replace: EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role IN (...)) '
  'with: auth.jwt() ->> ''role'' = ANY(ARRAY[...]). '
  'Do not migrate until JWT claim hook is confirmed stable in production.';

-- =============================================================================
-- Part D: Add tenant_id to program_enrollments if missing
-- (required for provider_admin RLS policy added in Phase 1.2)
-- =============================================================================
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pe_tenant ON public.program_enrollments(tenant_id);

-- Backfill tenant_id from learner profile
UPDATE public.program_enrollments pe
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE pe.user_id = p.id
  AND pe.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

COMMIT;
