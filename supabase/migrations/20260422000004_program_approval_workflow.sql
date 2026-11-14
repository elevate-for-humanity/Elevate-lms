-- Adds approval workflow to programs and courses.
-- Enables: draft → in_review → approved → published → archived
-- Reviewers can approve/reject. Only approved programs can be published.

-- ── 1. programs: add review_status + reviewer tracking ───────────────────────

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'in_review', 'approved', 'rejected', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS submitted_for_review_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_by             UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by              UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS review_notes             TEXT;

-- ── 2. courses: same workflow ─────────────────────────────────────────────────

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'in_review', 'approved', 'rejected', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS submitted_for_review_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_by             UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by              UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS review_notes             TEXT;

-- ── 3. program_review_log — immutable audit trail ────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_review_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  course_id    UUID REFERENCES public.courses(id)  ON DELETE CASCADE,
  action       TEXT NOT NULL CHECK (action IN (
    'submitted', 'approved', 'rejected', 'published', 'archived', 'reverted_to_draft'
  )),
  from_status  TEXT NOT NULL,
  to_status    TEXT NOT NULL,
  actor_id     UUID NOT NULL REFERENCES auth.users(id),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  -- At least one of program_id or course_id must be set
  CONSTRAINT review_log_target_check CHECK (
    program_id IS NOT NULL OR course_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_program_review_log_program ON public.program_review_log (program_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_review_log_course  ON public.program_review_log (course_id,  created_at DESC);

ALTER TABLE public.program_review_log ENABLE ROW LEVEL SECURITY;

-- Org members can read their own review logs; platform admins see all.
DROP POLICY IF EXISTS "review_log_read" ON public.program_review_log;
CREATE POLICY "review_log_read" ON public.program_review_log
  FOR SELECT TO authenticated
  USING (
    -- Platform admin sees everything
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
    OR
    -- Org members see logs for their programs
    program_id IN (
      SELECT p.id FROM public.programs p
      JOIN public.organization_users ou ON ou.organization_id = p.organization_id
      WHERE ou.user_id = auth.uid() AND ou.status = 'active'
    )
  );

GRANT SELECT ON public.program_review_log TO authenticated;
GRANT ALL    ON public.program_review_log TO service_role;

-- ── 4. Backfill existing published programs to review_status = 'published' ───

UPDATE public.programs
SET review_status = 'published'
WHERE published = true AND review_status = 'draft';

UPDATE public.programs
SET review_status = 'archived'
WHERE status = 'archived' AND review_status = 'draft';

UPDATE public.courses
SET review_status = 'published'
WHERE status = 'published' AND review_status = 'draft';

UPDATE public.courses
SET review_status = 'archived'
WHERE status = 'archived' AND review_status = 'draft';
