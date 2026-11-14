-- Adds org_id to the builder execution layer tables.
-- organizations.slug = 'elevate-for-humanity' is the Elevate Core org.
-- organization_users uses organization_id (not org_id).
-- programs already has organization_id — this migration adds org_id on
-- courses, course_modules, course_lessons, and program_course_map.

-- ── 1. Add org_id to courses ──────────────────────────────────────────────────

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

UPDATE public.courses
SET org_id = (SELECT id FROM public.organizations WHERE slug = 'elevate-for-humanity' LIMIT 1)
WHERE org_id IS NULL;

-- ── 2. Add org_id to course_modules ──────────────────────────────────────────

ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

UPDATE public.course_modules
SET org_id = (SELECT id FROM public.organizations WHERE slug = 'elevate-for-humanity' LIMIT 1)
WHERE org_id IS NULL;

-- ── 3. Add org_id to course_lessons ──────────────────────────────────────────

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Backfill org_id only on rows that won't trip content integrity checks
-- (rows that already have content or are not in a published course)
UPDATE public.course_lessons cl
SET org_id = (SELECT id FROM public.organizations WHERE slug = 'elevate-for-humanity' LIMIT 1)
WHERE cl.org_id IS NULL
  AND (
    cl.content IS NOT NULL
    OR cl.status != 'published'
    OR NOT EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = cl.course_id AND c.status = 'published'
    )
  );

-- ── 4. Add org_id to program_course_map ──────────────────────────────────────

ALTER TABLE public.program_course_map
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

UPDATE public.program_course_map
SET org_id = (SELECT id FROM public.organizations WHERE slug = 'elevate-for-humanity' LIMIT 1)
WHERE org_id IS NULL;

-- ── 5. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_courses_org_id        ON public.courses (org_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_org_id ON public.course_modules (org_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_org_id ON public.course_lessons (org_id);

-- ── 6. RLS policies — org members can read their org's content ───────────────

-- courses
DROP POLICY IF EXISTS "courses_org_read" ON public.courses;
CREATE POLICY "courses_org_read" ON public.courses
  FOR SELECT TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- course_lessons
DROP POLICY IF EXISTS "course_lessons_org_read" ON public.course_lessons;
CREATE POLICY "course_lessons_org_read" ON public.course_lessons
  FOR SELECT TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
