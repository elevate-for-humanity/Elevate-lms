-- Program integrity view.
--
-- Scores every non-archived program against 10 integrity checks.
-- Used by the admin dashboard Program Integrity panel and the
-- GET /api/admin/program-integrity API route.
--
-- Each check contributes 10 points. A program with score = 100 is
-- fully operational. Score < 60 = needs attention.
--
-- Apply in Supabase Dashboard → SQL Editor.

BEGIN;

CREATE OR REPLACE VIEW public.program_integrity AS
WITH

-- Count curriculum_lessons rows per program
curriculum_counts AS (
  SELECT program_id, COUNT(*) AS lesson_count
  FROM public.curriculum_lessons
  WHERE status = 'published'
  GROUP BY program_id
),

-- Count course_lessons rows per program (via courses)
course_lesson_counts AS (
  SELECT c.program_id, COUNT(col.id) AS lesson_count
  FROM public.course_lessons col
  JOIN public.courses c ON c.id = col.course_id
  GROUP BY c.program_id
),

-- Unified lesson count: prefer curriculum_lessons, fall back to course_lessons
lesson_counts AS (
  SELECT
    p.id AS program_id,
    COALESCE(cc.lesson_count, clc.lesson_count, 0) AS total_lessons
  FROM public.programs p
  LEFT JOIN curriculum_counts cc ON cc.program_id = p.id
  LEFT JOIN course_lesson_counts clc ON clc.program_id = p.id
),

-- Count modules per program
module_counts AS (
  SELECT program_id, COUNT(*) AS total_modules
  FROM public.modules
  GROUP BY program_id
),

-- Count active enrollments per program
enrollment_counts AS (
  SELECT program_id, COUNT(*) AS active_enrollments
  FROM public.program_enrollments
  WHERE status = 'active'
  GROUP BY program_id
),

-- Count completion certificates per program
cert_counts AS (
  SELECT program_id, COUNT(*) AS certificates_issued
  FROM public.program_completion_certificates
  GROUP BY program_id
),

-- Does a courses row exist for this program?
course_exists AS (
  SELECT program_id, TRUE AS has_course
  FROM public.courses
  GROUP BY program_id
),

-- Does a completion_rules row exist? (uses entity_id, not program_id)
completion_rule_exists AS (
  SELECT entity_id AS program_id, TRUE AS has_completion_rule
  FROM public.completion_rules
  WHERE entity_type = 'program'
  GROUP BY entity_id
)

SELECT
  p.id,
  p.slug,
  p.title,
  p.status,
  p.category,
  p.published,
  p.is_active,
  COALESCE(lc.total_lessons, 0)          AS total_lessons,
  COALESCE(mc.total_modules, 0)           AS total_modules,
  COALESCE(ec.active_enrollments, 0)      AS active_enrollments,
  COALESCE(cc2.certificates_issued, 0)    AS certificates_issued,
  COALESCE(ce.has_course, FALSE)          AS has_course_row,
  COALESCE(cr.has_completion_rule, FALSE) AS has_completion_rule,

  -- Integrity score (0–100): 10 points per check
  (
    -- 1. Has at least one lesson
    CASE WHEN COALESCE(lc.total_lessons, 0) > 0 THEN 10 ELSE 0 END
    -- 2. Has at least one module
    + CASE WHEN COALESCE(mc.total_modules, 0) > 0 THEN 10 ELSE 0 END
    -- 3. Has a courses row (blueprint engine linkage)
    + CASE WHEN COALESCE(ce.has_course, FALSE) THEN 10 ELSE 0 END
    -- 4. Has a completion rule
    + CASE WHEN COALESCE(cr.has_completion_rule, FALSE) THEN 10 ELSE 0 END
    -- 5. Has a title (non-empty)
    + CASE WHEN p.title IS NOT NULL AND LENGTH(TRIM(p.title)) > 0 THEN 10 ELSE 0 END
    -- 6. Has a slug (non-empty, no test artifact pattern)
    + CASE WHEN p.slug IS NOT NULL
            AND p.slug NOT LIKE '%test%'
            AND p.slug NOT LIKE 'ai-%'
            AND p.slug NOT LIKE 'gen-%'
            AND p.slug NOT LIKE 'pub-path-%'
           THEN 10 ELSE 0 END
    -- 7. Has a category assigned
    + CASE WHEN p.category IS NOT NULL AND LENGTH(TRIM(p.category)) > 0 THEN 10 ELSE 0 END
    -- 8. Is published (visible to learners)
    + CASE WHEN p.published = TRUE THEN 10 ELSE 0 END
    -- 9. Has at least one enrollment (shows it's reachable)
    + CASE WHEN COALESCE(ec.active_enrollments, 0) > 0 THEN 10 ELSE 0 END
    -- 10. Has a description
    + CASE WHEN p.description IS NOT NULL AND LENGTH(TRIM(p.description)) > 0 THEN 10 ELSE 0 END
  ) AS integrity_score,

  -- Human-readable list of failing checks
  ARRAY_REMOVE(ARRAY[
    CASE WHEN COALESCE(lc.total_lessons, 0) = 0 THEN 'no_lessons' END,
    CASE WHEN COALESCE(mc.total_modules, 0) = 0 THEN 'no_modules' END,
    CASE WHEN NOT COALESCE(ce.has_course, FALSE) THEN 'no_course_row' END,
    CASE WHEN NOT COALESCE(cr.has_completion_rule, FALSE) THEN 'no_completion_rule' END,
    CASE WHEN p.title IS NULL OR LENGTH(TRIM(p.title)) = 0 THEN 'no_title' END,
    CASE WHEN p.slug IS NULL
          OR p.slug LIKE '%test%'
          OR p.slug LIKE 'ai-%'
          OR p.slug LIKE 'gen-%'
          OR p.slug LIKE 'pub-path-%'
         THEN 'bad_slug' END,
    CASE WHEN p.category IS NULL OR LENGTH(TRIM(p.category)) = 0 THEN 'no_category' END,
    CASE WHEN p.published IS NOT TRUE THEN 'not_published' END,
    CASE WHEN COALESCE(ec.active_enrollments, 0) = 0 THEN 'no_enrollments' END,
    CASE WHEN p.description IS NULL OR LENGTH(TRIM(p.description)) = 0 THEN 'no_description' END
  ], NULL) AS failing_checks

FROM public.programs p
LEFT JOIN lesson_counts lc ON lc.program_id = p.id
LEFT JOIN module_counts mc ON mc.program_id = p.id
LEFT JOIN enrollment_counts ec ON ec.program_id = p.id
LEFT JOIN cert_counts cc2 ON cc2.program_id = p.id
LEFT JOIN course_exists ce ON ce.program_id = p.id
LEFT JOIN completion_rule_exists cr ON cr.program_id = p.id
WHERE p.status != 'archived'
ORDER BY integrity_score ASC, p.title ASC;

COMMENT ON VIEW public.program_integrity IS
  'Scores each non-archived program 0–100 across 10 operational checks. '
  'Score < 60 = needs attention. Used by admin dashboard Program Integrity panel.';

COMMIT;
