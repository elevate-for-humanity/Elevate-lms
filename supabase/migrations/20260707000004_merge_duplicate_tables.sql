-- ============================================================================
-- MERGE DUPLICATE TABLES INTO MASTER TABLES
-- Created: July 7, 2026
-- Purpose: Consolidate duplicate tables with source/type columns
-- ============================================================================

-- ============================================================================
-- 1. DOCUMENTS - Merge into master documents table
-- ============================================================================
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'general';

INSERT INTO documents (id, user_id, title, file_url, source, created_at)
SELECT id, user_id, title, file_url, 'apprentice', created_at FROM apprentice_documents ON CONFLICT (id) DO NOTHING;
INSERT INTO documents (id, user_id, title, file_url, source, created_at)
SELECT id, user_id, title, file_url, 'employee', created_at FROM employee_documents ON CONFLICT (id) DO NOTHING;
INSERT INTO documents (id, user_id, title, file_url, source, created_at)
SELECT id, user_id, title, file_url, 'learner', created_at FROM learner_documents ON CONFLICT (id) DO NOTHING;
INSERT INTO documents (id, user_id, title, file_url, source, created_at)
SELECT id, user_id, title, file_url, 'compliance', created_at FROM compliance_documents ON CONFLICT (id) DO NOTHING;
INSERT INTO documents (id, user_id, title, file_url, source, created_at)
SELECT id, user_id, title, file_url, 'ferpa', created_at FROM ferpa_documents ON CONFLICT (id) DO NOTHING;
INSERT INTO documents (id, user_id, title, file_url, source, created_at)
SELECT id, user_id, title, file_url, 'mou', created_at FROM mou_documents ON CONFLICT (id) DO NOTHING;
INSERT INTO documents (id, user_id, title, file_url, source, created_at)
SELECT id, user_id, title, file_url, 'shared', created_at FROM shared_documents ON CONFLICT (id) DO NOTHING;
INSERT INTO documents (id, user_id, title, file_url, source, created_at)
SELECT id, user_id, title, file_url, 'ai', created_at FROM rag_documents ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. PROGRESS - Merge into master progress table
-- ============================================================================
ALTER TABLE progress ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

INSERT INTO progress (id, user_id, item_id, item_type, percentage, status, category, created_at)
SELECT id, user_id, item_id, item_type, percentage, status, 'student', created_at FROM student_progress ON CONFLICT (id) DO NOTHING;
INSERT INTO progress (id, user_id, item_id, item_type, percentage, status, category, created_at)
SELECT id, user_id, item_id, item_type, percentage, status, 'course', created_at FROM course_progress ON CONFLICT (id) DO NOTHING;
INSERT INTO progress (id, user_id, item_id, item_type, percentage, status, category, created_at)
SELECT id, user_id, item_id, item_type, percentage, status, 'module', created_at FROM module_progress ON CONFLICT (id) DO NOTHING;
INSERT INTO progress (id, user_id, item_id, item_type, percentage, status, category, created_at)
SELECT id, user_id, item_id, item_type, percentage, status, 'enrollment_module', created_at FROM enrollment_module_progress ON CONFLICT (id) DO NOTHING;
INSERT INTO progress (id, user_id, item_id, item_type, percentage, status, category, created_at)
SELECT id, user_id, item_id, item_type, percentage, status, 'training', created_at FROM training_progress ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. ENROLLMENTS - Merge into master enrollments table
-- ============================================================================
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'general';

INSERT INTO enrollments (id, user_id, program_id, status, source, created_at)
SELECT id, user_id, program_id, status, 'partner_course', created_at FROM partner_course_enrollments ON CONFLICT (id) DO NOTHING;
INSERT INTO enrollments (id, user_id, program_id, status, source, created_at)
SELECT id, user_id, program_id, status, 'external_lms', created_at FROM external_lms_enrollments ON CONFLICT (id) DO NOTHING;
INSERT INTO enrollments (id, user_id, program_id, status, source, created_at)
SELECT id, user_id, program_id, status, 'training', created_at FROM training_enrollments ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. APPLICATIONS - Merge into master applications table
-- ============================================================================
ALTER TABLE applications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

INSERT INTO applications (id, user_id, program_id, status, type, created_at)
SELECT id, user_id, program_id, status, 'student', created_at FROM student_applications ON CONFLICT (id) DO NOTHING;
INSERT INTO applications (id, user_id, program_id, status, type, created_at)
SELECT id, user_id, program_id, status, 'career', created_at FROM career_applications ON CONFLICT (id) DO NOTHING;
INSERT INTO applications (id, user_id, program_id, status, type, created_at)
SELECT id, user_id, program_id, status, 'employer', created_at FROM employer_applications ON CONFLICT (id) DO NOTHING;
INSERT INTO applications (id, user_id, program_id, status, type, created_at)
SELECT id, user_id, program_id, status, 'shop', created_at FROM shop_applications ON CONFLICT (id) DO NOTHING;
INSERT INTO applications (id, user_id, program_id, status, type, created_at)
SELECT id, user_id, program_id, status, 'staff', created_at FROM staff_applications ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. CREDENTIALS - Merge into master credentials table
-- ============================================================================
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'general';

INSERT INTO credentials (id, user_id, credential_name, status, source, created_at)
SELECT id, user_id, credential_name, status, 'student', created_at FROM student_credentials ON CONFLICT (id) DO NOTHING;
INSERT INTO credentials (id, user_id, credential_name, status, source, created_at)
SELECT id, user_id, credential_name, status, 'partner', created_at FROM partner_credentials ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. PAYMENTS - Merge into master payments table
-- ============================================================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'general';

INSERT INTO payments (id, user_id, amount, status, source, created_at)
SELECT id, user_id, amount, status, 'student', created_at FROM student_payments ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, amount, status, source, created_at)
SELECT id, user_id, amount, status, 'enrollment', created_at FROM enrollment_payments ON CONFLICT (id) DO NOTHING;
INSERT INTO payments (id, user_id, amount, status, source, created_at)
SELECT id, user_id, amount, status, 'tuition', created_at FROM tuition_payments ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. MODULES - Merge into master modules table
-- ============================================================================
ALTER TABLE modules ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'general';

INSERT INTO modules (id, program_id, module_name, source, created_at)
SELECT id, program_id, module_name, 'program', created_at FROM program_modules ON CONFLICT (id) DO NOTHING;
INSERT INTO modules (id, program_id, module_name, source, created_at)
SELECT id, program_id, module_name, 'training', created_at FROM training_modules ON CONFLICT (id) DO NOTHING;
INSERT INTO modules (id, program_id, module_name, source, created_at)
SELECT id, program_id, module_name, 'curriculum', created_at FROM program_curriculum_modules ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. REPORTS - Merge into master reports table
-- ============================================================================
ALTER TABLE reports ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

INSERT INTO reports (id, report_name, report_type, category, created_at)
SELECT id, report_name, report_type, 'shop', created_at FROM shop_reports ON CONFLICT (id) DO NOTHING;
INSERT INTO reports (id, report_name, report_type, category, created_at)
SELECT id, report_name, report_type, 'program_holder', created_at FROM program_holder_reports ON CONFLICT (id) DO NOTHING;
INSERT INTO reports (id, report_name, report_type, category, created_at)
SELECT id, report_name, report_type, 'completions', created_at FROM reporting_completions ON CONFLICT (id) DO NOTHING;
INSERT INTO reports (id, report_name, report_type, category, created_at)
SELECT id, report_name, report_type, 'enrollments', created_at FROM reporting_enrollments ON CONFLICT (id) DO NOTHING;
INSERT INTO reports (id, report_name, report_type, category, created_at)
SELECT id, report_name, report_type, 'progress', created_at FROM reporting_progress ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DELETE DUPLICATE TABLES AFTER MERGE
-- ============================================================================
DROP TABLE IF EXISTS apprentice_documents;
DROP TABLE IF EXISTS employee_documents;
DROP TABLE IF EXISTS learner_documents;
DROP TABLE IF EXISTS compliance_documents;
DROP TABLE IF EXISTS ferpa_documents;
DROP TABLE IF EXISTS mou_documents;
DROP TABLE IF EXISTS shared_documents;
DROP TABLE IF EXISTS rag_documents;
DROP TABLE IF EXISTS student_progress;
DROP TABLE IF EXISTS course_progress;
DROP TABLE IF EXISTS module_progress;
DROP TABLE IF EXISTS enrollment_module_progress;
DROP TABLE IF EXISTS training_progress;
DROP TABLE IF EXISTS partner_course_enrollments;
DROP TABLE IF EXISTS external_lms_enrollments;
DROP TABLE IF EXISTS training_enrollments;
DROP TABLE IF EXISTS student_applications;
DROP TABLE IF EXISTS career_applications;
DROP TABLE IF EXISTS employer_applications;
DROP TABLE IF EXISTS shop_applications;
DROP TABLE IF EXISTS staff_applications;
DROP TABLE IF EXISTS student_credentials;
DROP TABLE IF EXISTS partner_credentials;
DROP TABLE IF EXISTS student_payments;
DROP TABLE IF EXISTS enrollment_payments;
DROP TABLE IF EXISTS tuition_payments;
DROP TABLE IF EXISTS program_modules;
DROP TABLE IF EXISTS training_modules;
DROP TABLE IF EXISTS program_curriculum_modules;
DROP TABLE IF EXISTS shop_reports;
DROP TABLE IF EXISTS program_holder_reports;
DROP TABLE IF EXISTS reporting_completions;
DROP TABLE IF EXISTS reporting_enrollments;
DROP TABLE IF EXISTS reporting_progress;
