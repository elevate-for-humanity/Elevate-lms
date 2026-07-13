-- Migration: Admin Dashboard Rebuild
-- Adds admin-facing summary views for the cohorts and barriers admin pages.
-- All admin pages now query real DB tables — no hardcoded placeholder data.

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Cohort admin summary view
--    Used by /admin/cohorts to show enrollment fill rates and status.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_admin_cohort_summary AS
SELECT
  c.id,
  c.code,
  c.name,
  c.program_id,
  p.title                                                           AS program_title,
  c.start_date,
  c.end_date,
  c.max_capacity,
  c.current_enrollment,
  c.status,
  c.location,
  c.notes,
  c.created_at,
  CASE
    WHEN c.max_capacity IS NULL OR c.max_capacity = 0 THEN NULL
    ELSE ROUND((c.current_enrollment::numeric / c.max_capacity) * 100)
  END                                                               AS fill_pct,
  COUNT(te.id)                                                      AS enrolled_count
FROM public.cohorts c
LEFT JOIN public.programs p         ON p.id = c.program_id
LEFT JOIN public.training_enrollments te
       ON te.cohort_id = c.id
      AND te.status NOT IN ('withdrawn', 'cancelled')
GROUP BY c.id, p.title;

-- Grant to service_role so admin pages can read via the admin client
GRANT SELECT ON public.v_admin_cohort_summary TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Ensure participant_barriers has the status column used by /admin/barriers
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.participant_barriers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Add the constraint only if it doesn't already exist to avoid errors on re-run
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.participant_barriers'::regclass
      AND conname   = 'participant_barriers_status_check'
  ) THEN
    ALTER TABLE public.participant_barriers
      ADD CONSTRAINT participant_barriers_status_check
        CHECK (status IN ('active', 'resolved', 'in_progress'));
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Ensure api_keys table exists for /admin/api-keys
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  key_prefix  TEXT,
  key_hash    TEXT,
  scopes      TEXT[]      NOT NULL DEFAULT '{}',
  status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  last_used   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_by  UUID        REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_keys_admin_all" ON public.api_keys;
CREATE POLICY "api_keys_admin_all" ON public.api_keys
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- service_role bypass for admin client reads/writes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO service_role;
