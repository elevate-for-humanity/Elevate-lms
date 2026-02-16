-- Social Media Campaigns Table
CREATE TABLE IF NOT EXISTS social_media_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content_source TEXT NOT NULL CHECK (content_source IN ('blog', 'ai', 'manual')),
  platforms TEXT[] NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('3x-daily', 'daily', 'weekly')),
  posting_times TEXT[] DEFAULT ARRAY['09:00', '13:00', '17:00'],
  program TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  posts TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  last_post_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Social Media Posts Log Table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES social_media_campaigns(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  post_index INTEGER NOT NULL,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('posted', 'failed', 'deleted')),
  engagement_likes INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_campaigns_status ON social_media_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_campaign ON social_media_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_media_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_media_posts(posted_at);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_social_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_campaigns_updated_at
  BEFORE UPDATE ON social_media_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_social_campaigns_updated_at();

-- RLS Policies
ALTER TABLE social_media_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

-- Admin can manage campaigns
CREATE POLICY "Admins can manage social campaigns" ON social_media_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admin can view posts
CREATE POLICY "Admins can view social posts" ON social_media_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE social_media_campaigns IS 'Social media campaigns with 3x daily posting';
COMMENT ON TABLE social_media_posts IS 'Individual social media posts with engagement tracking';
COMMENT ON COLUMN social_media_campaigns.frequency IS '3x-daily posts at 9 AM, 1 PM, 5 PM EST';
COMMENT ON COLUMN social_media_posts.status IS 'Post status: posted, failed, deleted';
