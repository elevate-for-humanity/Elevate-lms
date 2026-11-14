-- Ensure runtime Admin navigation exposes exactly one Master Course Builder item.
-- Preserve operator-customized sections/items and keep the canonical item in the
-- first section that already contains a Course Builder-like entry.

WITH settings AS (
  SELECT key, value::jsonb AS nav
  FROM public.platform_settings
  WHERE key = 'ADMIN_NAV_SECTIONS_JSON'
    AND is_active = true
    AND jsonb_typeof(value::jsonb) = 'array'
),
expanded AS (
  SELECT s.key, section, section_ord,
         EXISTS (
           SELECT 1
           FROM jsonb_array_elements(COALESCE(section->'items', '[]'::jsonb)) item
           WHERE item->>'href' IN (
             '/studio/courses',
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
         ) AS has_builder
  FROM settings s,
       jsonb_array_elements(s.nav) WITH ORDINALITY AS sections(section, section_ord)
),
target AS (
  SELECT key, min(section_ord) FILTER (WHERE has_builder) AS target_ord
  FROM expanded
  GROUP BY key
),
rebuilt AS (
  SELECT e.key,
         jsonb_agg(
           jsonb_set(
             e.section,
             '{items}',
             (
               SELECT COALESCE(jsonb_agg(item ORDER BY item_ord), '[]'::jsonb)
               FROM (
                 SELECT item, item_ord
                 FROM jsonb_array_elements(COALESCE(e.section->'items', '[]'::jsonb))
                      WITH ORDINALITY AS items(item, item_ord)
                 WHERE NOT (
                   item->>'href' IN (
                     '/studio/courses',
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
                 )
                 UNION ALL
                 SELECT jsonb_build_object('label', 'Master Course Builder', 'href', '/studio/courses'),
                        1000000::bigint
                 WHERE e.section_ord = COALESCE(t.target_ord, 1)
               ) cleaned
             ),
             true
           )
           ORDER BY e.section_ord
         ) AS nav
  FROM expanded e
  JOIN target t USING (key)
  GROUP BY e.key
)
UPDATE public.platform_settings p
SET value = rebuilt.nav::text,
    updated_at = now()
FROM rebuilt
WHERE p.key = rebuilt.key;
