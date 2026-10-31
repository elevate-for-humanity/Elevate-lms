-- Read-only reconciliation audit. Run in the Elevate primary Supabase project.
-- Historical builds are not publication authority; a released version is.
WITH release_rank AS (
  SELECT r.*, row_number() OVER
    (PARTITION BY r.course_id ORDER BY r.version DESC, r.released_at DESC NULLS LAST) AS rn
  FROM public.ultimate_release_versions r WHERE r.status = 'released'
), build_rollup AS (
  SELECT b.course_id,
    count(*) AS build_count,
    count(*) FILTER (WHERE b.status = 'published') AS published_builds,
    count(*) FILTER (WHERE b.status = 'running') AS running_builds,
    count(*) FILTER (WHERE b.status = 'blocked') AS blocked_builds
  FROM public.ultimate_course_builds b GROUP BY b.course_id
), lesson_rollup AS (
  SELECT course_id, count(*) AS actual_lessons
  FROM public.course_lessons GROUP BY course_id
)
SELECT c.id AS course_id, c.title, c.status AS lms_status, c.is_active,
  c.published_at, c.total_lessons, coalesce(l.actual_lessons,0) AS actual_lessons,
  coalesce(b.build_count,0) AS build_count,
  coalesce(b.published_builds,0) AS published_builds,
  coalesce(b.running_builds,0) AS running_builds,
  coalesce(b.blocked_builds,0) AS blocked_builds,
  r.id AS latest_release_id, r.build_id AS released_build_id, r.version AS release_version,
  CASE
    WHEN c.total_lessons IS DISTINCT FROM coalesce(l.actual_lessons,0)
      THEN 'LESSON_COUNT_MISMATCH'
    WHEN c.status = 'published' AND c.is_active IS DISTINCT FROM true
      THEN 'PUBLISHED_INACTIVE'
    WHEN c.status = 'published' AND r.id IS NULL
      THEN 'PUBLISHED_WITHOUT_ULTIMATE_RELEASE_REVIEW_ROUTE'
    WHEN r.id IS NOT NULL AND (c.status <> 'published' OR c.is_active IS DISTINCT FROM true)
      THEN 'RELEASED_BUT_NOT_ACTIVE'
    WHEN c.status = 'published' AND r.id IS NOT NULL
      THEN 'RELEASE_CONSISTENT'
    ELSE 'NOT_ULTIMATE_RELEASED'
  END AS reconciliation_finding
FROM public.courses c
LEFT JOIN release_rank r ON r.course_id = c.id AND r.rn = 1
LEFT JOIN build_rollup b ON b.course_id = c.id
LEFT JOIN lesson_rollup l ON l.course_id = c.id
ORDER BY reconciliation_finding, c.title;

-- Jobs grouped by CURRENT build, not just historical status totals.
SELECT c.title, b.id AS build_id, b.status AS build_status, j.status AS job_status,
  count(*) AS jobs, count(*) FILTER (WHERE j.attempts >= j.max_attempts) AS retry_exhausted
FROM public.ultimate_build_jobs j
JOIN public.ultimate_course_builds b ON b.id = j.build_id
JOIN public.courses c ON c.id = b.course_id
GROUP BY c.title,b.id,b.status,j.status ORDER BY c.title,b.id,j.status;
