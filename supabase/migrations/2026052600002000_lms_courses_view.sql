-- lms_courses view
--
-- Unified course source: canonical `courses` table (priority) UNION ALL
-- legacy `training_courses` (fallback for rows not yet migrated).
--
-- Pattern mirrors lms_lessons: canonical rows shadow legacy rows by id/slug.
-- All new reads should target this view. Writes always go to `courses`.
--
-- courses.status is a custom enum (course_status) — cast to text for UNION.

DROP VIEW IF EXISTS lms_courses CASCADE;

CREATE VIEW lms_courses AS
  -- Canonical rows (courses table) — priority source
  SELECT
    c.id,
    COALESCE(c.title, c.course_name)          AS title,
    c.slug,
    c.description,
    c.short_description,
    c.status::text                            AS status,
    c.is_active,
    c.published_at,
    c.thumbnail_url,
    c.duration_hours,
    c.total_lessons,
    c.generation_status,
    c.generation_progress,
    c.review_status,
    c.program_id,
    c.org_id,
    c.version,
    c.compliance_profile_key,
    c.governing_body,
    c.governing_standard_version,
    NULL::numeric                             AS passing_score,
    NULL::boolean                             AS certificate_enabled,
    NULL::uuid                                AS created_by,
    c.created_at,
    c.updated_at,
    'courses'::text                           AS course_source
  FROM courses c

  UNION ALL

  -- Legacy rows (training_courses) — only when no matching courses row exists
  SELECT
    tc.id,
    COALESCE(tc.title, tc.course_name)        AS title,
    tc.slug,
    tc.description,
    tc.summary                                AS short_description,
    CASE
      WHEN tc.is_published = true THEN 'published'
      WHEN tc.status IS NOT NULL  THEN tc.status
      ELSE 'draft'
    END                                       AS status,
    COALESCE(tc.is_active, tc.is_published, false) AS is_active,
    tc.published_at,
    tc.thumbnail_url,
    tc.duration_hours,
    NULL::integer                             AS total_lessons,
    NULL::text                                AS generation_status,
    NULL::integer                             AS generation_progress,
    tc.review_status,
    tc.program_id,
    NULL::uuid                                AS org_id,
    NULL::integer                             AS version,
    NULL::text                                AS compliance_profile_key,
    NULL::text                                AS governing_body,
    NULL::text                                AS governing_standard_version,
    tc.passing_score,
    tc.certificate_enabled,
    tc.created_by,
    tc.created_at,
    tc.updated_at,
    'training_courses'::text                  AS course_source
  FROM training_courses tc
  WHERE NOT EXISTS (
    SELECT 1 FROM courses c2
    WHERE c2.id = tc.id
       OR (c2.slug IS NOT NULL AND c2.slug = tc.slug)
  );

COMMENT ON VIEW lms_courses IS
  'Unified course source. courses rows take priority; training_courses rows appear only when no matching courses row exists (by id or slug). All writes go to courses. Reads should use this view.';
