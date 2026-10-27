-- Rename the canonical Admin course-production entry after the Course Factory archive.
-- Keep operator-customized sections and routes intact; only normalize the single
-- canonical /studio/courses item.

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
              WHEN item->>'href' = '/studio/courses'
                OR lower(COALESCE(item->>'label', '')) IN (
                  'course factory',
                  'course builder',
                  'master course builder',
                  'ultimate course builder'
                )
              THEN item || jsonb_build_object(
                'label', 'Ultimate Course Builder',
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
