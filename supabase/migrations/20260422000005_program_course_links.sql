-- Upgrades program_course_map to the full program_course_links model.
-- program_course_map (created in 20260422000001) is renamed and extended
-- with org_id, program_id FK, is_primary, and status.
--
-- program_course_links is the canonical join between the program definition
-- layer and the LMS execution layer, scoped per org.

-- ── 1. Create program_course_links ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_course_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id   UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  program_slug TEXT,  -- fallback for programs not yet in programs table
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_primary   BOOLEAN NOT NULL DEFAULT true,
  status       TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Migrate data from program_course_map ───────────────────────────────────

INSERT INTO public.program_course_links (org_id, program_slug, course_id, is_primary, status)
SELECT
  COALESCE(pcm.org_id, (SELECT id FROM public.organizations WHERE slug = 'elevate-for-humanity' LIMIT 1)),
  pcm.program_slug,
  pcm.course_id,
  true,
  'active'
FROM public.program_course_map pcm
ON CONFLICT DO NOTHING;

-- Backfill program_id where the slug matches a programs row
UPDATE public.program_course_links pcl
SET program_id = p.id
FROM public.programs p
WHERE p.slug = pcl.program_slug
  AND pcl.program_id IS NULL;

-- ── 3. Trigger for updated_at ─────────────────────────────────────────────────

DROP TRIGGER IF EXISTS program_course_links_updated_at ON public.program_course_links;
CREATE TRIGGER program_course_links_updated_at
  BEFORE UPDATE ON public.program_course_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pcl_org_id     ON public.program_course_links (org_id);
CREATE INDEX IF NOT EXISTS idx_pcl_program_id ON public.program_course_links (program_id);
CREATE INDEX IF NOT EXISTS idx_pcl_course_id  ON public.program_course_links (course_id);
CREATE INDEX IF NOT EXISTS idx_pcl_slug       ON public.program_course_links (program_slug);

-- ── 5. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.program_course_links ENABLE ROW LEVEL SECURITY;

DROP policy if exists "pcl_org_read" on public.program_course_links;
CREATE policy "pcl_org_read" on public.program_course_links
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

GRANT SELECT ON public.program_course_links TO authenticated;
GRANT ALL    ON public.program_course_links TO service_role;

