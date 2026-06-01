-- Legacy crawlers, DB rows, and cached HTML may still request funding-page-3.jpg after WebP migration.
-- Repo ships both assets; normalize any stored paths to the canonical WebP.
-- Safe to re-run. Apply in Supabase Dashboard → SQL Editor.

UPDATE public.programs
SET image_url = '/images/pages/funding-page-3.webp', updated_at = now()
WHERE image_url = '/images/pages/funding-page-3.jpg';

UPDATE public.program_media pm
SET hero_image = '/images/pages/funding-page-3.webp'
FROM public.programs p
WHERE p.id = pm.program_id
  AND pm.hero_image = '/images/pages/funding-page-3.jpg';

UPDATE public.platform_settings
SET value = replace(value, '/images/pages/funding-page-3.jpg', '/images/pages/funding-page-3.webp'),
    updated_at = now()
WHERE value LIKE '%/images/pages/funding-page-3.jpg%';
