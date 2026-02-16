-- Migration: Funding Source Consistency + Certificate Timestamp
-- Purpose: Standardize funding_source tracking across enrollment tables for grant/license compliance
-- Date: 2026-01-14
-- Note: Only adds columns, no backfill (default handles new rows)

-- 1. Add funding_source to partner_lms_enrollments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_lms_enrollments' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_lms_enrollments' AND column_name = 'funding_source') THEN
      ALTER TABLE partner_lms_enrollments ADD COLUMN funding_source TEXT DEFAULT 'self_pay';
    END IF;
  END IF;
END $$;

-- 2. Add funding_source to hsi_enrollment_queue
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hsi_enrollment_queue' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hsi_enrollment_queue' AND column_name = 'funding_source') THEN
      ALTER TABLE hsi_enrollment_queue ADD COLUMN funding_source TEXT DEFAULT 'self_pay';
    END IF;
  END IF;
END $$;

-- 3. Add certificate_issued_at to student_enrollments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_enrollments' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_enrollments' AND column_name = 'certificate_issued_at') THEN
      ALTER TABLE student_enrollments ADD COLUMN certificate_issued_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

-- 4. Add certificate_issued_at to partner_lms_enrollments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_lms_enrollments' AND table_type = 'BASE TABLE') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_lms_enrollments' AND column_name = 'certificate_issued_at') THEN
      ALTER TABLE partner_lms_enrollments ADD COLUMN certificate_issued_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

-- 5. Create indexes (only if tables and columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partner_lms_enrollments' AND column_name = 'funding_source') THEN
    CREATE INDEX IF NOT EXISTS idx_partner_lms_enrollments_funding_source ON partner_lms_enrollments(funding_source);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_enrollments' AND column_name = 'certificate_issued_at') THEN
    CREATE INDEX IF NOT EXISTS idx_student_enrollments_certificate_issued_at ON student_enrollments(certificate_issued_at) WHERE certificate_issued_at IS NOT NULL;
  END IF;
END $$;
