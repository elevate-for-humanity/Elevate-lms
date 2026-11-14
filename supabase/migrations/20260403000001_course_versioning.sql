-- Course versioning
-- Students are locked to the version active at enrollment time.
-- Content changes create a new version; enrolled students are unaffected.

-- ── 1. course_versions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  version_number INTEGER     NOT NULL,
  label          TEXT,                          -- e.g. "v1.2 — EPA 608 update"
  is_published   BOOLEAN     NOT NULL DEFAULT false,
  published_at   TIMESTAMPTZ,
  created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE(course_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_cv_course_id    ON public.course_versions(course_id);
CREATE INDEX IF NOT EXISTS idx_cv_published    ON public.course_versions(course_id, is_published);

-- ── 2. course_version_modules ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_version_modules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.course_versions(id) ON DELETE CASCADE,
  module_id  UUID NOT NULL REFERENCES public.course_modules(id)  ON DELETE CASCADE
  UNIQUE(version_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_cvm_version_id ON public.course_version_modules(version_id);

-- ── 3. course_version_lessons ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_version_lessons (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.course_versions(id)  ON DELETE CASCADE,
  lesson_id  UUID NOT NULL REFERENCES public.course_lessons(id)   ON DELETE CASCADE
  UNIQUE(version_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_cvl_version_id ON public.course_version_lessons(version_id);

-- ── 4. Add course_version_id to program_enrollments ──────────────────────────
-- Students are locked to the version active when they enrolled.
-- NULL = enrolled before versioning was introduced (treated as latest).

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS course_version_id UUID
    REFERENCES public.course_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pe_course_version
  ON public.program_enrollments(course_version_id);

-- ── 5. Seed v1 for HVAC (the only published course) ──────────────────────────

INSERT INTO public.course_versions (course_id, version_number, label, is_published, published_at)
SELECT
  c.id,
  1,
  'v1 — initial',
  true,
  c.published_at
FROM public.courses c
WHERE c.slug = 'hvac-technician'
  AND c.status = 'published'
ON CONFLICT (course_id, version_number) DO NOTHING;

-- Attach all current modules to v1
INSERT INTO public.course_version_modules (version_id, module_id)
SELECT cv.id, cm.id
FROM public.course_versions cv
JOIN public.course_modules cm ON cm.course_id = cv.course_id
WHERE cv.version_number = 1
ON CONFLICT (version_id, module_id) DO NOTHING;

-- Attach all current lessons to v1
INSERT INTO public.course_version_lessons (version_id, lesson_id)
SELECT cv.id, cl.id
FROM public.course_versions cv
JOIN public.course_lessons cl ON cl.course_id = cv.course_id
WHERE cv.version_number = 1
ON CONFLICT (version_id, lesson_id) DO NOTHING;

-- ── 6. Helper: get latest published version for a course ─────────────────────

CREATE OR REPLACE FUNCTION public.get_latest_published_version(p_course_id UUID)
RETURNS public.course_versions
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT *
  FROM public.course_versions
  WHERE course_id = p_course_id
    AND is_published = true
  ORDER BY version_number DESC
  LIMIT 1;
$$;

-- ── 7. Helper: snapshot current course state as a new version ─────────────────
-- Called by publish_course() when content changes after initial publish.

CREATE OR REPLACE FUNCTION public.snapshot_course_version(
  p_course_id  UUID,
  p_created_by UUID,
  p_label      TEXT DEFAULT NULL
)
RETURNS public.course_versions
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_next_num INTEGER;
  v_version  public.course_versions;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_num
  FROM public.course_versions
  WHERE course_id = p_course_id;

  INSERT INTO public.course_versions
    (course_id, version_number, label, is_published, published_at, created_by)
  VALUES
    (p_course_id, v_next_num, p_label, true, now(), p_created_by)
  RETURNING * INTO v_version;

  -- Snapshot modules
  INSERT INTO public.course_version_modules (version_id, module_id)
  SELECT v_version.id, cm.id
  FROM public.course_modules cm
  WHERE cm.course_id = p_course_id;

  -- Snapshot lessons
  INSERT INTO public.course_version_lessons (version_id, lesson_id)
  SELECT v_version.id, cl.id
  FROM public.course_lessons cl
  WHERE cl.course_id = p_course_id;

  RETURN v_version;
END;
$$;

-- ── 8. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.course_versions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_version_modules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_version_lessons  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published versions"
  ON public.course_versions FOR SELECT
  USING (is_published = true);

CREATE POLICY "Service role full access to versions"
  ON public.course_versions USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated read version modules"
  ON public.course_version_modules FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Service role full access to version modules"
  ON public.course_version_modules USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated read version lessons"
  ON public.course_version_lessons FOR SELECT
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Service role full access to version lessons"
  ON public.course_version_lessons USING (auth.role() = 'service_role');

GRANT SELECT ON public.course_versions        TO authenticated, anon;
GRANT ALL    ON public.course_versions        TO service_role;
GRANT SELECT ON public.course_version_modules TO authenticated;
GRANT ALL    ON public.course_version_modules TO service_role;
GRANT SELECT ON public.course_version_lessons TO authenticated;
GRANT ALL    ON public.course_version_lessons TO service_role;
