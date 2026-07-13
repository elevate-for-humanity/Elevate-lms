ALTER TABLE public.program_course_versions
  ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE public.program_versions ADD COLUMN IF NOT EXISTS version int NOT NULL DEFAULT 1;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.program_versions
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Program and course version snapshots.
-- Snapshot-on-publish: when a program or course is published, the full
-- state is captured as JSONB. Rollback restores from snapshot.
--
-- course_lesson_versions (per-lesson) was added in 20260422000002.
-- This migration adds program-level and course-level snapshots.

-- ── program_versions ──────────────────────────────────────────────────────────

-- table already exists

CREATE INDEX IF NOT EXISTS idx_program_versions_program ON public.program_versions (program_id, version DESC);

ALTER TABLE public.program_versions ENABLE ROW LEVEL SECURITY;

DROP policy if exists "program_versions_read" on public.program_versions;
CREATE policy "program_versions_read" on public.program_versions
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.program_versions TO authenticated;
GRANT ALL    ON public.program_versions TO service_role;

-- ── course_versions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  snapshot    JSONB NOT NULL,   -- full course + modules + lessons state
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_course_versions_course ON public.course_versions (course_id, version DESC);
EXCEPTION WHEN undefined_column THEN
  CREATE INDEX IF NOT EXISTS idx_course_versions_course ON public.course_versions (course_id, version_number DESC);
END $$;

ALTER TABLE public.course_versions ENABLE ROW LEVEL SECURITY;

DROP policy if exists "course_versions_read" on public.course_versions;
CREATE policy "course_versions_read" on public.course_versions
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.course_versions TO authenticated;
GRANT ALL    ON public.course_versions TO service_role;

-- ── version counter columns ───────────────────────────────────────────────────

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS version         INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by    UUID REFERENCES auth.users(id);

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS version         INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by    UUID REFERENCES auth.users(id);

