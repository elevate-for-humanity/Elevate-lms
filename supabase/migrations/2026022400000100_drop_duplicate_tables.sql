-- Drop confirmed duplicate tables
-- Each pair was verified: identical schemas, identical row data (same IDs),
-- and all code references have been migrated to the canonical table.

-- 1. lessons (480 rows) — view duplicating training_lessons (480 rows, same IDs)
--    Code refs migrated: 4 files → training_lessons
DROP TABLE IF EXISTS public.lessons CASCADE;

-- 2. partner_courses (329 rows) — exact duplicate of partner_lms_courses (329 rows, same IDs)
--    Code refs migrated: 6 files → partner_lms_courses
DROP TABLE IF EXISTS public.partner_courses;

-- 3-10. Empty duplicate tables (0 rows each, identical schemas to canonical)
DROP TABLE IF EXISTS public.tax_fee_schedules;        -- dup of franchise_fee_schedules
DROP TABLE IF EXISTS public.preparer_payouts;          -- dup of franchise_preparer_payouts
DROP TABLE IF EXISTS public.ferpa_access_log;          -- dup of ferpa_access_logs (different schema, unused)
DROP TABLE IF EXISTS public.push_notifications_log;    -- dup of push_notification_send_log

-- 11. Drop unused view
DROP VIEW IF EXISTS public.sfc_tax_return_public_status_v2;

-- 12. Create missing storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('apprentice-uploads', 'apprentice-uploads', false, 10485760, ARRAY['image/jpeg','image/png','application/pdf']),
  ('course-content', 'course-content', false, 52428800, ARRAY['application/zip','text/html','application/pdf']),
  ('module-certificates', 'module-certificates', true, 5242880, ARRAY['application/pdf','image/png']),
  ('partner-documents', 'partner-documents', false, 10485760, ARRAY['application/pdf','image/jpeg','image/png']),
  ('sam-documents', 'sam-documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;
