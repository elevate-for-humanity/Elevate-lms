-- Add instructor_id column to training_courses
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES auth.users(id);

-- Recreate the courses VIEW to include instructor_id
CREATE OR REPLACE VIEW courses AS
SELECT id, course_name, course_code, description, duration_hours, price, is_active, instructor_id, created_at, updated_at
FROM training_courses;

-- Index for instructor lookups
CREATE INDEX IF NOT EXISTS idx_training_courses_instructor ON training_courses(instructor_id);
