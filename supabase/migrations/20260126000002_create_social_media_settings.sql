-- Create social_media_settings table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS social_media_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  profile_data JSONB,
  organizations JSONB,
  organization_id TEXT,
  enabled BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE social_media_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage social media settings
DROP POLICY IF EXISTS "Admins can manage social media settings" ON social_media_settings;
CREATE POLICY "Admins can manage social media settings"
  ON social_media_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON social_media_settings TO authenticated;

-- Create index
ALTER TABLE social_media_settings ADD COLUMN IF NOT EXISTS platform TEXT;
CREATE INDEX IF NOT EXISTS idx_social_media_settings_platform ON social_media_settings(platform);

COMMENT ON TABLE social_media_settings IS 'Stores OAuth tokens and settings for social media integrations';
