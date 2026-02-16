-- Fix Duplicate Policy Names
-- This migration renames duplicate policies to be unique per table
-- Run after all other migrations to ensure clean policy state

-- ============================================================================
-- STEP 1: Drop all duplicate policies
-- ============================================================================

-- Drop duplicate "Admins can manage courses" policies
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON drake_lessons;

-- Drop duplicate "Admins can manage credentials" policies
DROP POLICY IF EXISTS "Admins can manage credentials" ON credentials;
DROP POLICY IF EXISTS "Admins can manage credentials" ON credential_verification;

-- Drop duplicate "Admins can update documents" policies
DROP POLICY IF EXISTS "Admins can update documents" ON documents;
DROP POLICY IF EXISTS "Admins can update documents" ON tax_documents;

-- Drop duplicate "Admins can view all documents" policies
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON tax_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;

-- Drop duplicate "Authenticated users can view documents" policies
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON tax_documents;

-- Drop duplicate "Users can update own progress" policies
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON drake_progress;

-- Drop duplicate "Users can upload own documents" policies
DROP POLICY IF EXISTS "Users can upload own documents" ON documents;
DROP POLICY IF EXISTS "Users can upload own documents" ON tax_documents;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;

-- Drop duplicate "Users can view own applications" policies
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can view own applications" ON job_applications;

-- Drop duplicate "Users can view own documents" policies
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can view own documents" ON tax_documents;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;

-- Drop duplicate "Users can view own enrollments" policies
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON drake_enrollments;

-- Drop duplicate "Users can view own progress" policies
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view own progress" ON drake_progress;

-- ============================================================================
-- STEP 2: Recreate policies with unique names
-- ============================================================================

-- Courses table policies
CREATE POLICY "admins_manage_courses" ON courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Drake lessons table policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'drake_lessons') THEN
    EXECUTE 'CREATE POLICY "admins_manage_drake_lessons" ON drake_lessons
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN (''admin'', ''super_admin'')
        )
      )';
  END IF;
END $$;

-- Credentials table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'credentials') THEN
    EXECUTE 'CREATE POLICY "admins_manage_credentials" ON credentials
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN (''admin'', ''super_admin'')
        )
      )';
  END IF;
END $$;

-- Credential verification table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'credential_verification') THEN
    EXECUTE 'CREATE POLICY "admins_manage_credential_verification" ON credential_verification
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN (''admin'', ''super_admin'')
        )
      )';
  END IF;
END $$;

-- Documents table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'documents') THEN
    EXECUTE 'CREATE POLICY "users_view_own_documents" ON documents
      FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "users_upload_documents" ON documents
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "admins_manage_documents" ON documents
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN (''admin'', ''super_admin'')
        )
      )';
  END IF;
END $$;

-- Tax documents table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tax_documents') THEN
    EXECUTE 'CREATE POLICY "users_view_own_tax_documents" ON tax_documents
      FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "users_upload_tax_documents" ON tax_documents
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "admins_manage_tax_documents" ON tax_documents
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN (''admin'', ''super_admin'')
        )
      )';
  END IF;
END $$;

-- Storage objects policies
CREATE POLICY "users_view_own_storage_objects" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_upload_storage_objects" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "admins_manage_storage_objects" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- User progress table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_progress') THEN
    EXECUTE 'CREATE POLICY "users_view_own_user_progress" ON user_progress
      FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "users_update_own_user_progress" ON user_progress
      FOR UPDATE
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Drake progress table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'drake_progress') THEN
    EXECUTE 'CREATE POLICY "users_view_own_drake_progress" ON drake_progress
      FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "users_update_own_drake_progress" ON drake_progress
      FOR UPDATE
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Applications table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'applications') THEN
    EXECUTE 'CREATE POLICY "users_view_own_applications" ON applications
      FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "users_create_applications" ON applications
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- Job applications table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'job_applications') THEN
    EXECUTE 'CREATE POLICY "users_view_own_job_applications" ON job_applications
      FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "users_create_job_applications" ON job_applications
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- Enrollments table policies
CREATE POLICY "users_view_own_enrollments" ON enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_create_enrollments" ON enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Drake enrollments table policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'drake_enrollments') THEN
    EXECUTE 'CREATE POLICY "users_view_own_drake_enrollments" ON drake_enrollments
      FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "users_create_drake_enrollments" ON drake_enrollments
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add comment
COMMENT ON POLICY "admins_manage_courses" ON courses IS 
  'Renamed from "Admins can manage courses" to avoid duplicates';

COMMENT ON POLICY "users_view_own_enrollments" ON enrollments IS 
  'Renamed from "Users can view own enrollments" to avoid duplicates';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Duplicate policy names fixed successfully';
END $$;
