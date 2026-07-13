-- Media asset registry.
-- Replaces loose file path strings on lesson rows with typed asset references.
-- Lessons reference assets by ID; the path lives in one place.

CREATE TABLE IF NOT EXISTS public.media_assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  storage_path     TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('video', 'audio', 'image', 'document', 'other')),
  mime_type        TEXT,
  duration_seconds INTEGER,
  transcript       TEXT,
  title            TEXT,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_org_id ON public.media_assets (org_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type   ON public.media_assets (type);

DROP TRIGGER IF EXISTS media_assets_updated_at ON public.media_assets;
CREATE TRIGGER media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_assets_org_read" ON public.media_assets;
CREATE POLICY "media_assets_org_read" ON public.media_assets
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

GRANT SELECT ON public.media_assets TO authenticated;
GRANT ALL    ON public.media_assets TO service_role;

-- Add media_asset_id reference to course_lessons.
-- Preserves existing video_url/video_file columns for backward compatibility.
-- New lessons should set media_asset_id; legacy lessons keep video_url.

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_lessons_media_asset
  ON public.course_lessons (media_asset_id)
  WHERE media_asset_id IS NOT NULL;

-- Same for curriculum_lessons (live LMS table)
ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL;
