-- student_enrollments: Add missing indexes and constraints
-- Addresses P0 findings from architecture report

-- Indexes for query performance (33 code references query this table)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student 
  ON student_enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_program 
  ON student_enrollments(program_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_status 
  ON student_enrollments(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_enrollments_stripe_session 
  ON student_enrollments(stripe_checkout_session_id) 
  WHERE stripe_checkout_session_id IS NOT NULL;

-- FK constraint: student_id must reference a real user
-- Using DO block to avoid error if constraint already exists
DO $$ BEGIN
  ALTER TABLE student_enrollments 
    ADD CONSTRAINT fk_student_enrollments_student 
    FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Status constraint: prevent invalid status values
DO $$ BEGIN
  ALTER TABLE student_enrollments 
    ADD CONSTRAINT chk_student_enrollments_status 
    CHECK (status IN ('active', 'completed', 'expired', 'suspended', 'pending', 'withdrawn', 'enrolled_pending_approval'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- enrollments table: add status constraint
DO $$ BEGIN
  ALTER TABLE enrollments 
    ADD CONSTRAINT chk_enrollments_status 
    CHECK (status IN ('active', 'completed', 'expired', 'refunded', 'suspended', 'pending', 'dropped'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
