-- =====================================================
-- INTAKE FUNNEL SYSTEM
-- Staged intake: Interest → Eligibility → Application
-- =====================================================

-- Leads table for intake funnel
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stage 1: Interest
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  career_interest TEXT NOT NULL,
  source TEXT,
  
  -- Stage tracking
  stage TEXT NOT NULL DEFAULT 'INTEREST' CHECK (stage IN (
    'INTEREST',
    'ELIGIBLE',
    'INELIGIBLE',
    'APPLICATION_SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'ENROLLED'
  )),
  
  -- Stage 2: Eligibility
  eligibility_data JSONB,
  
  -- Stage 3: Application
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  application_data JSONB,
  
  -- Assignment and priority
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  
  -- Prevent duplicate emails
  UNIQUE(email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Notes table for advisor comments
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_advisor ON lead_notes(advisor_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON lead_notes(created_at DESC);

-- RLS Policies for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Public can create leads (interest form)
CREATE POLICY "Public can create leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Users can read their own leads
CREATE POLICY "Users can read own leads"
  ON leads FOR SELECT
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Advisors can read all leads
CREATE POLICY "Advisors can read all leads"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('advisor', 'admin', 'super_admin')
    )
  );

-- Advisors can update leads
CREATE POLICY "Advisors can update leads"
  ON leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('advisor', 'admin', 'super_admin')
    )
  );

-- RLS for lead notes
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advisors can manage notes"
  ON lead_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('advisor', 'admin', 'super_admin')
    )
  );

-- Updated_at trigger for leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_notes_updated_at
  BEFORE UPDATE ON lead_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-assign leads to advisors (round-robin)
CREATE OR REPLACE FUNCTION auto_assign_lead()
RETURNS TRIGGER AS $$
DECLARE
  next_advisor UUID;
BEGIN
  -- Only auto-assign when stage changes to APPLICATION_SUBMITTED
  IF NEW.stage = 'APPLICATION_SUBMITTED' AND OLD.stage != 'APPLICATION_SUBMITTED' AND NEW.assigned_to IS NULL THEN
    -- Find advisor with fewest assigned leads
    SELECT id INTO next_advisor
    FROM profiles
    WHERE role IN ('advisor', 'admin')
    ORDER BY (
      SELECT COUNT(*) FROM leads WHERE assigned_to = profiles.id AND stage IN ('APPLICATION_SUBMITTED', 'UNDER_REVIEW')
    ) ASC
    LIMIT 1;
    
    IF next_advisor IS NOT NULL THEN
      NEW.assigned_to = next_advisor;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_lead_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_lead();

-- Comments
COMMENT ON TABLE leads IS 'Intake funnel: tracks leads from interest through application';
COMMENT ON TABLE lead_notes IS 'Advisor notes and comments on leads';
COMMENT ON COLUMN leads.stage IS 'Current stage in intake funnel';
COMMENT ON COLUMN leads.eligibility_data IS 'Eligibility check results and funding types';
COMMENT ON COLUMN leads.application_data IS 'Full application submission data';
COMMENT ON COLUMN leads.priority IS 'Higher number = higher priority (0 = normal)';
