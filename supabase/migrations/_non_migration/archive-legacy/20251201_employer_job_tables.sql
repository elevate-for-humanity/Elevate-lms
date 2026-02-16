-- Create job_postings table for employer dashboard
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  salary_range TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  requirements TEXT,
  benefits TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  cover_letter TEXT,
  resume_url TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(job_posting_id, user_id)
);

-- Create assignment_submissions table for student assignments
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_url TEXT,
  submission_text TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
  grade NUMERIC(5,2),
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_postings_employer ON job_postings(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user ON assignment_submissions(user_id);

-- Enable RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_postings
CREATE POLICY "Employers can view their own job postings"
  ON job_postings FOR SELECT
  USING (auth.uid() = employer_id);

CREATE POLICY "Employers can create job postings"
  ON job_postings FOR INSERT
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own job postings"
  ON job_postings FOR UPDATE
  USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete their own job postings"
  ON job_postings FOR DELETE
  USING (auth.uid() = employer_id);

CREATE POLICY "Anyone can view active job postings"
  ON job_postings FOR SELECT
  USING (status = 'active');

-- RLS Policies for job_applications
CREATE POLICY "Users can view their own applications"
  ON job_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Employers can view applications for their jobs"
  ON job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_posting_id
      AND job_postings.employer_id = auth.uid()
    )
  );

CREATE POLICY "Users can create applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON job_applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Employers can update applications for their jobs"
  ON job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_posting_id
      AND job_postings.employer_id = auth.uid()
    )
  );

-- RLS Policies for assignment_submissions
CREATE POLICY "Students can view their own submissions"
  ON assignment_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view all submissions"
  ON assignment_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('instructor', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Students can create submissions"
  ON assignment_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own submissions"
  ON assignment_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Instructors can update submissions for grading"
  ON assignment_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('instructor', 'admin', 'super_admin')
    )
  );
