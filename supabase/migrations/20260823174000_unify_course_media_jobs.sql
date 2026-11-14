-- Canonical course-media identity, retry metadata, and deduplication.
-- One logical media asset exists per (course, lesson, kind, key), where lesson videos
-- normalize NULL asset_key to the empty string.

ALTER TABLE public.video_jobs
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_provider text,
  ADD COLUMN IF NOT EXISTS last_provider_model text,
  ADD COLUMN IF NOT EXISTS last_failure_at timestamptz;

WITH ranked AS (
  SELECT
    id,
    course_id,
    lesson_id,
    COALESCE(asset_kind, 'lesson') AS asset_kind,
    COALESCE(asset_key, '') AS normalized_asset_key,
    ROW_NUMBER() OVER (
      PARTITION BY course_id, lesson_id, COALESCE(asset_kind, 'lesson'), COALESCE(asset_key, '')
      ORDER BY
        CASE WHEN status = 'complete' AND NULLIF(video_url, '') IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN status = 'rendering' THEN 0 WHEN status = 'queued' THEN 1 WHEN status = 'failed' THEN 2 ELSE 3 END,
        updated_at DESC NULLS LAST,
        created_at DESC NULLS LAST,
        id DESC
    ) AS rn
  FROM public.video_jobs
), keepers AS (
  SELECT id, course_id, lesson_id, asset_kind, normalized_asset_key
  FROM ranked
  WHERE rn = 1
), losers AS (
  SELECT r.id, r.lesson_id, r.asset_kind, k.id AS keeper_id
  FROM ranked r
  JOIN keepers k
    ON k.course_id = r.course_id
   AND k.lesson_id = r.lesson_id
   AND k.asset_kind = r.asset_kind
   AND k.normalized_asset_key = r.normalized_asset_key
  WHERE r.rn > 1
)
UPDATE public.course_lessons l
SET video_job_id = x.keeper_id
FROM losers x
WHERE x.asset_kind = 'lesson'
  AND l.id = x.lesson_id
  AND l.video_job_id = x.id;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY course_id, lesson_id, COALESCE(asset_kind, 'lesson'), COALESCE(asset_key, '')
      ORDER BY
        CASE WHEN status = 'complete' AND NULLIF(video_url, '') IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN status = 'rendering' THEN 0 WHEN status = 'queued' THEN 1 WHEN status = 'failed' THEN 2 ELSE 3 END,
        updated_at DESC NULLS LAST,
        created_at DESC NULLS LAST,
        id DESC
    ) AS rn
  FROM public.video_jobs
)
DELETE FROM public.video_jobs j
USING ranked r
WHERE j.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_video_jobs_canonical_asset
  ON public.video_jobs (
    course_id,
    lesson_id,
    COALESCE(asset_kind, 'lesson'),
    COALESCE(asset_key, '')
  );

CREATE INDEX IF NOT EXISTS idx_video_jobs_course_status_priority
  ON public.video_jobs (course_id, status, asset_kind, queued_at, id);

ALTER TABLE public.video_jobs
  DROP CONSTRAINT IF EXISTS video_jobs_retry_count_nonnegative;
ALTER TABLE public.video_jobs
  ADD CONSTRAINT video_jobs_retry_count_nonnegative CHECK (retry_count >= 0);
