-- Video generation job queue.
--
-- video_jobs tracks async render jobs submitted from the admin course builder.
-- The LMS Railway service owns rendering; admin calls POST /api/videos/generate
-- and polls GET /api/videos/status/:job_id until status = 'complete'.
--
-- course_lessons gets lightweight video tracking columns (video_job_id,
-- video_error, video_generated_at) to complement video_url and video_status
-- added in migration 20260625000005.

-- ── video_jobs table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.video_jobs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id         UUID        NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id         UUID        NOT NULL REFERENCES public.courses(id)        ON DELETE CASCADE,
  status            TEXT        NOT NULL DEFAULT 'queued'
    CHECK (status IN ('draft', 'queued', 'rendering', 'complete', 'failed')),
  video_url         TEXT,
  audio_url         TEXT,
  error_message     TEXT,
  scene_count       INTEGER,
  duration_seconds  INTEGER,
  -- Metadata stored at job creation for reproducibility
  lesson_title      TEXT        NOT NULL,
  script            TEXT,
  bullet_points     JSONB       DEFAULT '[]'::jsonb,
  scene_data        JSONB,
  -- Timing
  queued_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_jobs_lesson_id_v2 ON public.video_jobs(lesson_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status_v2    ON public.video_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_course_id_v2 ON public.video_jobs(course_id);

COMMENT ON TABLE public.video_jobs IS
  'Async video render jobs. LMS Railway service processes these; admin polls for status.';

-- ── Add video tracking columns to course_lessons ──────────────────────────────
-- video_url and video_status already added in 20260625000005.
-- Add the remaining fields from the spec.

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS video_job_id       UUID        REFERENCES public.video_jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS video_error        TEXT,
  ADD COLUMN IF NOT EXISTS video_generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_course_lessons_video_job
  ON public.course_lessons(video_job_id)
  WHERE video_job_id IS NOT NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

-- Admins and staff can read/write all jobs
DROP policy if exists "admin_full_access" on public.video_jobs;
DROP policy if exists "admin_full_access" on public.video_jobs;
CREATE policy "admin_full_access" on public.video_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Service role (used by LMS Railway worker) bypasses RLS
-- No additional policy needed — service role always bypasses.

-- ── updated_at trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_video_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_video_jobs_updated_at ON public.video_jobs;
CREATE TRIGGER trg_video_jobs_updated_at
  BEFORE UPDATE ON public.video_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_video_jobs_updated_at();
