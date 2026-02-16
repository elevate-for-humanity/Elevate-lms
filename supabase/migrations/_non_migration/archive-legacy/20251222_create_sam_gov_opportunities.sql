-- SAM.gov Opportunities Table
-- Stores federal grant and contract opportunities from SAM.gov API

CREATE TABLE IF NOT EXISTS public.sam_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- SAM.gov identifiers
  sam_id TEXT UNIQUE NOT NULL,
  notice_id TEXT,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  type TEXT, -- 'grant', 'contract', 'assistance'
  
  -- Agency info
  agency TEXT,
  office TEXT,
  
  -- Classification
  naics_code TEXT,
  cfda_number TEXT, -- Catalog of Federal Domestic Assistance
  assistance_listing TEXT,
  
  -- Dates
  posted_date TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  archive_date TIMESTAMPTZ,
  
  -- Links
  url TEXT,
  attachment_url TEXT,
  
  -- Location
  place_of_performance JSONB,
  
  -- Eligibility
  set_aside TEXT,
  
  -- Metadata
  raw_data JSONB, -- Full API response
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_sam_id ON public.sam_opportunities(sam_id);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_type ON public.sam_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_agency ON public.sam_opportunities(agency);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_deadline ON public.sam_opportunities(response_deadline);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_posted ON public.sam_opportunities(posted_date);
CREATE INDEX IF NOT EXISTS idx_sam_opportunities_cfda ON public.sam_opportunities(cfda_number);

-- Enable RLS
ALTER TABLE public.sam_opportunities ENABLE ROW LEVEL SECURITY;

-- Public can view all opportunities
CREATE POLICY "Anyone can view opportunities"
  ON public.sam_opportunities
  FOR SELECT
  USING (true);

-- Only service role can insert/update (sync job)
CREATE POLICY "Service role can manage opportunities"
  ON public.sam_opportunities
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.sam_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'SAM.gov opportunities table created with RLS policies';
END $$;
