-- Tax Return Drafts Table
-- Save in-progress DIY tax returns

CREATE TABLE IF NOT EXISTS tax_return_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  tax_year INTEGER NOT NULL,
  current_step INTEGER DEFAULT 1,
  return_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, tax_year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tax_return_drafts_email ON tax_return_drafts(email);
CREATE INDEX IF NOT EXISTS idx_tax_return_drafts_year ON tax_return_drafts(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_return_drafts_updated ON tax_return_drafts(updated_at DESC);

-- RLS
ALTER TABLE tax_return_drafts ENABLE ROW LEVEL SECURITY;

-- Users can view their own drafts
CREATE POLICY "Users can view own drafts"
  ON tax_return_drafts
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can insert their own drafts
CREATE POLICY "Users can insert own drafts"
  ON tax_return_drafts
  FOR INSERT
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can update their own drafts
CREATE POLICY "Users can update own drafts"
  ON tax_return_drafts
  FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Service role can manage all
CREATE POLICY "Service role can manage drafts"
  ON tax_return_drafts
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_tax_return_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tax_return_drafts_updated_at
  BEFORE UPDATE ON tax_return_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_return_drafts_updated_at();
