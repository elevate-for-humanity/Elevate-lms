-- Fix broken program card image: sanitation.jpg was never committed; asset is sanitation.webp.
-- Safe to re-run. Apply in Supabase Dashboard → SQL Editor.

UPDATE public.programs
SET
  image_url = '/images/pages/sanitation.webp',
  updated_at = now()
WHERE slug = 'sanitation-infection-control'
  AND image_url = '/images/pages/sanitation.jpg';
