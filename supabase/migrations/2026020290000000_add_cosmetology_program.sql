-- Add Cosmetology Apprenticeship Program

-- First ensure slug column exists
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug if not exists
CREATE UNIQUE INDEX IF NOT EXISTS programs_slug_unique ON public.programs(slug) WHERE slug IS NOT NULL;

-- Insert Cosmetology Apprenticeship program
INSERT INTO public.programs (
  code,
  title,
  slug,
  description,
  duration_weeks,
  total_hours,
  tuition,
  total_cost,
  funding_eligible,
  status,
  category
)
VALUES (
  'COSMO-2024',
  'Cosmetology Apprenticeship',
  'cosmetology-apprenticeship',
  'State-licensed cosmetology apprenticeship program covering hair styling, coloring, skincare, nail care, and salon business management. Combines hands-on training with classroom instruction.',
  52,
  1500,
  2490.00,
  2490.00,
  true,
  'active',
  'Cosmetology'
) ON CONFLICT (slug) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  total_cost = EXCLUDED.total_cost,
  status = EXCLUDED.status;

-- Also add Nail Tech program if referenced
INSERT INTO public.programs (
  code,
  title,
  slug,
  description,
  duration_weeks,
  total_hours,
  tuition,
  total_cost,
  funding_eligible,
  status,
  category
)
VALUES (
  'NAIL-2024',
  'Nail Technician Program',
  'nail-technician',
  'Professional nail technician training covering manicures, pedicures, nail art, acrylics, and salon sanitation.',
  16,
  450,
  2490.00,
  2490.00,
  true,
  'active',
  'Cosmetology'
) ON CONFLICT (slug) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  total_cost = EXCLUDED.total_cost,
  status = EXCLUDED.status;

-- Update existing programs to have slugs if missing
UPDATE public.programs SET slug = 'barber-apprenticeship' WHERE code = 'BARBER-2024' AND slug IS NULL;
UPDATE public.programs SET slug = 'hvac-technician' WHERE code = 'HVAC-2024' AND slug IS NULL;
