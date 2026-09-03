-- Unarchive and publish Beauty Career Educator (beauty-career-educator).
-- Safe to re-run (idempotent).

UPDATE public.programs
SET
  status = 'published',
  is_active = true,
  published = true,
  review_status = COALESCE(NULLIF(review_status, 'archived'), 'published'),
  updated_at = NOW()
WHERE slug = 'beauty-career-educator';

-- Ensure row exists if missing (e.g. fresh DB)
INSERT INTO public.programs (
  slug,
  title,
  short_description,
  description,
  category,
  duration,
  credential_type,
  image_url,
  is_active,
  published,
  status,
  created_at,
  updated_at
)
SELECT
  'beauty-career-educator',
  'Beauty & Career Educator Training',
  '12-week hybrid program for salon professionals moving into education.',
  'Salon services, peer teaching, Certiport ESB, and Rise Up certification. Hybrid schedule.',
  'beauty',
  '12 weeks',
  'Rise Up Career Readiness Credential',
  '/images/beauty/program-beauty-training.webp',
  true,
  true,
  'published',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.programs WHERE slug = 'beauty-career-educator'
);
