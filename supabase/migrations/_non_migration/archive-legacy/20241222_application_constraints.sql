-- Application Constraints & Duplicate Prevention
-- Prevents users from submitting multiple applications for the same program

-- Add user_id column (nullable for anonymous submissions)
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add advisor_id for assignment
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS advisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add eligibility_status
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS eligibility_status TEXT DEFAULT 'pending'
  CHECK (eligibility_status IN ('pending', 'eligible', 'ineligible', 'review_needed'));

-- Add application_type to distinguish inquiry from full application
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS application_type TEXT DEFAULT 'inquiry'
  CHECK (application_type IN ('inquiry', 'full_application'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_advisor_id ON applications(advisor_id);
CREATE INDEX IF NOT EXISTS idx_applications_eligibility_status ON applications(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(application_type);

-- Add unique constraint for authenticated users
-- Prevents duplicate applications for same program (unless rejected)
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique_user_program
  ON applications (user_id, program_id)
  WHERE user_id IS NOT NULL AND status NOT IN ('rejected', 'withdrawn');

-- Add unique constraint for anonymous submissions (email + program)
-- Prevents duplicate applications from same email (unless rejected)
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique_email_program
  ON applications (LOWER(email), program_id)
  WHERE user_id IS NULL AND status NOT IN ('rejected', 'withdrawn');

-- Update RLS policies to include user_id
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own draft applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Add comment
COMMENT ON COLUMN applications.user_id IS 'User who submitted the application (NULL for anonymous)';
COMMENT ON COLUMN applications.advisor_id IS 'Advisor assigned to review this application';
COMMENT ON COLUMN applications.eligibility_status IS 'Eligibility determination status';
COMMENT ON COLUMN applications.application_type IS 'Type of application: inquiry (lightweight) or full_application (detailed)';
