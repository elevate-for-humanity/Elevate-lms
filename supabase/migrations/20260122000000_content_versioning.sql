-- Content Versioning for External Content
-- Tracks versions of partner/external content for audit and rollback

-- Add version tracking to courses table
-- SKIPPED: courses is a VIEW
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
-- SKIPPED: courses is a VIEW
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS version_notes TEXT;
-- SKIPPED: courses is a VIEW
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS previous_version_id UUID ;
-- SKIPPED: courses is a VIEW
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_current_version BOOLEAN DEFAULT true;
-- SKIPPED: courses is a VIEW
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS external_version TEXT; -- Partner's version identifier
-- SKIPPED: courses is a VIEW
-- ALTER TABLE courses ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Content version history table
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID,
  version INTEGER NOT NULL,
  version_notes TEXT,
  external_version TEXT,
  
  -- Snapshot of content at this version
  course_name TEXT NOT NULL,
  description TEXT,
  partner_url TEXT,
  duration_hours INTEGER,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Change tracking
  change_type TEXT CHECK (change_type IN ('create', 'update', 'sync', 'rollback')),
  change_summary TEXT,
  
  UNIQUE(course_id, version)
);

-- Index for fast version lookups
ALTER TABLE content_versions ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE content_versions ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE content_versions ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE content_versions ADD COLUMN IF NOT EXISTS content_data JSONB;
ALTER TABLE content_versions ADD COLUMN IF NOT EXISTS change_summary TEXT;
ALTER TABLE content_versions ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE content_versions ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;
ALTER TABLE content_versions ADD COLUMN IF NOT EXISTS course_id UUID;
CREATE INDEX IF NOT EXISTS idx_content_versions_course ON content_versions(course_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_created ON content_versions(created_at DESC);

-- Function to auto-create version history on course update
CREATE OR REPLACE FUNCTION track_content_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if meaningful fields changed
  IF (OLD.course_name IS DISTINCT FROM NEW.course_name OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.partner_url IS DISTINCT FROM NEW.partner_url OR
      OLD.duration_hours IS DISTINCT FROM NEW.duration_hours) THEN
    
    -- Increment version
    NEW.version := COALESCE(OLD.version, 0) + 1;
    
    -- Insert version history
    INSERT INTO content_versions (
      course_id,
      version,
      version_notes,
      external_version,
      course_name,
      description,
      partner_url,
      duration_hours,
      created_by,
      change_type,
      change_summary
    ) VALUES (
      NEW.id,
      NEW.version,
      NEW.version_notes,
      NEW.external_version,
      NEW.course_name,
      NEW.description,
      NEW.partner_url,
      NEW.duration_hours,
      auth.uid(),
      'update',
      'Content updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SKIPPED: courses is a VIEW, trigger not applicable
-- DROP TRIGGER IF EXISTS track_content_version_trigger ON courses;
-- CREATE TRIGGER track_content_version_trigger
--   BEFORE UPDATE ON courses
--   FOR EACH ROW
--   EXECUTE FUNCTION track_content_version();

-- RLS policies for content_versions
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Content versions viewable by authenticated users" ON content_versions;
CREATE POLICY "Content versions viewable by authenticated users"
  ON content_versions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Content versions insertable by content owners" ON content_versions;
CREATE POLICY "Content versions insertable by content owners"
  ON content_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- COMMENT ON TABLE content_versions IS 'Tracks version history for courses, especially external/partner content';
-- SKIPPED: COMMENT ON COLUMN courses.version IS 'Current version number, auto-incremented on content changes';
-- SKIPPED: COMMENT ON COLUMN courses.external_version IS 'Version identifier from external content provider';
-- SKIPPED: COMMENT ON COLUMN courses.last_synced_at IS 'Last time content was synced from external provider';
