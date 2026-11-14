-- Fix training_enrollments RLS policies to allow admin enrollment
-- The current policies only allow users to enroll themselves via auth flow
-- This adds policies for admins to enroll users directly

-- Allow admins to insert enrollments for any user
DROP POLICY IF EXISTS "Admins can enroll users" ON training_enrollments;
CREATE POLICY "Admins can enroll users"
  ON training_enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to update any enrollment
DROP POLICY IF EXISTS "Admins can update enrollments" ON training_enrollments;
CREATE POLICY "Admins can update enrollments"
  ON training_enrollments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to delete enrollments
DROP POLICY IF EXISTS "Admins can delete enrollments" ON training_enrollments;
CREATE POLICY "Admins can delete enrollments"
  ON training_enrollments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

SELECT 'Enrollment policies updated: Admins can now enroll users directly' AS result;
