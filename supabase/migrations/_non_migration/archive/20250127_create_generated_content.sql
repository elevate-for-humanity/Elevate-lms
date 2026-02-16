-- Migration: Create generated content table
-- Created: 2025-01-27

-- Generated content table
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content Details
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  program TEXT,
  theme TEXT,
  content TEXT NOT NULL,
  
  -- Media
  image_url TEXT,
  video_url TEXT,
  
  -- Scheduling
  scheduled_date TIMESTAMPTZ,
  published_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  
  -- Engagement Metrics
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  
  -- Metadata
  generated_by TEXT DEFAULT 'openai',
  edited_by UUID,
  approved_by UUID,
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_generated_content_platform ON generated_content(platform);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
CREATE INDEX IF NOT EXISTS idx_generated_content_scheduled_date ON generated_content(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_generated_content_content_type ON generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_program ON generated_content(program);

-- Enable Row Level Security
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Service role full access
CREATE POLICY "Service role full access on generated_content"
  ON generated_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view published content
CREATE POLICY "Authenticated users can view published content"
  ON generated_content
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Add updated_at trigger
CREATE TRIGGER update_generated_content_updated_at
  BEFORE UPDATE ON generated_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
