-- Student Onboarding Tracker
-- Tracks 4-step onboarding for WIOA/RAPIDS compliance

CREATE TABLE IF NOT EXISTS student_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  handbook_reviewed BOOLEAN DEFAULT false,
  milady_orientation_completed BOOLEAN DEFAULT false,
  ai_instructor_met BOOLEAN DEFAULT false,
  shop_placed BOOLEAN DEFAULT false,
  handbook_reviewed_at TIMESTAMPTZ,
  milady_orientation_completed_at TIMESTAMPTZ,
  ai_instructor_met_at TIMESTAMPTZ,
  shop_placed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

-- Index for student lookups
CREATE INDEX IF NOT EXISTS idx_student_onboarding_student_id ON student_onboarding(student_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Set completion timestamps
  IF NEW.handbook_reviewed = true AND OLD.handbook_reviewed = false THEN
    NEW.handbook_reviewed_at = now();
  END IF;
  
  IF NEW.milady_orientation_completed = true AND OLD.milady_orientation_completed = false THEN
    NEW.milady_orientation_completed_at = now();
  END IF;
  
  IF NEW.ai_instructor_met = true AND OLD.ai_instructor_met = false THEN
    NEW.ai_instructor_met_at = now();
  END IF;
  
  IF NEW.shop_placed = true AND OLD.shop_placed = false THEN
    NEW.shop_placed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_onboarding_updated_at
  BEFORE UPDATE ON student_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_student_onboarding_updated_at();

-- Comments for audit trail
COMMENT ON TABLE student_onboarding IS 'Tracks 4-step onboarding for WIOA/RAPIDS compliance';
COMMENT ON COLUMN student_onboarding.handbook_reviewed IS 'Student reviewed and acknowledged handbook';
COMMENT ON COLUMN student_onboarding.milady_orientation_completed IS 'Student completed Milady RISE orientation';
COMMENT ON COLUMN student_onboarding.ai_instructor_met IS 'Student had first interaction with AI instructor';
COMMENT ON COLUMN student_onboarding.shop_placed IS 'Student assigned to employer/shop for OJT';
