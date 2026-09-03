-- Migration: Add columns needed for host shop matching system
-- Run at: 2026-08-04

BEGIN;

-- Add columns for matching system if they don't exist
ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS is_accepting_apprentices BOOLEAN DEFAULT true;

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS max_apprentices INTEGER DEFAULT 5;

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS current_apprentice_count INTEGER DEFAULT 0;

-- Add shop profile fields
ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS shop_status TEXT DEFAULT 'active' CHECK (shop_status IN ('active', 'inactive', 'suspended'));

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2);

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Contact info
ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Services and specialization
ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.public 
ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS years_experience INTEGER;

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS mentor_count INTEGER DEFAULT 0;

-- Availability details
ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS availability_notes TEXT;

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS active_days TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri']::TEXT[];

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS open_time TEXT DEFAULT '09:00';

ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS close_time TEXT DEFAULT '17:00';

-- For backwards compatibility with old API
ALTER TABLE public.host_shops 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update name from business_name if name is null
UPDATE public.host_shops SET name = business_name WHERE name IS NULL;

ALTER TABLE public.host_shops 
ALTER COLUMN name SET DEFAULT business_name;

ALTER TABLE public.host_shops 
ALTER COLUMN name SET NOT NULL;

-- Add owner_id for owner lookup if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'host_shops' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.host_shops ADD COLUMN owner_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_host_shops_accepting ON public.host_shops(is_accepting_apprentices) WHERE is_accepting_apprentices = true;
CREATE INDEX IF NOT EXISTS idx_host_shops_city ON public.host_shops(city);
CREATE INDEX IF NOT EXISTS idx_host_shops_status ON public.host_shops(shop_status);

-- Add a function to update apprentice count automatically
CREATE OR REPLACE FUNCTION public.update_shop_apprentice_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.host_shops 
    SET current_apprentice_count = current_apprentice_count + 1 
    WHERE id = NEW.host_shop_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.host_shops 
    SET current_apprentice_count = GREATEST(0, current_apprentice_count - 1) 
    WHERE id = OLD.host_shop_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for host_shop_apprentices if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'host_shop_apprentices'
  ) THEN
    DROP TRIGGER IF EXISTS trg_update_shop_apprentice_count ON public.host_shop_apprentices;
    CREATE TRIGGER trg_update_shop_apprentice_count
      AFTER INSERT OR DELETE ON public.host_shop_apprentices
      FOR EACH ROW EXECUTE FUNCTION public.update_shop_apprentice_count();
  END IF;
END $$;

COMMIT;
