-- Consent Management System
-- Tracks user consents for FERPA, marketing, data sharing, etc.

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'educational_services',
    'ferpa_directory',
    'marketing_communications',
    'third_party_sharing',
    'cookies_analytics',
    'parental_consent'
  )),
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  consent_text TEXT,
  third_party_name TEXT,
  parent_name TEXT,
  parent_relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, consent_type, third_party_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_granted ON user_consents(granted) WHERE granted = true;

-- Enable RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own consents"
  ON user_consents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own consents"
  ON user_consents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own consents"
  ON user_consents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all consents"
  ON user_consents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Function to record consent
CREATE OR REPLACE FUNCTION record_consent(
  p_user_id UUID,
  p_consent_type TEXT,
  p_granted BOOLEAN,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_third_party_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  INSERT INTO user_consents (
    user_id,
    consent_type,
    granted,
    granted_at,
    withdrawn_at,
    ip_address,
    user_agent,
    third_party_name
  ) VALUES (
    p_user_id,
    p_consent_type,
    p_granted,
    CASE WHEN p_granted THEN NOW() ELSE NULL END,
    CASE WHEN NOT p_granted THEN NOW() ELSE NULL END,
    p_ip_address,
    p_user_agent,
    p_third_party_name
  )
  ON CONFLICT (user_id, consent_type, third_party_name)
  DO UPDATE SET
    granted = p_granted,
    granted_at = CASE WHEN p_granted THEN NOW() ELSE user_consents.granted_at END,
    withdrawn_at = CASE WHEN NOT p_granted THEN NOW() ELSE NULL END,
    updated_at = NOW()
  RETURNING id INTO v_consent_id;

  RETURN v_consent_id;
END;
$$;

-- Function to check if user has active consent
CREATE OR REPLACE FUNCTION has_consent(
  p_user_id UUID,
  p_consent_type TEXT,
  p_third_party_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_consent BOOLEAN;
BEGIN
  SELECT granted INTO v_has_consent
  FROM user_consents
  WHERE user_id = p_user_id
    AND consent_type = p_consent_type
    AND (p_third_party_name IS NULL OR third_party_name = p_third_party_name)
    AND granted = true
    AND withdrawn_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_has_consent, false);
END;
$$;

-- Comments
COMMENT ON TABLE user_consents IS 'Tracks user consents for FERPA, marketing, and data sharing';
COMMENT ON COLUMN user_consents.consent_type IS 'Type of consent granted or withdrawn';
COMMENT ON COLUMN user_consents.granted IS 'Whether consent is currently granted';
COMMENT ON COLUMN user_consents.granted_at IS 'When consent was granted';
COMMENT ON COLUMN user_consents.withdrawn_at IS 'When consent was withdrawn';
COMMENT ON COLUMN user_consents.third_party_name IS 'Name of third party for data sharing consents';
COMMENT ON COLUMN user_consents.parent_name IS 'Parent/guardian name for minor consents';
