-- Permanently retire Beauty & Career Educator from active/public program surfaces.
-- Historical applications are preserved for audit/history; the program itself
-- must not be selectable, published, featured, or treated as active.

UPDATE public.programs
SET
  status = 'archived',
  published = false,
  is_active = false,
  featured = false,
  review_status = CASE WHEN review_status IS NULL OR review_status <> 'archived' THEN 'archived' ELSE review_status END,
  updated_at = NOW()
WHERE slug = 'beauty-career-educator';
