-- Complete Programs Schema Enhancement
-- Adds all fields needed for 27 full programs

-- Add new columns to programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS full_description TEXT,
ADD COLUMN IF NOT EXISTS what_you_learn TEXT[],
ADD COLUMN IF NOT EXISTS day_in_life TEXT,
ADD COLUMN IF NOT EXISTS salary_min INTEGER,
ADD COLUMN IF NOT EXISTS salary_max INTEGER,
ADD COLUMN IF NOT EXISTS credential_type TEXT,
ADD COLUMN IF NOT EXISTS credential_name TEXT,
ADD COLUMN IF NOT EXISTS employers TEXT[],
ADD COLUMN IF NOT EXISTS funding_pathways TEXT[],
ADD COLUMN IF NOT EXISTS delivery_method TEXT,
ADD COLUMN IF NOT EXISTS training_hours INTEGER,
ADD COLUMN IF NOT EXISTS prerequisites TEXT,
ADD COLUMN IF NOT EXISTS career_outcomes TEXT[],
ADD COLUMN IF NOT EXISTS industry_demand TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wioa_approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dol_registered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS placement_rate INTEGER,
ADD COLUMN IF NOT EXISTS completion_rate INTEGER,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS toolkit_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS credentialing_cost DECIMAL(10,2);

-- Create index for featured programs
CREATE INDEX IF NOT EXISTS idx_programs_featured ON public.programs(featured) WHERE featured = true;

-- Create index for active programs
CREATE INDEX IF NOT EXISTS idx_programs_active ON public.programs(is_active) WHERE is_active = true;

-- Create index for category
CREATE INDEX IF NOT EXISTS idx_programs_category ON public.programs(category);

-- Create index for slug
CREATE INDEX IF NOT EXISTS idx_programs_slug ON public.programs(slug);

-- Update RLS policies for programs
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active programs
CREATE POLICY "Anyone can view active programs" ON public.programs
  FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can view all programs
CREATE POLICY "Authenticated users can view all programs" ON public.programs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert programs
CREATE POLICY "Only admins can insert programs" ON public.programs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Only admins can update programs
CREATE POLICY "Only admins can update programs" ON public.programs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Only admins can delete programs
CREATE POLICY "Only admins can delete programs" ON public.programs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.programs IS 'Complete program catalog with all workforce development programs';
COMMENT ON COLUMN public.programs.slug IS 'URL-friendly identifier (e.g., cna-certified-nursing-assistant)';
COMMENT ON COLUMN public.programs.what_you_learn IS 'Array of key learning outcomes';
COMMENT ON COLUMN public.programs.day_in_life IS 'Narrative description of typical day in this career';
COMMENT ON COLUMN public.programs.employers IS 'Array of typical employers for this career';
COMMENT ON COLUMN public.programs.funding_pathways IS 'Array of funding options (WIOA, Pell Grant, etc.)';
COMMENT ON COLUMN public.programs.delivery_method IS 'How training is delivered (hybrid, online, in-person)';
COMMENT ON COLUMN public.programs.featured IS 'Whether to feature on homepage';
COMMENT ON COLUMN public.programs.wioa_approved IS 'Whether program is WIOA-approved';
COMMENT ON COLUMN public.programs.dol_registered IS 'Whether program is DOL-registered apprenticeship';
