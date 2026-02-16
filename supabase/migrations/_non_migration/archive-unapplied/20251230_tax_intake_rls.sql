-- Tax Intake Table with RLS
CREATE TABLE IF NOT EXISTS tax_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Service Selection
  service_type TEXT NOT NULL CHECK (service_type IN ('full', 'self')),
  diy_service TEXT CHECK (diy_service IN ('review', 'consultation', 'guided', 'credit')),
  
  -- Client Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  
  -- Payment Status (server-controlled)
  paid BOOLEAN DEFAULT false,
  stripe_session_id TEXT,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE tax_intake ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT (anon users can submit intake)
CREATE POLICY "public_can_insert_tax_intake"
ON tax_intake
FOR INSERT
TO anon
WITH CHECK (true);

-- Block public UPDATE (only server can update)
CREATE POLICY "public_cannot_update_tax_intake"
ON tax_intake
FOR UPDATE
TO anon
USING (false);

-- Block public SELECT (only server can read)
CREATE POLICY "public_cannot_select_tax_intake"
ON tax_intake
FOR SELECT
TO anon
USING (false);

-- Allow service role full access (bypasses RLS anyway, but explicit)
CREATE POLICY "service_role_full_access_tax_intake"
ON tax_intake
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Sanitize function: force safe values on insert
CREATE OR REPLACE FUNCTION tax_intake_sanitize_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Force server-controlled fields to safe defaults
  NEW.paid := false;
  NEW.stripe_session_id := null;

  -- Validate service_type
  IF NEW.service_type NOT IN ('full', 'self') THEN
    RAISE EXCEPTION 'Invalid service_type: must be full or self';
  END IF;

  -- If full prep, clear diy_service
  IF NEW.service_type = 'full' THEN
    NEW.diy_service := null;
  END IF;

  -- If self prep, require diy_service
  IF NEW.service_type = 'self' AND NEW.diy_service IS NULL THEN
    RAISE EXCEPTION 'diy_service required when service_type is self';
  END IF;

  -- Validate diy_service if provided
  IF NEW.diy_service IS NOT NULL AND NEW.diy_service NOT IN ('review', 'consultation', 'guided', 'credit') THEN
    RAISE EXCEPTION 'Invalid diy_service';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_tax_intake_sanitize_insert ON tax_intake;

CREATE TRIGGER trg_tax_intake_sanitize_insert
BEFORE INSERT ON tax_intake
FOR EACH ROW
EXECUTE FUNCTION tax_intake_sanitize_insert();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tax_intake_email ON tax_intake(email);
CREATE INDEX IF NOT EXISTS idx_tax_intake_paid ON tax_intake(paid);
CREATE INDEX IF NOT EXISTS idx_tax_intake_created ON tax_intake(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tax_intake_stripe_session ON tax_intake(stripe_session_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tax_intake_updated_at ON tax_intake;

CREATE TRIGGER update_tax_intake_updated_at
BEFORE UPDATE ON tax_intake
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
