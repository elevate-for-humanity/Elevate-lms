-- Complete Schema Verification Script
-- Run this in Supabase SQL Editor to verify all tables exist

-- ============================================================================
-- CORE TABLES CHECK
-- ============================================================================

DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  table_name TEXT;
  required_tables TEXT[] := ARRAY[
    -- Auth & Profiles
    'profiles',
    'organizations',
    'organization_members',
    
    -- Programs & Courses
    'programs',
    'courses',
    'lessons',
    'course_modules',
    'lesson_content_blocks',
    'lesson_progress',
    
    -- Enrollments
    'enrollments',
    'applications',
    'enrollment_documents',
    
    -- Quizzes
    'quizzes',
    'quiz_questions',
    'quiz_answers',
    'quiz_attempts',
    
    -- Training & Progress
    'training_hours',
    'progress',
    'credentials',
    'credential_verification',
    
    -- Employment & WIOA
    'employment_tracking',
    'funding_sources',
    'wioa_eligibility',
    
    -- Store
    'products',
    'product_categories',
    'cart_items',
    'orders',
    'order_items',
    
    -- Community
    'community_posts',
    'community_comments',
    'community_events',
    'study_groups',
    
    -- Support
    'support_tickets',
    'customer_service_tickets',
    'notifications',
    
    -- Documents
    'documents',
    'document_signatures',
    'consent_records',
    
    -- Licensing
    'licenses',
    'license_agreement_acceptances',
    'agreement_versions',
    
    -- Partners
    'partners',
    'worksite_partners',
    'apprentice_assignments',
    
    -- Tax/VITA
    'tax_filings',
    'vita_appointments',
    'tax_documents',
    
    -- Analytics
    'analytics_events',
    'audit_logs'
  ];
BEGIN
  FOREACH table_name IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE '❌ MISSING TABLES: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ All core tables exist';
  END IF;
END $$;

-- ============================================================================
-- LIST ALL EXISTING TABLES
-- ============================================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- CHECK RLS STATUS
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- CHECK FOREIGN KEY RELATIONSHIPS
-- ============================================================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- CHECK INDEXES
-- ============================================================================

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- SAMPLE DATA CHECK
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '--- DATA COUNTS ---';
  
  FOR rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', rec.table_name) INTO rec;
    -- RAISE NOTICE '%: % rows', rec.table_name, rec.count;
  END LOOP;
END $$;

-- Quick counts for key tables
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL SELECT 'programs', COUNT(*) FROM programs
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'lessons', COUNT(*) FROM lessons
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'products', COUNT(*) FROM products
ORDER BY table_name;
