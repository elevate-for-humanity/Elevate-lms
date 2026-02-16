-- Simple migration: Just add the missing columns
-- Run this first, then we'll add data separately

-- Add columns to courses table one by one
ALTER TABLE courses ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS etpl_program_id TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS etpl_approved BOOLEAN DEFAULT false;

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  duration_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create external_lms_enrollments table
CREATE TABLE IF NOT EXISTS external_lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_code TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ojt_logs table
CREATE TABLE IF NOT EXISTS ojt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_code TEXT NOT NULL,
  date DATE NOT NULL,
  hours NUMERIC(5,2) NOT NULL,
  description TEXT,
  supervisor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
