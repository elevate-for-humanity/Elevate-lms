-- Add pathway_slug column to applications table
-- Tracks which pathway page the applicant came from

ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS pathway_slug TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_applications_pathway_slug ON applications(pathway_slug);
CREATE INDEX IF NOT EXISTS idx_applications_source ON applications(source);

COMMENT ON COLUMN applications.pathway_slug IS 'Slug of the pathway page the applicant came from';
COMMENT ON COLUMN applications.source IS 'Source of the application (direct, pathway, partner, etc.)';
