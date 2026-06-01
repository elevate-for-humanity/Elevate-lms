-- Normalize program card images: repo canonical assets are .webp; legacy rows still use .jpg.
-- Safe to re-run. Apply in Supabase Dashboard → SQL Editor.
-- JPEG aliases remain in public/ for Next.js optimizer / crawlers.

UPDATE public.programs
SET image_url = regexp_replace(image_url, '\.jpg$', '.webp'),
    updated_at = now()
WHERE image_url LIKE '/images/pages/%.jpg';

UPDATE public.program_media pm
SET hero_image = regexp_replace(hero_image, '\.jpg$', '.webp')
FROM public.programs p
WHERE p.id = pm.program_id
  AND pm.hero_image LIKE '/images/pages/%.jpg';
