ALTER TABLE public.video_jobs
  ADD COLUMN IF NOT EXISTS asset_kind text NOT NULL DEFAULT 'lesson',
  ADD COLUMN IF NOT EXISTS asset_key text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_jobs_asset_kind_check'
  ) THEN
    ALTER TABLE public.video_jobs
      ADD CONSTRAINT video_jobs_asset_kind_check
      CHECK (asset_kind IN ('lesson', 'microclip'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_jobs_lesson_asset
  ON public.video_jobs (lesson_id, asset_kind, asset_key, created_at DESC);
