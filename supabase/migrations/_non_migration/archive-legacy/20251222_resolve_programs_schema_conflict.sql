-- Resolve programs table schema conflict
-- Two migrations created different versions:
-- - 20241209: simple (category, delivery_mode, location_state)
-- - 20251205: rich (descriptions, hero_image, jsonb fields)
-- 
-- Solution: Ensure rich schema exists, add missing columns if needed

-- Add missing columns from rich schema (idempotent)
ALTER TABLE IF EXISTS public.programs 
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS hero_image text,
  ADD COLUMN IF NOT EXISTS hero_image_alt text,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS schedule text,
  ADD COLUMN IF NOT EXISTS delivery text,
  ADD COLUMN IF NOT EXISTS credential text,
  ADD COLUMN IF NOT EXISTS approvals jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS funding_options jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS what_you_learn jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS outcomes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS requirements jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Add missing columns from simple schema (if they don't exist)
ALTER TABLE IF EXISTS public.programs
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS delivery_mode text,
  ADD COLUMN IF NOT EXISTS location_state text;

-- Ensure NOT NULL constraints on critical fields
DO $$
BEGIN
  -- Make slug NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'programs'
    AND column_name = 'slug'
    AND is_nullable = 'YES'
  ) THEN
    -- First set default for any NULL values
    UPDATE public.programs SET slug = 'program-' || id::text WHERE slug IS NULL;
    ALTER TABLE public.programs ALTER COLUMN slug SET NOT NULL;
  END IF;

  -- Make name NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'programs'
    AND column_name = 'name'
    AND is_nullable = 'YES'
  ) THEN
    UPDATE public.programs SET name = 'Unnamed Program' WHERE name IS NULL;
    ALTER TABLE public.programs ALTER COLUMN name SET NOT NULL;
  END IF;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS programs_slug_idx ON public.programs(slug);
CREATE INDEX IF NOT EXISTS programs_is_active_idx ON public.programs(is_active);
CREATE INDEX IF NOT EXISTS programs_featured_idx ON public.programs(featured);
CREATE INDEX IF NOT EXISTS programs_category_idx ON public.programs(category);

-- Ensure unique constraint on slug
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'programs_slug_key'
    AND conrelid = 'public.programs'::regclass
  ) THEN
    ALTER TABLE public.programs ADD CONSTRAINT programs_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Log resolution
DO $$
BEGIN
  RAISE NOTICE 'Programs schema conflict resolved: all columns from both versions now present';
END $$;
