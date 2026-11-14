-- PENDING MIGRATIONS 2026-06-24
-- 20240615000001_create_apprentice_competency_records.sql
-- Create apprentice competency records table for DOL Appendix A tracking
-- This table stores competency check-offs for each apprentice's DOL-required work process schedule

CREATE TABLE IF NOT EXISTS apprentice_competency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES program_enrollments(id) ON DELETE CASCADE,
  competency_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  date_completed DATE,
  verified_by UUID REFERENCES profiles(id),
  verified_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one record per enrollment per competency
  UNIQUE(enrollment_id, competency_id)
);

-- Index for fast lookups by enrollment
CREATE INDEX IF NOT EXISTS idx_competency_records_enrollment ON apprentice_competency_records(enrollment_id);

-- Index for fast lookups by verifier
CREATE INDEX IF NOT EXISTS idx_competency_records_verifier ON apprentice_competency_records(verified_by);

-- Add RLS policies
ALTER TABLE apprentice_competency_records ENABLE ROW LEVEL SECURITY;

-- Host shop mentors can view and update competencies for their apprentices
CREATE POLICY "Host shops can view competency records" ON apprentice_competency_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN organizations org ON p.organization_id = org.id
      JOIN program_enrollments pe ON pe.host_shop_id = org.id
      WHERE p.id = auth.uid() AND pe.id = enrollment_id AND p.role = 'host_shop'
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Host shops can update competency records" ON apprentice_competency_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN organizations org ON p.organization_id = org.id
      JOIN program_enrollments pe ON pe.host_shop_id = org.id
      WHERE p.id = auth.uid() AND pe.id = enrollment_id AND p.role = 'host_shop'
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Apprentices can view their own competency records
CREATE POLICY "Apprentices can view own competency records" ON apprentice_competency_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_enrollments pe
      WHERE pe.id = enrollment_id AND pe.user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_apprentice_competency_records_updated_at
  BEFORE UPDATE ON apprentice_competency_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE apprentice_competency_records IS 'DOL Appendix A competency tracking for apprenticeship programs. Tracks which competencies apprentices have demonstrated and been verified by host shop mentors.';
COMMENT ON COLUMN apprentice_competency_records.competency_id IS 'Competency identifier matching the DOL Appendix A work process schedule codes (A, B, C, etc.)';
COMMENT ON COLUMN apprentice_competency_records.verified_by IS 'Profile ID of the host shop mentor or instructor who verified the competency';
COMMENT ON COLUMN apprentice_competency_records.date_completed IS 'Date the competency was demonstrated and verified';
-- 20240615000003_create_ai_tasks.sql
-- Create ai_tasks table for Open Studio workflows
-- Stores automated task execution pipelines

CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  task_type TEXT DEFAULT 'general',
  agent_config JSONB DEFAULT '{}',
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user ON ai_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_created ON ai_tasks(created_at DESC);

-- RLS
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;

-- Admins can see all tasks, users can only see their own
CREATE POLICY "Admins can view all tasks" ON ai_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can insert tasks" ON ai_tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can update tasks" ON ai_tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can delete tasks" ON ai_tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_tasks_updated_at
  BEFORE UPDATE ON ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_tasks_updated_at();

COMMENT ON TABLE ai_tasks IS 'AI task execution pipelines for Open Studio - tracks workflow status, results, and agent configurations';
-- 20250630000002_backfill_all_program_relations.sql
-- Backfill program_media, program_ctas, program_tracks, program_modules for ALL published programs
-- Run this migration once to seed all program relations
-- Safe to re-run (uses ON CONFLICT DO NOTHING)

DO $$
DECLARE
  prog RECORD;
  media_count INT;
  cta_count INT;
  track_count INT;
  module_count INT;
BEGIN
  
  RAISE NOTICE 'Starting program relations backfill...';

  -- Iterate through all published programs
  FOR prog IN SELECT id, slug, title FROM public.programs WHERE published = true AND is_active = true LOOP
  
    -- ── 1. program_media ───────────────────────────────────────────────────────
    -- Check if media already exists
    SELECT COUNT(*) INTO media_count FROM public.program_media WHERE program_id = prog.id;
    
    IF media_count = 0 THEN
      INSERT INTO public.program_media (program_id, media_type, url, alt_text, sort_order)
      VALUES
        (prog.id, 'hero_image', '/images/pages/' || prog.slug || '-hero.jpg', prog.title || ' program hero image', 1),
        (prog.id, 'thumbnail', '/images/pages/' || prog.slug || '-thumb.jpg', prog.title || ' thumbnail', 2)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE '  Inserted program_media for: %', prog.slug;
    END IF;

    -- ── 2. program_ctas ────────────────────────────────────────────────────────
    SELECT COUNT(*) INTO cta_count FROM public.program_ctas WHERE program_id = prog.id;
    
    IF cta_count = 0 THEN
      INSERT INTO public.program_ctas (program_id, cta_type, label, href, style_variant, is_external, sort_order)
      VALUES
        (prog.id, 'apply', 'Apply Now', '/programs/' || prog.slug || '/apply', 'primary', FALSE, 1),
        (prog.id, 'request_info', 'Check My Eligibility', '/contact?program=' || prog.slug, 'secondary', FALSE, 2),
        (prog.id, 'waitlist', 'Join Waitlist', '/programs/' || prog.slug || '/waitlist', 'ghost', FALSE, 3)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE '  Inserted program_ctas for: %', prog.slug;
    END IF;

    -- ── 3. program_tracks ──────────────────────────────────────────────────────
    SELECT COUNT(*) INTO track_count FROM public.program_tracks WHERE program_id = prog.id;
    
    IF track_count = 0 THEN
      INSERT INTO public.program_tracks (program_id, track_code, title, description, funding_type, cost_cents, available, sort_order)
      VALUES
        (prog.id, 'WIOA', 'WIOA Funded', 'Indiana Workforce Innovation and Opportunity Act funding available for eligible residents.', 'funded', NULL, TRUE, 1),
        (prog.id, 'SELF_PAY', 'Self-Pay', 'Pay out-of-pocket with payment plan options available.', 'self_pay', 250000, TRUE, 2),
        (prog.id, 'EMPLOYER', 'Employer Sponsored', 'Your employer covers tuition and materials.', 'employer_sponsored', NULL, TRUE, 3)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE '  Inserted program_tracks for: %', prog.slug;
    END IF;

    -- ── 4. program_modules ─────────────────────────────────────────────────────
    SELECT COUNT(*) INTO module_count FROM public.program_modules WHERE program_id = prog.id;
    
    IF module_count = 0 THEN
      -- Insert 5 default modules for all programs
      INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
      VALUES
        (prog.id, 1, 'Foundation & Orientation', 'Program introduction, expectations, and foundational knowledge.', 5, 4, 1),
        (prog.id, 2, 'Core Skills Development', 'Primary technical skills and hands-on practice.', 8, 6, 2),
        (prog.id, 3, 'Certification Preparation', 'Exam prep and credentialing requirements.', 6, 5, 3),
        (prog.id, 4, 'Clinical/Practical Application', 'Real-world application and supervised practice.', 8, 7, 4),
        (prog.id, 5, 'Career Readiness', 'Job placement support, resume building, and employer connections.', 4, 3, 5)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE '  Inserted program_modules for: %', prog.slug;
    END IF;

  END LOOP;

  RAISE NOTICE 'Program relations backfill complete!';

END $$;

-- Verify counts
SELECT 
  'program_media' as table_name, COUNT(*) as row_count FROM public.program_media
UNION ALL
SELECT 
  'program_ctas', COUNT(*) FROM public.program_ctas
UNION ALL
SELECT 
  'program_tracks', COUNT(*) FROM public.program_tracks
UNION ALL
SELECT 
  'program_modules', COUNT(*) FROM public.program_modules;

-- 20260612000001_rename_superuser_to_admin.sql
-- Remove 'superuser' value if it exists in profiles.role enum
-- 'super_admin' is kept; 'superuser' is a typo that should not exist
-- Also update any existing profiles with 'superuser' role to 'super_admin'

BEGIN;

-- Update profiles with 'superuser' role to 'super_admin'
UPDATE profiles SET role = 'super_admin' WHERE role = 'superuser';

DO $$
BEGIN
  -- Try to drop superuser value if it exists
  EXECUTE format('ALTER TYPE user_role_enum DROP VALUE IF EXISTS ''superuser''');
EXCEPTION WHEN OTHERS THEN
  -- Value doesn't exist or can't be dropped - that's fine
  RAISE NOTICE 'Could not drop superuser value: %', SQLERRM;
END
$$;

COMMIT;

-- 20260616000002_phlebotomy_stripe_connect.sql
-- Phlebotomy Stripe Connect Tables

-- Student enrollments for course purchases
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID,
  student_email TEXT,
  course_slug TEXT NOT NULL,
  payment_provider TEXT DEFAULT 'stripe',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'active',
  access_granted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor payout tasks for manual payouts
CREATE TABLE IF NOT EXISTS public.vendor_payout_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT,
  student_id UUID,
  course_slug TEXT,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor accounts
CREATE TABLE IF NOT EXISTS public.vendor_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  vendor_email TEXT,
  stripe_connected_account_id TEXT,
  payout_method TEXT DEFAULT 'manual' CHECK (payout_method IN ('manual', 'stripe_connect')),
  bank_account_last4 TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course vendor links
CREATE TABLE IF NOT EXISTS public.course_vendor_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendor_accounts(id),
  vendor_cost_cents INTEGER NOT NULL,
  retail_price_cents INTEGER NOT NULL,
  payout_mode TEXT DEFAULT 'manual' CHECK (payout_mode IN ('manual', 'stripe_connect')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_slug)
);

-- Stripe webhook events (for idempotency)
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID,
  student_email TEXT,
  course_slug TEXT,
  total_cents INTEGER,
  status TEXT DEFAULT 'pending',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payout_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_vendor_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin only)
CREATE POLICY "Admin full access to student_enrollments" ON public.student_enrollments
  FOR ALL USING (true);

CREATE POLICY "Admin full access to vendor_payout_tasks" ON public.vendor_payout_tasks
  FOR ALL USING (true);

CREATE POLICY "Admin full access to vendor_accounts" ON public.vendor_accounts
  FOR ALL USING (true);

CREATE POLICY "Admin full access to course_vendor_links" ON public.course_vendor_links
  FOR ALL USING (true);

CREATE POLICY "Admin full access to stripe_webhook_events" ON public.stripe_webhook_events
  FOR ALL USING (true);

CREATE POLICY "Admin full access to orders" ON public.orders
  FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_course_slug ON public.student_enrollments(course_slug);
CREATE INDEX IF NOT EXISTS idx_vendor_payout_tasks_vendor_id ON public.vendor_payout_tasks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payout_tasks_status ON public.vendor_payout_tasks(status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON public.orders(student_id);

-- Insert phlebotomy vendor (manual payout for now)
INSERT INTO public.vendor_accounts (id, vendor_name, vendor_email, payout_method)
VALUES ('00000000-0000-0000-0000-000000000001', 'Phlebotomy Course Vendor', 'vendor@example.com', 'manual')
ON CONFLICT DO NOTHING;

-- Link phlebotomy course to vendor
INSERT INTO public.course_vendor_links (course_slug, vendor_id, vendor_cost_cents, retail_price_cents, payout_mode)
VALUES ('phlebotomy-online', '00000000-0000-0000-0000-000000000001', 21300, 149900, 'manual')
ON CONFLICT (course_slug) DO NOTHING;

-- 20260616000004_storage_buckets.sql
-- Course Asset Storage Buckets Migration
-- Configure Supabase Storage for all course media and documents

-- Create storage buckets (run in Supabase dashboard or via API)

-- Bucket 1: Course assets (images, videos, downloads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('course-assets', 'course-assets', false, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'application/zip'])
ON CONFLICT DO NOTHING;

-- Bucket 2: Student submissions (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('student-submissions', 'student-submissions', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/zip'])
ON CONFLICT DO NOTHING;

-- Bucket 3: Certificates (public templates)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('certificates', 'certificates', true, 2097152, ARRAY['image/png', 'image/svg+xml', 'application/pdf'])
ON CONFLICT DO NOTHING;

-- Bucket 4: Vendor assets (NHA, Certiport, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('vendor-assets', 'vendor-assets', false, 104857600, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT DO NOTHING;

-- Bucket 5: Public marketing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('marketing', 'marketing', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT DO NOTHING;

-- RLS Policies for course-assets bucket
CREATE POLICY "Authenticated users can view course assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload course assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'course-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can update course assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'course-assets' AND auth.role() = 'authenticated');

-- RLS Policies for student-submissions bucket
CREATE POLICY "Users can view own submissions" ON storage.objects
  FOR SELECT USING (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own submissions" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS Policies for certificates bucket
CREATE POLICY "Anyone can view certificates" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificates');

CREATE POLICY "Admins can manage certificates" ON storage.objects
  FOR ALL USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');

-- RLS Policies for vendor-assets bucket
CREATE POLICY "Authenticated users can view vendor assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'vendor-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can manage vendor assets" ON storage.objects
  FOR ALL USING (bucket_id = 'vendor-assets' AND auth.role() = 'authenticated');

-- RLS Policies for marketing bucket (public)
CREATE POLICY "Anyone can view marketing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketing');

CREATE POLICY "Admins can upload marketing images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'marketing' AND auth.role() = 'authenticated');

-- Storage folder structure helper function
CREATE OR REPLACE FUNCTION storage.get_course_asset_path(
  course_slug TEXT,
  asset_type TEXT, -- 'hero', 'images', 'videos', 'downloads', 'worksheets', 'quizzes', 'certificates'
  filename TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN course_slug || '/' || asset_type || '/' || filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public function to get course asset URL
CREATE OR REPLACE FUNCTION storage.get_signed_course_url(
  p_course_slug TEXT,
  p_asset_type TEXT,
  p_filename TEXT,
  p_expires_in INT DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
  v_path TEXT;
  v_url TEXT;
BEGIN
  v_path := p_course_slug || '/' || p_asset_type || '/' || p_filename;
  
  SELECT signed_url INTO v_url
  FROM supabase.storage.from('course-assets').createSignedUrl(v_path, p_expires_in);
  
  RETURN v_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 20260623000001_fix_products_permissions.sql
-- Fix products table permissions for public reads
-- Addresses: permission denied for table products

-- Enable RLS on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access to active products
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" ON public.products
  FOR SELECT
  USING (is_active = true);

-- Policy for authenticated users to read all products
DROP POLICY IF EXISTS "Authenticated read all products" ON public.products;
CREATE POLICY "Authenticated read all products" ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for service role to have full access
DROP POLICY IF EXISTS "Service role full access" ON public.products;
CREATE POLICY "Service role full access" ON public.products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- 20260623000002_make_applications_phone_nullable.sql
-- Make phone nullable in applications table
-- Addresses: null value in column "phone" violates not-null constraint

-- Make phone nullable to allow intake form submissions without phone
ALTER TABLE public.applications ALTER COLUMN phone DROP NOT NULL;

-- Set default to empty string for existing records
UPDATE public.applications SET phone = '' WHERE phone IS NULL;

-- 20260629000011_seed_barber_cosmetology_courses.sql
-- Seed comprehensive courses for beauty apprenticeships
-- Indiana State Board aligned curriculum
-- These courses will be visible in the LMS and Host Shop Admin

-- Barber Apprenticeship Course
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'barber-apprenticeship-course',
  'Barber Apprenticeship - Complete Course',
  '2,000-hour DOL registered apprenticeship program',
  'Indiana Barber Apprenticeship covering hair cutting, shaving, chemical services, and state board exam prep. Compliant with DOL registered apprenticeship requirements including 1,500 OJT hours and 500 RTI hours.',
  'published',
  true,
  'Barber Apprenticeship',
  2000,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'barber-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'barber-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Cosmetology Apprenticeship Course
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'cosmetology-apprenticeship-course',
  'Cosmetology Apprenticeship - Complete Course',
  '2,000-hour Indiana cosmetology license apprenticeship',
  'Indiana Cosmetology Apprenticeship covering hair, skin, nails, and makeup services. Prepares for Indiana cosmetology license exam with comprehensive theory and practical training.',
  'published',
  true,
  'Cosmetology',
  2000,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'cosmetology-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'cosmetology-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Esthetician Apprenticeship Course
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'esthetician-apprenticeship-course',
  'Esthetician Apprenticeship - Complete Course',
  '700-hour Indiana esthetician license apprenticeship',
  'Indiana Esthetician Apprenticeship covering advanced skin care, facials, hair removal, and makeup. Prepares for Indiana esthetician license exam.',
  'published',
  true,
  'Esthetician',
  700,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'esthetician-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'esthetician-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Nail Technician Apprenticeship Course
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'nail-technician-apprenticeship-course',
  'Nail Technician Apprenticeship - Complete Course',
  '400-hour Indiana nail technician license apprenticeship',
  'Indiana Nail Technician Apprenticeship covering manicures, pedicures, nail enhancements, and nail art. Prepares for Indiana nail technician license exam.',
  'published',
  true,
  'Nail Technology',
  400,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'nail-technician-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'nail-technician-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Verify courses
SELECT slug, title, category, duration_hours, is_active 
FROM public.courses 
WHERE slug LIKE '%apprenticeship-course'
ORDER BY category;

-- 20260708000004_platform_owner_tenant_model.sql
-- Platform owner tenant model + customer workspace provisioning foundation
-- See docs/platform-owner-tenant-model.md

BEGIN;

-- ── 1. Tenant classification ───────────────────────────────────────────────

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_platform_owner BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_is_platform_owner
  ON public.tenants(is_platform_owner)
  WHERE is_platform_owner = true;

CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant_id
  ON public.tenants(parent_tenant_id)
  WHERE parent_tenant_id IS NOT NULL;

-- Extend type enum: customer = Dev Cloud provisioned tenant
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_type_check;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_type_check
  CHECK (type IN ('elevate', 'partner_provider', 'employer', 'workforce_agency', 'customer'));

-- Exactly one platform owner tenant (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS tenants_single_platform_owner_idx
  ON public.tenants ((true))
  WHERE is_platform_owner = true;

-- ── 2. Backfill platform owner tenant ────────────────────────────────────────

DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT id INTO v_owner_id
  FROM public.tenants
  WHERE is_platform_owner = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id
    FROM public.tenants
    WHERE type = 'elevate'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id
    FROM public.tenants
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_owner_id IS NOT NULL THEN
    UPDATE public.tenants
    SET is_platform_owner = true,
        type = CASE WHEN type IS NULL OR type = '' THEN 'elevate' ELSE type END
    WHERE id = v_owner_id;

    -- Platform staff without tenant_id → attach to owner tenant
    UPDATE public.profiles
    SET tenant_id = v_owner_id,
        updated_at = now()
    WHERE tenant_id IS NULL
      AND role IN ('super_admin', 'admin', 'staff');

    INSERT INTO public.platform_settings (key, value, updated_at)
    VALUES (
      'PLATFORM_OWNER_TENANT_ID',
      v_owner_id::text,
      now()
    )
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = now();
  END IF;
END $$;

-- ── 3. Customer workspaces (Dev Cloud provisioning) ──────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'builder'
    CHECK (subscription_tier IN ('builder', 'pro', 'agency')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'provisioning', 'active', 'suspended', 'failed', 'archived')),
  template_slug TEXT NOT NULL DEFAULT 'workforce-platform-v1',
  github_repo_url TEXT,
  northflank_project_id TEXT,
  northflank_service_id TEXT,
  supabase_project_ref TEXT,
  workspace_url TEXT,
  provision_error TEXT,
  provisioned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provisioned_at TIMESTAMPTZ,
  CONSTRAINT customer_workspaces_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS customer_workspaces_tenant_id_idx
  ON public.customer_workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS customer_workspaces_status_idx
  ON public.customer_workspaces(status);

ALTER TABLE public.customer_workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_workspaces_platform_staff" ON public.customer_workspaces;
CREATE POLICY "customer_workspaces_platform_staff" ON public.customer_workspaces
  FOR ALL
  USING (public.is_platform_owner_user())
  WITH CHECK (public.is_platform_owner_user());

DROP POLICY IF EXISTS "customer_workspaces_service_role" ON public.customer_workspaces;
CREATE POLICY "customer_workspaces_service_role" ON public.customer_workspaces
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

GRANT SELECT ON public.customer_workspaces TO authenticated;
GRANT ALL ON public.customer_workspaces TO service_role;

-- ── 4. SQL helpers ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_platform_owner_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT id
  FROM public.tenants
  WHERE is_platform_owner = true
  ORDER BY created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_owner_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id AND is_platform_owner = true
  );
$$;

-- Platform staff: admin / super_admin / staff on the platform owner tenant
CREATE OR REPLACE FUNCTION public.is_platform_owner_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.tenants t ON t.id = p.tenant_id
    WHERE p.id = auth.uid()
      AND t.is_platform_owner = true
      AND p.role IN ('super_admin', 'admin', 'staff')
  );
$$;

-- Platform operator: super_admin on platform owner tenant (DevStudio, deploy)
CREATE OR REPLACE FUNCTION public.is_platform_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.tenants t ON t.id = p.tenant_id
    WHERE p.id = auth.uid()
      AND t.is_platform_owner = true
      AND p.role = 'super_admin'
  );
$$;

-- Narrow is_platform_admin to platform owner tenant (break-glass: service_role unchanged)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT public.is_platform_owner_user();
$$;

COMMENT ON FUNCTION public.get_platform_owner_tenant_id IS
  'Returns the single platform owner tenant UUID (Elevate operator).';
COMMENT ON FUNCTION public.is_platform_owner_user IS
  'True when the session user is platform staff (super_admin/admin/staff) on the owner tenant.';
COMMENT ON FUNCTION public.is_platform_operator IS
  'True when the session user is platform owner (super_admin on owner tenant). DevStudio/deploy.';

-- ── 5. Provisioning job type for workspace_provision ───────────────────────

-- provisioning_jobs.job_type is TEXT; no enum alteration required.
-- Application enqueues job_type = 'workspace_provision' (see lib/jobs/queue.ts).

COMMIT;

-- 20260708000005_dev_studio_full_os.sql
-- Elevate AI Dev Studio — autonomous operating system tables
-- Idempotent. Apply manually in Supabase Dashboard SQL Editor.

-- ─── ai_agents ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  capabilities  JSONB NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'busy', 'offline', 'error')),
  model_hint    TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ai_tasks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN (
      'queued', 'planning', 'running', 'awaiting_approval',
      'completed', 'failed', 'cancelled', 'rolled_back'
    )),
  priority        INTEGER NOT NULL DEFAULT 0,
  agent_id        UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  requested_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trace_id        TEXT,
  plan_json       JSONB NOT NULL DEFAULT '{}'::jsonb,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approval_reason TEXT,
  risk_tags       TEXT[] NOT NULL DEFAULT '{}',
  result_json     JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON public.ai_tasks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_agent ON public.ai_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_trace ON public.ai_tasks(trace_id) WHERE trace_id IS NOT NULL;

-- ─── ai_task_steps ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_task_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
  step_order    INTEGER NOT NULL DEFAULT 0,
  name          TEXT NOT NULL,
  action_type   TEXT NOT NULL DEFAULT 'execute',
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'awaiting_approval')),
  input_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_task_steps_task ON public.ai_task_steps(task_id, step_order);

-- ─── ai_task_logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_task_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
  step_id     UUID REFERENCES public.ai_task_steps(id) ON DELETE SET NULL,
  level       TEXT NOT NULL DEFAULT 'info'
    CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message     TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_task_logs_task ON public.ai_task_logs(task_id, created_at DESC);

-- ─── ai_memory ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope         TEXT NOT NULL DEFAULT 'platform'
    CHECK (scope IN ('platform', 'agent', 'task', 'repo')),
  agent_id      UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  task_id       UUID REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
  key           TEXT NOT NULL,
  content       TEXT NOT NULL,
  embedding_ref TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_memory_scope_key
  ON public.ai_memory(scope, key, COALESCE(agent_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ─── ai_code_patterns ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_code_patterns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'general',
  pattern_md    TEXT NOT NULL,
  example_paths TEXT[] NOT NULL DEFAULT '{}',
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ai_repo_index ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_repo_index (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_path     TEXT NOT NULL,
  file_hash     TEXT,
  language      TEXT,
  symbols       JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_indexed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_repo_index_path ON public.ai_repo_index(repo_path);

-- ─── ai_file_snapshots ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_file_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
  repo_path     TEXT NOT NULL,
  content_hash  TEXT,
  content       TEXT,
  snapshot_type TEXT NOT NULL DEFAULT 'before'
    CHECK (snapshot_type IN ('before', 'after', 'checkpoint')),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_file_snapshots_task ON public.ai_file_snapshots(task_id, created_at DESC);

-- ─── ai_diffs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_diffs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
  repo_path     TEXT NOT NULL,
  diff_text     TEXT NOT NULL,
  lines_added   INTEGER NOT NULL DEFAULT 0,
  lines_removed INTEGER NOT NULL DEFAULT 0,
  applied       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_diffs_task ON public.ai_diffs(task_id, created_at DESC);

-- ─── ai_approvals ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_approvals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES public.ai_tasks(id) ON DELETE CASCADE,
  step_id       UUID REFERENCES public.ai_task_steps(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  requested_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason        TEXT,
  risk_tags     TEXT[] NOT NULL DEFAULT '{}',
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_approvals_task ON public.ai_approvals(task_id, status);

-- ─── ai_deployments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_deployments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
  service_name    TEXT NOT NULL,
  environment     TEXT NOT NULL DEFAULT 'production',
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'building', 'deploying', 'success', 'failed', 'rolled_back')),
  git_sha         TEXT,
  build_id        TEXT,
  health_status   TEXT,
  health_url      TEXT,
  log_summary     TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_deployments_status ON public.ai_deployments(status, created_at DESC);

-- ─── dev_container_sessions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dev_container_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'stopped', 'error')),
  container_ref TEXT,
  workspace     TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ
);

-- ─── dev_terminal_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dev_terminal_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES public.dev_container_sessions(id) ON DELETE SET NULL,
  task_id       UUID REFERENCES public.ai_tasks(id) ON DELETE SET NULL,
  stream        TEXT NOT NULL DEFAULT 'stdout',
  line          TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dev_terminal_logs_task ON public.dev_terminal_logs(task_id, created_at DESC);

-- ─── dev_audit_logs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dev_audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  trace_id      TEXT,
  ip_address    TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_created ON public.dev_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_actor ON public.dev_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_resource ON public.dev_audit_logs(resource_type, resource_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_code_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_repo_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_file_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_diffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_container_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_terminal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_audit_logs ENABLE ROW LEVEL SECURITY;

-- service_role full access
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ai_agents','ai_tasks','ai_task_steps','ai_task_logs','ai_memory',
    'ai_code_patterns','ai_repo_index','ai_file_snapshots','ai_diffs',
    'ai_approvals','ai_deployments','dev_container_sessions','dev_terminal_logs','dev_audit_logs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS dev_studio_service_role_%s ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY dev_studio_service_role_%s ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END $$;

-- admin / super_admin read+write
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ai_agents','ai_tasks','ai_task_steps','ai_task_logs','ai_memory',
    'ai_code_patterns','ai_repo_index','ai_file_snapshots','ai_diffs',
    'ai_approvals','ai_deployments','dev_container_sessions','dev_terminal_logs','dev_audit_logs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS dev_studio_admin_%s ON public.%I', t, t);
    EXECUTE format(
      $p$
      CREATE POLICY dev_studio_admin_%s ON public.%I
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
          )
        )
      $p$, t, t
    );
  END LOOP;
END $$;

-- ─── Seed agents ─────────────────────────────────────────────────────────────
INSERT INTO public.ai_agents (slug, name, description, capabilities, status)
VALUES
  ('ai-developer', 'AI Developer', 'Implements features and fixes across the monorepo.',
    '["code","refactor","api","components"]'::jsonb, 'idle'),
  ('ai-debugger', 'AI Debugger', 'Investigates failures, logs, and regressions.',
    '["debug","logs","reproduce","patch"]'::jsonb, 'idle'),
  ('ai-architect', 'AI Architect', 'Designs schemas, boundaries, and system contracts.',
    '["architecture","migrations","rls","design"]'::jsonb, 'idle'),
  ('ai-qa-tester', 'AI QA Tester', 'Runs tests, accessibility scans, and smoke flows.',
    '["test","e2e","a11y","qa"]'::jsonb, 'idle'),
  ('ai-devops', 'AI DevOps Engineer', 'Build, deploy, and infrastructure operations.',
    '["build","deploy","northflank","ci"]'::jsonb, 'idle'),
  ('ai-lms-builder', 'AI LMS Builder', 'Course blueprints, curriculum, and LMS wiring.',
    '["lms","curriculum","blueprint","seed"]'::jsonb, 'idle'),
  ('ai-workflow-builder', 'AI Workflow Builder', 'Automation workflows and cron jobs.',
    '["workflow","cron","automation"]'::jsonb, 'idle'),
  ('ai-website-manager', 'AI Website Manager', 'Marketing pages, nav, and public site health.',
    '["website","nav","seo","content"]'::jsonb, 'idle'),
  ('ai-compliance', 'AI Compliance Assistant', 'ETPL, WIOA, accessibility, and audit gates.',
    '["compliance","etpl","wioa","a11y"]'::jsonb, 'idle'),
  ('ai-biz-ops', 'AI Business Operations Manager', 'Billing, enrollments, and operational tasks.',
    '["billing","enrollment","ops","reports"]'::jsonb, 'idle')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  capabilities = EXCLUDED.capabilities,
  updated_at = now();

-- ─── Seed coding patterns ────────────────────────────────────────────────────
INSERT INTO public.ai_code_patterns (slug, title, category, pattern_md, example_paths)
VALUES
  ('auth-guards', 'Auth guards', 'security',
    'Use apiAuthGuard / apiRequireAdmin / apiRequireDevStudio before any data access. Page routes use requireUser or requireRole.',
    ARRAY['lib/admin/guards.ts', 'lib/devstudio/api-auth.ts']),
  ('devstudio-api-guards', 'Dev Studio API guards', 'security',
    'All /api/devstudio routes must call apiRequireDevStudio and applyRateLimit.',
    ARRAY['apps/admin/app/api/devstudio/']),
  ('supabase-admin-client', 'Supabase admin client usage', 'database',
    'Use requireAdminClient() from @/lib/supabase/admin for service-role writes. Never expose service key to client.',
    ARRAY['lib/supabase/admin.ts']),
  ('tenant-scoping', 'tenant_id scoping', 'multi-tenant',
    'Scope provider data with tenant_id and RLS helpers: get_my_tenant_id(), is_provider_admin().',
    ARRAY['lib/platform/']),
  ('trace-id', 'trace_id propagation', 'observability',
    'Generate trace_id per task/request; pass through logs, audit, and ai_task_logs metadata.',
    ARRAY['lib/devstudio/os/']),
  ('logger-errors', 'logger error handling', 'observability',
    'Use logger from @/lib/logger. API errors via safeError/safeInternalError — never leak error.message.',
    ARRAY['lib/logger.ts', 'lib/api/safe-error.ts']),
  ('workflow-execution', 'workflow execution pattern', 'automation',
    'Persist workflow runs; emit platform events; guard mutations with audit.',
    ARRAY['app/api/cron/', 'lib/platform/events.ts']),
  ('lms-course-generation', 'LMS course generation pattern', 'lms',
    'CredentialBlueprint → buildCanonicalCourseFromBlueprint → courses/course_modules/course_lessons.',
    ARRAY['lib/curriculum/', 'docs/COURSE_ENGINE.md'])
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  pattern_md = EXCLUDED.pattern_md,
  example_paths = EXCLUDED.example_paths,
  updated_at = now();

-- 20260709000001_workspace_provisioning_foundation.sql
-- Workspace provisioning foundation (Elevate Dev Cloud)
-- Reuses tenants + organizations; adds customer_workspaces lifecycle.
-- Does NOT replace is_platform_admin() — uses is_platform_owner_user() for new RLS only.
-- Apply manually in Supabase SQL Editor.

BEGIN;

-- ── 1. Tenant classification ───────────────────────────────────────────────

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_platform_owner BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS type TEXT;

CREATE INDEX IF NOT EXISTS idx_tenants_is_platform_owner
  ON public.tenants(is_platform_owner)
  WHERE is_platform_owner = true;

CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant_id
  ON public.tenants(parent_tenant_id)
  WHERE parent_tenant_id IS NOT NULL;

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_type_check;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_type_check
  CHECK (
    type IS NULL
    OR type IN ('elevate', 'partner_provider', 'employer', 'workforce_agency', 'customer')
  );

CREATE UNIQUE INDEX IF NOT EXISTS tenants_single_platform_owner_idx
  ON public.tenants ((true))
  WHERE is_platform_owner = true;

-- Backfill platform owner tenant (idempotent)
DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT id INTO v_owner_id
  FROM public.tenants
  WHERE is_platform_owner = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id
    FROM public.tenants
    WHERE type = 'elevate'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id
    FROM public.tenants
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_owner_id IS NOT NULL THEN
    UPDATE public.tenants
    SET is_platform_owner = true,
        type = COALESCE(NULLIF(type, ''), 'elevate')
    WHERE id = v_owner_id;

    INSERT INTO public.platform_settings (key, value, updated_at)
    VALUES ('PLATFORM_OWNER_TENANT_ID', v_owner_id::text, now())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = now();
  END IF;
END $$;

-- ── 2. Customer workspaces ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  owner_email TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'builder'
    CHECK (subscription_tier IN ('builder', 'pro', 'agency', 'starter')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'provisioning', 'active', 'suspended', 'failed', 'archived')),
  template_slug TEXT NOT NULL DEFAULT 'workforce-platform-v1',
  github_repo_url TEXT,
  northflank_project_id TEXT,
  northflank_service_id TEXT,
  supabase_project_ref TEXT,
  workspace_url TEXT,
  trial_ends_at TIMESTAMPTZ,
  provision_error TEXT,
  provisioned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provisioned_at TIMESTAMPTZ,
  CONSTRAINT customer_workspaces_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS customer_workspaces_tenant_id_idx
  ON public.customer_workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS customer_workspaces_status_idx
  ON public.customer_workspaces(status);
CREATE INDEX IF NOT EXISTS customer_workspaces_owner_email_idx
  ON public.customer_workspaces(owner_email)
  WHERE owner_email IS NOT NULL;

-- ── 3. Workspace deployments (Northflank / release history) ────────────────

CREATE TABLE IF NOT EXISTS public.workspace_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.customer_workspaces(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'building', 'deploying', 'live', 'failed', 'rolled_back')),
  northflank_build_id TEXT,
  northflank_deployment_id TEXT,
  commit_ref TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deployed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS workspace_deployments_workspace_id_idx
  ON public.workspace_deployments(workspace_id);

-- ── 4. Custom domains ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspace_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.customer_workspaces(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  ssl_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (ssl_status IN ('pending', 'active', 'failed')),
  verification_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspace_domains_hostname_unique UNIQUE (hostname)
);

CREATE INDEX IF NOT EXISTS workspace_domains_workspace_id_idx
  ON public.workspace_domains(workspace_id);

-- ── 5. AI operator (foundation) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.operator_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.customer_workspaces(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL DEFAULT 'chat'
    CHECK (task_type IN ('chat', 'build', 'test', 'deploy', 'fix', 'generate_site', 'generate_lms')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'canceled')),
  prompt TEXT NOT NULL,
  result_summary TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS operator_tasks_workspace_id_idx
  ON public.operator_tasks(workspace_id);

CREATE TABLE IF NOT EXISTS public.operator_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.customer_workspaces(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'workspace',
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT operator_memory_workspace_key_unique UNIQUE (workspace_id, scope, key)
);

-- ── 6. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.customer_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_memory ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_platform_owner_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT id
  FROM public.tenants
  WHERE is_platform_owner = true
  ORDER BY created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_owner_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.tenants t ON t.id = p.tenant_id
    WHERE p.id = auth.uid()
      AND t.is_platform_owner = true
      AND p.role IN ('super_admin', 'admin', 'staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.tenants t ON t.id = p.tenant_id
    WHERE p.id = auth.uid()
      AND t.is_platform_owner = true
      AND p.role = 'super_admin'
  );
$$;

-- Customer workspace: platform staff read/write; tenant members read own
DROP POLICY IF EXISTS "customer_workspaces_platform_staff" ON public.customer_workspaces;
CREATE POLICY "customer_workspaces_platform_staff" ON public.customer_workspaces
  FOR ALL
  USING (public.is_platform_owner_user())
  WITH CHECK (public.is_platform_owner_user());

DROP POLICY IF EXISTS "customer_workspaces_tenant_read" ON public.customer_workspaces;
CREATE POLICY "customer_workspaces_tenant_read" ON public.customer_workspaces
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "customer_workspaces_service_role" ON public.customer_workspaces;
CREATE POLICY "customer_workspaces_service_role" ON public.customer_workspaces
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "workspace_deployments_service_role" ON public.workspace_deployments;
CREATE POLICY "workspace_deployments_service_role" ON public.workspace_deployments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "workspace_domains_service_role" ON public.workspace_domains;
CREATE POLICY "workspace_domains_service_role" ON public.workspace_domains
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "operator_tasks_service_role" ON public.operator_tasks;
CREATE POLICY "operator_tasks_service_role" ON public.operator_tasks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "operator_memory_service_role" ON public.operator_memory;
CREATE POLICY "operator_memory_service_role" ON public.operator_memory
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

GRANT SELECT ON public.customer_workspaces TO authenticated;
GRANT ALL ON public.customer_workspaces TO service_role;
GRANT ALL ON public.workspace_deployments TO service_role;
GRANT ALL ON public.workspace_domains TO service_role;
GRANT ALL ON public.operator_tasks TO service_role;
GRANT ALL ON public.operator_memory TO service_role;

COMMIT;

-- 20260710000004_lms_modules_view_hvac_active.sql
-- Migration: Create lms_modules unified view + activate training_lessons writes
-- Combines program modules (modules), course modules (course_modules), and
-- staff training modules (training_modules) into a single queryable view.
-- Also ensures training_lessons has proper RLS for admin writes.

-- ============================================
-- 1. Unified lms_modules view
-- ============================================
CREATE OR REPLACE VIEW public.lms_modules WITH (security_invoker = true) AS
  -- Program-scoped modules (analytics, transcripts, mobile)
  SELECT
    m.id,
    m.title,
    m.description,
    m.program_id,
    NULL::uuid AS course_id,
    m.module_type,
    m.order_index,
    m.duration_hours,
    m.is_required,
    m.created_at,
    m.updated_at,
    'program' AS source
  FROM public.modules m

  UNION ALL

  -- Course-scoped modules (Studio, blueprint, LMS engine)
  SELECT
    cm.id,
    cm.title,
    cm.description,
    NULL::uuid AS program_id,
    cm.course_id,
    'course' AS module_type,
    cm.order_index,
    NULL::double precision AS duration_hours,
    true AS is_required,
    cm.created_at,
    cm.updated_at,
    'course' AS source
  FROM public.course_modules cm

  UNION ALL

  -- Staff training modules
  SELECT
    tm.id,
    tm.title,
    tm.description,
    NULL::uuid AS program_id,
    NULL::uuid AS course_id,
    'training' AS module_type,
    tm.order_index,
    (tm.duration_minutes / 60.0)::double precision AS duration_hours,
    tm.is_required,
    tm.created_at,
    tm.updated_at,
    'staff_training' AS source
  FROM public.training_modules tm;

-- Grant access
GRANT SELECT ON public.lms_modules TO authenticated;

-- ============================================
-- 2. Enable training_lessons writes for admins
-- ============================================
-- Allow admin/super_admin to update training_lessons (HVAC content management)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'training_lessons'
    AND policyname = 'training_lessons_admin_write'
  ) THEN
    CREATE POLICY training_lessons_admin_write ON public.training_lessons
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- ============================================
-- 3. Add training_modules to AGENTS.md key objects
-- ============================================
-- Note: training_modules is now part of the unified LMS module system.
-- It serves both staff training AND the admin modules management page.

COMMENT ON VIEW public.lms_modules IS 'Unified module view: program modules + course modules + staff training modules. Read via this view; write to the source table.';

-- 20260713000001_host_shop_applications.sql
-- Host Shop Applications Table
-- Stores host shop partnership applications and fee payments

CREATE TABLE IF NOT EXISTS host_shop_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe Payment Info
  stripe_session_id VARCHAR(255),
  stripe_payment_intent VARCHAR(255),
  
  -- Application Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'pending_review',
    'approved',
    'rejected',
    'refunded',
    'expired'
  )),
  fee_status VARCHAR(50) DEFAULT 'pending' CHECK (fee_status IN (
    'pending',
    'paid',
    'refunded',
    'failed'
  )),
  fee_amount_cents INTEGER DEFAULT 5000,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Business Information
  business_name VARCHAR(255),
  business_type VARCHAR(50) CHECK (business_type IN (
    'salon',
    'barbershop',
    'spa',
    'nail_studio',
    'esthetics_studio',
    'beauty_salon',
    'other'
  )),
  license_number VARCHAR(100),
  address TEXT,
  
  -- Contact Information
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Partner Tiers
  partner_tier VARCHAR(50) DEFAULT 'free' CHECK (partner_tier IN (
    'free',
    'bronze',
    'silver',
    'gold',
    'platinum'
  )),
  tier_started_at TIMESTAMPTZ,
  tier_expires_at TIMESTAMPTZ,
  
  -- Onboarding
  onboarding_completed_at TIMESTAMPTZ,
  welcome_email_sent_at TIMESTAMPTZ,
  certificate_issued_at TIMESTAMPTZ,
  
  -- Compliance
  license_verified BOOLEAN DEFAULT false,
  license_verified_at TIMESTAMPTZ,
  business_verified BOOLEAN DEFAULT false,
  business_verified_at TIMESTAMPTZ,
  
  -- Notes
  internal_notes TEXT,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_email ON host_shop_applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_status ON host_shop_applications(status);
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_stripe ON host_shop_applications(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_business ON host_shop_applications(business_name);

-- RLS Policies
ALTER TABLE host_shop_applications ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for webhook)
CREATE POLICY "Service role can do everything"
  ON host_shop_applications FOR ALL
  USING (auth.role() = 'service_role');

-- Public can insert (from webhook)
CREATE POLICY "Public can insert host shop applications"
  ON host_shop_applications FOR INSERT
  WITH CHECK (true);

-- Admins can read all
CREATE POLICY "Admins can read host shop applications"
  ON host_shop_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER host_shop_applications_updated_at
  BEFORE UPDATE ON host_shop_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Audit log trigger
CREATE OR REPLACE FUNCTION log_host_shop_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    'host_shop_applications',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'INSERT'
      WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
      WHEN TG_OP = 'DELETE' THEN 'DELETE'
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER host_shop_applications_audit
  AFTER INSERT OR UPDATE OR DELETE ON host_shop_applications
  FOR EACH ROW
  EXECUTE FUNCTION log_host_shop_changes();

-- 20260723000001_application_fee_policy.sql
-- Application Fee Policy Migration
-- Adds payment_type column to distinguish program vs host shop fees

-- Add payment_type column to application_payments
ALTER TABLE application_payments 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'program_fee'
CHECK (payment_type IN ('program_fee', 'host_shop_fee'));

-- Add comment
COMMENT ON COLUMN application_payments.payment_type IS 'Type of application fee: program_fee ($15 for programs) or host_shop_fee ($15 for host shops)';

-- Add index for payment type queries
CREATE INDEX IF NOT EXISTS idx_application_payments_type ON application_payments(payment_type);

-- Add index for fee reporting
CREATE INDEX IF NOT EXISTS idx_application_payments_date_amount 
ON application_payments(paid_at, amount_cents) 
WHERE status = 'completed';

-- 20260810000001_ai_agents_dev_studio.sql
-- Migration: Create AI Agent tables for Dev Studio
-- Purpose: Store AI agent configurations, tasks, audit logs, and memory

CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  model_provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'gemini', 'deepseek', 'qwen'
  model_name VARCHAR(255) NOT NULL,
  system_prompt TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(500),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'planning', 'executing', 'completed', 'failed', 'cancelled', 'requires_approval'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  result JSONB,
  error TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_task_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'chat', 'plan', 'execute', 'shell', 'git', 'file_read', 'file_write', 'file_delete', 'deploy', 'approve'
  prompt TEXT,
  response TEXT,
  files_changed JSONB DEFAULT '[]',
  shell_commands JSONB DEFAULT '[]',
  git_branch VARCHAR(255),
  status VARCHAR(50) DEFAULT 'success', -- 'success', 'failed', 'pending'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
  step_id UUID REFERENCES ai_task_steps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  prompt TEXT,
  response TEXT,
  files_changed JSONB DEFAULT '[]',
  shell_commands JSONB DEFAULT '[]',
  git_branch VARCHAR(255),
  status VARCHAR(50) DEFAULT 'success',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type VARCHAR(50) NOT NULL, -- 'conversation', 'code_context', 'task_history', 'pattern'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  relevance_score DECIMAL(3,2),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_code_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pattern_name VARCHAR(255) NOT NULL,
  pattern_type VARCHAR(100), -- 'component', 'api', 'migration', 'test', 'workflow'
  code_snippet TEXT,
  description TEXT,
  use_cases JSONB DEFAULT '[]',
  language VARCHAR(50),
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_repo_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  file_path VARCHAR(1000) NOT NULL,
  file_hash VARCHAR(64),
  content_summary TEXT,
  code_symbols JSONB DEFAULT '[]',
  last_indexed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_file_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
  file_path VARCHAR(1000) NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
  file_path VARCHAR(1000) NOT NULL,
  diff_content TEXT,
  old_hash VARCHAR(64),
  new_hash VARCHAR(64),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'applied'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE CASCADE,
  step_id UUID REFERENCES ai_task_steps(id) ON DELETE CASCADE,
  approval_type VARCHAR(100) NOT NULL, -- 'file_delete', 'migration', 'main_push', 'production_deploy', 'env_change'
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ai_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ai_tasks(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  environment VARCHAR(50) NOT NULL, -- 'development', 'staging', 'production'
  branch VARCHAR(255) NOT NULL,
  commit_hash VARCHAR(64),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'building', 'deploying', 'success', 'failed', 'rolled_back'
  build_log TEXT,
  deploy_log TEXT,
  url VARCHAR(500),
  deployed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS dev_container_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  container_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'stopped', 'terminated'
  resources JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS dev_terminal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES dev_container_sessions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  command TEXT,
  output TEXT,
  exit_code INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_category VARCHAR(100) NOT NULL, -- 'ai_agent', 'file_operation', 'shell_command', 'git_operation', 'deployment'
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_tasks_tenant_status ON ai_tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_user ON ai_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_steps_task ON ai_task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_logs_task ON ai_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_logs_user ON ai_task_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_type ON ai_memory(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_code_patterns_type ON ai_code_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ai_approvals_status ON ai_approvals(status);
CREATE INDEX IF NOT EXISTS idx_ai_deployments_tenant ON ai_deployments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_user ON dev_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_audit_logs_created ON dev_audit_logs(created_at);

-- Row Level Security
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_code_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_repo_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_file_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_diffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_container_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_terminal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their tenant's data
CREATE POLICY ai_agents_tenant ON ai_agents FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_tasks_tenant ON ai_tasks FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_task_steps_tenant ON ai_task_steps FOR ALL USING (task_id IN (SELECT id FROM ai_tasks WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY ai_task_logs_tenant ON ai_task_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_memory_tenant ON ai_memory FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_code_patterns_tenant ON ai_code_patterns FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_repo_index_tenant ON ai_repo_index FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY ai_file_snapshots_tenant ON ai_file_snapshots FOR ALL USING (task_id IN (SELECT id FROM ai_tasks WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY ai_diffs_tenant ON ai_diffs FOR ALL USING (task_id IN (SELECT id FROM ai_tasks WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY ai_approvals_tenant ON ai_approvals FOR ALL USING (task_id IN (SELECT id FROM ai_tasks WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY ai_deployments_tenant ON ai_deployments FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY dev_container_sessions_tenant ON dev_container_sessions FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY dev_terminal_logs_tenant ON dev_terminal_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY dev_audit_logs_tenant ON dev_audit_logs FOR ALL USING (tenant_id = current_setting('app.tenant_id')::UUID);

COMMENT ON TABLE ai_agents IS 'AI agent configurations for Dev Studio';
COMMENT ON TABLE ai_tasks IS 'AI task tracking and status';
COMMENT ON TABLE ai_task_steps IS 'Individual steps within AI tasks';
COMMENT ON TABLE ai_task_logs IS 'Audit logs for all AI agent actions';
COMMENT ON TABLE ai_memory IS 'Persistent memory for AI agents';
COMMENT ON TABLE ai_code_patterns IS 'Reusable code patterns learned by AI';
COMMENT ON TABLE ai_repo_index IS 'Indexed repository files for AI context';
COMMENT ON TABLE ai_file_snapshots IS 'File snapshots before/after changes';
COMMENT ON TABLE ai_diffs IS 'Git diffs pending approval';
COMMENT ON TABLE ai_approvals IS 'Approval requests for sensitive operations';
COMMENT ON TABLE ai_deployments IS 'AI-triggered deployments tracking';
COMMENT ON TABLE dev_container_sessions IS 'Dev container session tracking';
COMMENT ON TABLE dev_terminal_logs IS 'Terminal command logs';
COMMENT ON TABLE dev_audit_logs IS 'Comprehensive audit trail';
-- 20260810000002_course_generation_pipeline.sql
-- Migration: Create Course Generation Pipeline tables
-- Purpose: Async AI course generation with Supabase storage + Cloudflare R2 for media

CREATE TABLE IF NOT EXISTS course_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  title VARCHAR(500) NOT NULL,
  occupation VARCHAR(255),
  soc_code VARCHAR(20),
  credential_type VARCHAR(100),
  target_hours INTEGER,
  delivery_mode VARCHAR(50) DEFAULT 'online', -- 'online', 'hybrid', 'in-person'
  target_audience TEXT,
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'planning', 'generating', 'saving', 'reviewing', 'published', 'failed'
  progress_percent INTEGER DEFAULT 0,
  current_step VARCHAR(100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  settings JSONB DEFAULT '{}', -- AI model settings, auto-publish preference
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(1000),
  description TEXT,
  occupation VARCHAR(255),
  soc_code VARCHAR(20),
  credential_type VARCHAR(100),
  target_hours INTEGER,
  delivery_mode VARCHAR(50),
  target_audience TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(50) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  language VARCHAR(20) DEFAULT 'en',
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published', 'archived'
  thumbnail_url VARCHAR(1000),
  banner_url VARCHAR(1000),
  version VARCHAR(50) DEFAULT '1.0',
  estimated_duration VARCHAR(100),
  passing_score INTEGER DEFAULT 70,
  completion_rule VARCHAR(50) DEFAULT 'all_lessons', -- 'all_lessons', 'required_lessons', 'minimum_score'
  total_modules INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  total_quizzes INTEGER DEFAULT 0,
  total_hours DECIMAL(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  objectives JSONB DEFAULT '[]',
  estimated_hours DECIMAL(5,2) DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  unlock_after_days INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES generated_modules(id) ON DELETE CASCADE,
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  lesson_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) DEFAULT 'reading', -- 'video', 'reading', 'quiz', 'assignment', 'activity', 'lab'
  content TEXT, -- HTML/Markdown content
  summary TEXT,
  objectives JSONB DEFAULT '[]',
  reflection_prompt TEXT,
  duration_minutes INTEGER DEFAULT 30,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES generated_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 3,
  shuffle_questions BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,
  questions JSONB DEFAULT '[]', -- Array of question objects
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES generated_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  instructions TEXT,
  rubric TEXT,
  submission_type VARCHAR(50) DEFAULT 'file_upload', -- 'file_upload', 'text', 'url', 'quiz'
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_file_types JSONB DEFAULT '["pdf", "doc", "docx", "jpg", "png"]',
  due_days_after_start INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES generated_modules(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES generated_lessons(id) ON DELETE SET NULL,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  resource_type VARCHAR(50) NOT NULL, -- 'pdf', 'worksheet', 'template', 'scorm', 'video', 'link', 'other'
  description TEXT,
  content_url VARCHAR(1000), -- R2 URL for files
  content_text TEXT, -- For links, embedded content
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  asset_type VARCHAR(50) NOT NULL, -- 'video', 'audio', 'image', 'document', 'scorm', 'other'
  filename VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500),
  storage_key VARCHAR(1000) NOT NULL, -- R2 storage key
  public_url VARCHAR(1000), -- R2 public URL
  private_url VARCHAR(1000), -- R2 signed URL (for limited access)
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  duration_seconds INTEGER, -- For video/audio
  thumbnail_url VARCHAR(1000),
  status VARCHAR(50) DEFAULT 'uploading', -- 'uploading', 'processing', 'ready', 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'created', 'draft_saved', 'submitted_review', 'approved', 'published', 'unpublished', 'archived'
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_jobs_status ON course_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_course_jobs_tenant ON course_generation_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_generated_courses_status ON generated_courses(status);
CREATE INDEX IF NOT EXISTS idx_generated_courses_tenant ON generated_courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_generated_modules_course ON generated_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_generated_lessons_module ON generated_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_generated_lessons_course ON generated_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_generated_quizzes_lesson ON generated_quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_media_course ON course_media_assets(course_id);
CREATE INDEX IF NOT EXISTS idx_course_publish_course ON course_publish_logs(course_id);

-- Row Level Security
ALTER TABLE course_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_publish_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY course_jobs_tenant ON course_generation_jobs FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY generated_courses_tenant ON generated_courses FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY generated_modules_tenant ON generated_modules FOR ALL 
  USING (module_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY generated_lessons_tenant ON generated_lessons FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY generated_quizzes_tenant ON generated_quizzes FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY generated_assignments_tenant ON generated_assignments FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY generated_resources_tenant ON generated_resources FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY course_media_tenant ON course_media_assets FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY course_publish_tenant ON course_publish_logs FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));

COMMENT ON TABLE course_generation_jobs IS 'AI course generation job queue and tracking';
COMMENT ON TABLE generated_courses IS 'AI-generated course metadata';
COMMENT ON TABLE generated_modules IS 'Course modules/lessons structure';
COMMENT ON TABLE generated_lessons IS 'Individual lesson content';
COMMENT ON TABLE generated_quizzes IS 'Quiz questions and settings';
COMMENT ON TABLE generated_assignments IS 'Assignment instructions and rubrics';
COMMENT ON TABLE generated_resources IS 'Course resources (PDFs, worksheets, etc.)';
COMMENT ON TABLE course_media_assets IS 'Media files stored in Cloudflare R2';
COMMENT ON TABLE course_publish_logs IS 'Audit log for course publishing actions';
-- 20260810000006_host_shop_subscriptions.sql
-- Host Shop Subscription System
-- Plans, features, subscriptions, and host shop associations

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Plans table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  monthly_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
  annual_price    NUMERIC(10,2),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  tier            TEXT NOT NULL DEFAULT 'starter',
                    CHECK (tier IN ('starter', 'professional', 'enterprise')),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Plan features
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plan_features (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key     TEXT NOT NULL,
  feature_value   JSONB DEFAULT '{"enabled": true}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, feature_key)
);

-- Standard feature keys:
-- host_apprentice_management, host_hours_approval, host_competency_signoff
-- host_evaluations, host_documents, host_reports_basic, host_reports_advanced
-- host_messaging, host_schedule, host_multi_location, host_ai_evaluations
-- host_compliance_exports, host_store_access
-- max_apprentices, max_instructors, max_storage_gb, max_ai_credits, max_sms_credits

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Host shop subscriptions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.host_shop_subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES public.plans(id),
  status            TEXT NOT NULL DEFAULT 'active',
                    CHECK (status IN ('active', 'past_due', 'canceled', 'suspended', 'trialing')),
  billing_cycle     TEXT NOT NULL DEFAULT 'monthly',
                    CHECK (billing_cycle IN ('monthly', 'annual')),
  starts_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at           TIMESTAMPTZ,
  trial_ends_at     TIMESTAMPTZ,
  stripe_subscription_id  TEXT,
  stripe_customer_id    TEXT,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT false,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Host shops (extend tenants with shop-specific fields)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.host_shops (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id       UUID REFERENCES public.host_shop_subscriptions(id),
  business_name         TEXT NOT NULL,
  dba_name              TEXT,
  license_number        TEXT,
  license_expiry        DATE,
  owner_name            TEXT,
  owner_email           TEXT,
  owner_phone           TEXT,
  address_line1         TEXT,
  address_line2         TEXT,
  city                  TEXT,
  state                 TEXT DEFAULT 'IN',
  zip_code              TEXT,
  supervisor_name       TEXT,
  supervisor_license    TEXT,
  operating_hours       JSONB DEFAULT '{"mon":"9-5","tue":"9-5","wed":"9-5","thu":"9-5","fri":"9-5","sat":"closed","sun":"closed"}',
  logo_url              TEXT,
  programs_hosted       TEXT[] DEFAULT ARRAY['barber'],
  capacity              JSONB DEFAULT '{"barber":5,"cosmetology":5,"nail_tech":5,"esthetics":5}',
  onboarding_complete    BOOLEAN DEFAULT false,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Apprenticeships (link apprentices to host shops)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.host_shop_apprentices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_shop_id        UUID NOT NULL REFERENCES public.host_shops(id) ON DELETE CASCADE,
  apprentice_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supervisor_id       UUID REFERENCES auth.users(id),
  program_type        TEXT NOT NULL,
                    CHECK (program_type IN ('barber', 'cosmetology', 'nail_tech', 'esthetics')),
  status              TEXT NOT NULL DEFAULT 'active',
                    CHECK (status IN ('active', 'pending', 'completed', 'terminated')),
  start_date          DATE,
  expected_end_date    DATE,
  actual_end_date      DATE,
  current_level        TEXT DEFAULT 'year_1',
  progress_percent     NUMERIC(5,2) DEFAULT 0,
  assigned_by           UUID REFERENCES auth.users(id),
  notes               TEXT,
  metadata             JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (host_shop_id, apprentice_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Competency sign-offs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competency_signoffs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_shop_apprentice_id UUID NOT NULL REFERENCES public.host_shop_apprentices(id) ON DELETE CASCADE,
  skill_name          TEXT NOT NULL,
  skill_category      TEXT NOT NULL,
  evidence_type       TEXT CHECK (evidence_type IN ('photo', 'video', 'document')),
  evidence_url        TEXT,
  supervisor_notes    TEXT,
  supervisor_signed    BOOLEAN DEFAULT false,
  supervisor_signed_at TIMESTAMPTZ,
  supervisor_id       UUID REFERENCES auth.users(id),
  reviewed_by         UUID REFERENCES auth.users(id),
  reviewed_at         TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'pending',
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Apprentice hours (host shop approval)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.apprentice_hours (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_shop_apprentice_id UUID NOT NULL REFERENCES public.host_shop_apprentices(id) ON DELETE CASCADE,
  work_date           DATE NOT NULL,
  clock_in            TIMESTAMPTZ,
  clock_out           TIMESTAMPTZ,
  total_hours         NUMERIC(5,2) NOT NULL DEFAULT 0,
  break_minutes       INTEGER DEFAULT 0,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by        UUID REFERENCES auth.users(id),
  approved_at        TIMESTAMPTZ,
  rejected_reason     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Evaluations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.host_shop_evaluations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_shop_apprentice_id UUID NOT NULL REFERENCES public.host_shop_apprentices(id) ON DELETE CASCADE,
  evaluation_type     TEXT NOT NULL,
                    CHECK (evaluation_type IN ('monthly', 'quarterly', 'annual', 'performance')),
  period_start        DATE,
  period_end          DATE,
  performance_rating  INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
  attendance_rating   INTEGER CHECK (attendance_rating BETWEEN 1 AND 5),
  skill_progress_rating INTEGER CHECK (skill_progress_rating BETWEEN 1 AND 5),
  strengths           TEXT,
  areas_for_improvement TEXT,
  improvement_plan    TEXT,
  notes               TEXT,
  supervisor_signature BOOLEAN DEFAULT false,
  supervisor_signed_at TIMESTAMPTZ,
  supervisor_id       UUID REFERENCES auth.users(id),
  apprentice_acknowledged BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_host_shop_subscriptions_tenant ON public.host_shop_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_subscriptions_status ON public.host_shop_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_host_shops_tenant ON public.host_shops(tenant_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_apprentices_shop ON public.host_shop_apprentices(host_shop_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_apprentices_apprentice ON public.host_shop_apprentices(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_apprentices_status ON public.host_shop_apprentices(status);
CREATE INDEX IF NOT EXISTS idx_competency_signoffs_apprentice ON public.competency_signoffs(host_shop_apprentice_id);
CREATE INDEX IF NOT EXISTS idx_competency_signoffs_status ON public.competency_signoffs(status);
CREATE INDEX IF NOT EXISTS idx_apprentice_hours_apprentice ON public.apprentice_hours(host_shop_apprentice_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_hours_status ON public.apprentice_hours(status);
CREATE INDEX IF NOT EXISTS idx_host_shop_evaluations_apprentice ON public.host_shop_evaluations(host_shop_apprentice_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_shop_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_shop_apprentices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_signoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprentice_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_shop_evaluations ENABLE ROW LEVEL SECURITY;

-- Plans: public read
DO $$ BEGIN CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Plan features: public read
DO $$ BEGIN CREATE POLICY "plan_features_public_read" ON public.plan_features FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Host shop subscriptions: tenant access
DO $$ BEGIN CREATE POLICY "subscriptions_tenant_access" ON public.host_shop_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = tenant_id AND owner_id = auth.uid()
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Host shops: tenant access
DO $$ BEGIN CREATE POLICY "host_shops_tenant_access" ON public.host_shops FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = tenant_id AND owner_id = auth.uid()
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Host shop apprentices: shop staff access
DO $$ BEGIN CREATE POLICY "apprentices_shop_access" ON public.host_shop_apprentices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.host_shops hs
      JOIN public.tenants t ON t.id = hs.tenant_id
      WHERE hs.id = host_shop_id AND (t.owner_id = auth.uid() OR hs.supervisor_id = auth.uid())
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Competency signoffs: shop staff + apprentice self
DO $$ BEGIN CREATE POLICY "signoffs_shop_access" ON public.competency_signoffs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.host_shop_apprentices hsa
      JOIN public.host_shops hs ON hs.id = hsa.host_shop_id
      JOIN public.tenants t ON t.id = hs.tenant_id
      WHERE hsa.id = host_shop_apprentice_id 
        AND (t.owner_id = auth.uid() OR hsa.supervisor_id = auth.uid() OR hsa.apprentice_id = auth.uid())
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Apprentice hours: shop staff + apprentice self
DO $$ BEGIN CREATE POLICY "hours_shop_access" ON public.apprentice_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.host_shop_apprentices hsa
      JOIN public.host_shops hs ON hs.id = hsa.host_shop_id
      JOIN public.tenants t ON t.id = hs.tenant_id
      WHERE hsa.id = host_shop_apprentice_id 
        AND (t.owner_id = auth.uid() OR hsa.supervisor_id = auth.uid() OR hsa.apprentice_id = auth.uid())
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Evaluations: shop staff + apprentice self
DO $$ BEGIN CREATE POLICY "evaluations_shop_access" ON public.host_shop_evaluations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.host_shop_apprentices hsa
      JOIN public.host_shops hs ON hs.id = hsa.host_shop_id
      JOIN public.tenants t ON t.id = hs.tenant_id
      WHERE hsa.id = host_shop_apprentice_id 
        AND (t.owner_id = auth.uid() OR hsa.supervisor_id = auth.uid() OR hsa.apprentice_id = auth.uid())
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Default Plans
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.plans (name, slug, description, monthly_price, annual_price, tier, metadata) VALUES
  ('Starter Host Shop', 'starter-host-shop', 
   'Perfect for new host shops. Includes up to 2 apprentices with basic hour tracking and messaging.',
   99.00, 990.00, 'starter',
   '{"max_apprentices": 2, "max_instructors": 1, "max_storage_gb": 5, "max_ai_credits": 100, "max_sms_credits": 50}'),

  ('Professional Host Shop', 'professional-host-shop',
   'For growing shops. Up to 10 apprentices with AI evaluations, competency tracking, and compliance exports.',
   249.00, 2490.00, 'professional',
   '{"max_apprentices": 10, "max_instructors": 3, "max_storage_gb": 25, "max_ai_credits": 1000, "max_sms_credits": 200}'),

  ('Enterprise Partner', 'enterprise-partner',
   'Unlimited apprentices, multi-location management, white labeling, and dedicated support.',
   499.00, 4990.00, 'enterprise',
   '{"max_apprentices": -1, "max_instructors": -1, "max_storage_gb": 100, "max_ai_credits": -1, "max_sms_credits": -1}')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      monthly_price = EXCLUDED.monthly_price,
      annual_price = EXCLUDED.annual_price,
      metadata = EXCLUDED.metadata;

-- Seed features for Starter
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_apprentice_management', '{"enabled": true}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_hours_approval', '{"enabled": true}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_messaging', '{"enabled": true}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_basic', '{"enabled": true}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_ai_evaluations', '{"enabled": false}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_advanced', '{"enabled": false}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_multi_location', '{"enabled": false}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_compliance_exports', '{"enabled": false}' FROM public.plans WHERE slug = 'starter-host-shop'
ON CONFLICT DO NOTHING;

-- Seed features for Professional
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_apprentice_management', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_hours_approval', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_competency_signoff', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_evaluations', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_documents', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_basic', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_advanced', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_messaging', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_schedule', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_ai_evaluations', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_compliance_exports', '{"enabled": true}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_multi_location', '{"enabled": false}' FROM public.plans WHERE slug = 'professional-host-shop'
ON CONFLICT DO NOTHING;

-- Seed features for Enterprise (all enabled)
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_apprentice_management', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_hours_approval', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_competency_signoff', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_evaluations', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_documents', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_basic', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_reports_advanced', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_messaging', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_schedule', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_ai_evaluations', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_compliance_exports', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_multi_location', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;
INSERT INTO public.plan_features (plan_id, feature_key, feature_value)
SELECT id, 'host_store_access', '{"enabled": true}' FROM public.plans WHERE slug = 'enterprise-partner'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: get host shop features
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_host_shop_features(p_host_shop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_id UUID;
  v_plan_id UUID;
  v_features JSONB;
BEGIN
  SELECT subscription_id, plan_id INTO v_subscription_id, v_plan_id
  FROM public.host_shops
  WHERE id = p_host_shop_id;

  IF v_plan_id IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT jsonb_object_agg(feature_key, feature_value)
  INTO v_features
  FROM public.plan_features
  WHERE plan_id = v_plan_id;

  RETURN COALESCE(v_features, '{}'::jsonb);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: check feature access
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_host_shop_feature(
  p_host_shop_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT (feature_value->>'enabled')::boolean INTO v_enabled
  FROM public.plan_features pf
  JOIN public.host_shops hs ON hs.plan_id = pf.plan_id
  WHERE hs.id = p_host_shop_id AND pf.feature_key = p_feature_key;

  RETURN COALESCE(v_enabled, false);
END;
$$;

-- 20260815000001_store_product_images_variants.sql
-- Migration: Add missing product_images and product_variants tables for store functionality
-- Fixes PGRST200 error: Could not find a relationship between products and product_images

-- ============================================
-- PRODUCT IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(sort_order);

-- ============================================
-- PRODUCT VARIANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price NUMERIC DEFAULT 0,
  compare_price NUMERIC,
  inventory_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

-- ============================================
-- ENABLE RLS (Row Level Security)
-- ============================================
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR product_images
-- ============================================
CREATE POLICY "Allow read access to product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert product images"
  ON public.product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Allow admin update product images"
  ON public.product_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Allow admin delete product images"
  ON public.product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ============================================
-- RLS POLICIES FOR product_variants
-- ============================================
CREATE POLICY "Allow read access to product variants"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert product variants"
  ON public.product_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Allow admin update product variants"
  ON public.product_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Allow admin delete product variants"
  ON public.product_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ============================================
-- NOTIFY SCHEMA CACHE REFRESH
-- ============================================
NOTIFY pgrst, 'reload schema';

