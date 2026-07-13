-- Create apprentice competency records table for DOL Appendix A tracking
-- This table stores competency check-offs for each apprentice's DOL-required work process schedule

CREATE TABLE IF NOT EXISTS apprentice_competency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES program_enrollments(id) ON DELETE CASCADE,
  competency_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  date_completed DATE,
  verified_by UUID REFERENCES profiles(id),
  verified_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one record per enrollment per competency
  UNIQUE(enrollment_id, competency_id)
);

-- Index for fast lookups by enrollment
CREATE INDEX IF NOT EXISTS idx_competency_records_enrollment ON apprentice_competency_records(enrollment_id);

-- Index for fast lookups by verifier
CREATE INDEX IF NOT EXISTS idx_competency_records_verifier ON apprentice_competency_records(verified_by);

-- Add RLS policies
ALTER TABLE apprentice_competency_records ENABLE ROW LEVEL SECURITY;

-- Host shop mentors can view and update competencies for their apprentices
CREATE POLICY "Host shops can view competency records" ON apprentice_competency_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN organizations org ON p.organization_id = org.id
      JOIN program_enrollments pe ON pe.host_shop_id = org.id
      WHERE p.id = auth.uid() AND pe.id = enrollment_id AND p.role = 'host_shop'
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Host shops can update competency records" ON apprentice_competency_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN organizations org ON p.organization_id = org.id
      JOIN program_enrollments pe ON pe.host_shop_id = org.id
      WHERE p.id = auth.uid() AND pe.id = enrollment_id AND p.role = 'host_shop'
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Apprentices can view their own competency records
CREATE POLICY "Apprentices can view own competency records" ON apprentice_competency_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.id = enrollment_id AND pe.user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_apprentice_competency_records_updated_at
  BEFORE UPDATE ON apprentice_competency_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE apprentice_competency_records IS 'DOL Appendix A competency tracking for apprenticeship programs. Tracks which competencies apprentices have demonstrated and been verified by host shop mentors.';
COMMENT ON COLUMN apprentice_competency_records.competency_id IS 'Competency identifier matching the DOL Appendix A work process schedule codes (A, B, C, etc.)';
COMMENT ON COLUMN apprentice_competency_records.verified_by IS 'Profile ID of the host shop mentor or instructor who verified the competency';
COMMENT ON COLUMN apprentice_competency_records.date_completed IS 'Date the competency was demonstrated and verified';