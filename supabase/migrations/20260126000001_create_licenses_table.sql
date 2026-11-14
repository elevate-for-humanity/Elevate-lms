-- Create licenses table for white-label deployments
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'business', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'cancelled')),
  features JSONB DEFAULT '[]'::jsonb,
  max_deployments INTEGER DEFAULT 1,
  max_users INTEGER DEFAULT 50,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_validated_at TIMESTAMPTZ,
  validation_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS domain TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_domain ON licenses(domain);
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS license_key TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);

-- Create license validation log
CREATE TABLE IF NOT EXISTS license_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  result TEXT NOT NULL CHECK (result IN ('valid', 'expired', 'invalid', 'suspended')),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE license_validations ADD COLUMN IF NOT EXISTS license_id TEXT;
CREATE INDEX IF NOT EXISTS idx_license_validations_license_id ON license_validations(license_id);
ALTER TABLE license_validations ADD COLUMN IF NOT EXISTS validated_at TEXT;
CREATE INDEX IF NOT EXISTS idx_license_validations_validated_at ON license_validations(validated_at);

-- Enable RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_validations ENABLE ROW LEVEL SECURITY;

-- Only service role can manage licenses (admin API)
DROP POLICY IF EXISTS "Service role can manage licenses" ON licenses;
CREATE POLICY "Service role can manage licenses"
  ON licenses
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage validations" ON license_validations;
CREATE POLICY "Service role can manage validations"
  ON license_validations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to update license validation stats
CREATE OR REPLACE FUNCTION update_license_validation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE licenses
  SET 
    last_validated_at = NEW.validated_at,
    validation_count = validation_count + 1,
    updated_at = NOW()
  WHERE id = NEW.license_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update license stats
CREATE TRIGGER trigger_update_license_validation
  AFTER INSERT ON license_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_license_validation();

-- Function to check and expire old licenses
CREATE OR REPLACE FUNCTION expire_old_licenses()
RETURNS void AS $$
BEGIN
  UPDATE licenses
  SET status = 'expired', updated_at = NOW()
  WHERE expires_at < NOW()
  AND status = 'active';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE licenses IS 'Stores license keys for white-label deployments';
COMMENT ON TABLE license_validations IS 'Logs all license validation attempts';
