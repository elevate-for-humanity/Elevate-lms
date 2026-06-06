-- Fix broken program card image: sanitation.jpg was never committed; asset is sanitation.webp.
-- Safe to re-run. Apply in Supabase Dashboard → SQL Editor.

UPDATE public.programs
SET
  image_url = '/images/pages/sanitation.webp',
  updated_at = now()
WHERE slug = 'sanitation-infection-control'
  AND image_url = '/images/pages/sanitation.jpg';

-- program_media may also reference the old path
UPDATE public.program_media pm
SET hero_image = '/images/pages/sanitation.webp'
FROM public.programs p
WHERE p.id = pm.program_id
  AND p.slug = 'sanitation-infection-control'
  AND pm.hero_image = '/images/pages/sanitation.jpg';
