-- Keep runtime Admin navigation aligned with the canonical Master Course Builder surface.
-- The Admin shell reads ADMIN_NAV_SECTIONS_JSON from platform_settings before its code fallback.
-- Transform only the Course Builder entry; preserve all operator-customized sections and items.

UPDATE public.platform_settings
SET value = (
  SELECT jsonb_agg(
    jsonb_set(
      section,
      '{items}',
      COALESCE(
        (
          SELECT jsonb_agg(
            CASE
              WHEN item->>'href' IN (
                '/admin/course-builder',
                '/course-builder',
                '/admin/courses/builder',
                '/admin/course-generator',
                '/admin/quiz-builder',
                '/admin/quizzes'
              )
              OR lower(COALESCE(item->>'label', '')) IN (
                'course builder',
                'master course builder',
                'course generator',
                'quiz builder'
              )
              THEN item || jsonb_build_object(
                'label', 'Master Course Builder',
                'href', '/studio/courses'
              )
              ELSE item
            END
          )
          FROM jsonb_array_elements(COALESCE(section->'items', '[]'::jsonb)) AS item
        ),
        '[]'::jsonb
      ),
      true
    )
  )
  FROM jsonb_array_elements(value::jsonb) AS section
),
updated_at = now()
WHERE key = 'ADMIN_NAV_SECTIONS_JSON'
  AND is_active = true
  AND jsonb_typeof(value::jsonb) = 'array';
