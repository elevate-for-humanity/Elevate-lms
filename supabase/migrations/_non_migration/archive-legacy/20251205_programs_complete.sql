-- ============================================================================
-- PROGRAMS TABLE - Complete Schema for Elevate Workforce Platform
-- ============================================================================
-- This migration creates the programs table with all fields needed for
-- workforce training programs (HVAC, CNA, Barber, CDL, etc.)
-- ============================================================================

-- Drop existing table if it exists (for clean reinstall)
DROP TABLE IF EXISTS programs CASCADE;

-- Create programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_tagline TEXT,
  
  -- Hero Image
  hero_image TEXT,
  hero_image_alt TEXT,
  
  -- Program Details
  level TEXT,
  duration TEXT,
  format TEXT,
  schedule TEXT,
  tuition_notes TEXT,
  
  -- Arrays
  funding_options TEXT[],
  who_it_is_for TEXT[],
  outcomes TEXT[],
  highlights TEXT[],
  
  -- CTAs
  cta_primary_label TEXT,
  cta_primary_href TEXT,
  cta_secondary_label TEXT,
  cta_secondary_href TEXT,
  
  -- Status & Metadata
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_programs_slug ON programs(slug);
CREATE INDEX idx_programs_active ON programs(is_active);
CREATE INDEX idx_programs_featured ON programs(is_featured);
CREATE INDEX idx_programs_display_order ON programs(display_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_programs_updated_at();

-- Enable Row Level Security
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public read access for active programs
CREATE POLICY "Public can view active programs"
  ON programs FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all programs
CREATE POLICY "Authenticated users can view all programs"
  ON programs FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage programs"
  ON programs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin'
           OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
    )
  );

-- Grant permissions
GRANT SELECT ON programs TO anon;
GRANT ALL ON programs TO authenticated;

COMMENT ON TABLE programs IS 'Workforce training programs (HVAC, CNA, Barber, CDL, etc.)';
COMMENT ON COLUMN programs.slug IS 'URL-friendly identifier (e.g., hvac-technician)';
COMMENT ON COLUMN programs.funding_options IS 'Array of funding sources (WIOA, grants, etc.)';
COMMENT ON COLUMN programs.who_it_is_for IS 'Array of target audience descriptions';
COMMENT ON COLUMN programs.outcomes IS 'Array of learning outcomes';
COMMENT ON COLUMN programs.highlights IS 'Array of program highlights';
