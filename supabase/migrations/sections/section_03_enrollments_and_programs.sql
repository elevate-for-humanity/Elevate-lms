-- Fix training_enrollments RLS policies to allow admin enrollment
-- The current policies only allow users to enroll themselves via auth flow
-- This adds policies for admins to enroll users directly

-- Allow admins to insert enrollments for any user
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
-- Canonical student_enrollments table for program enrollment checkout
-- This is the single source of truth for paid/funded program enrollments

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  program_id UUID,
  program_slug TEXT,
  stripe_checkout_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  funding_source TEXT DEFAULT 'self_pay',
  amount_paid NUMERIC DEFAULT 0,
  region_id TEXT DEFAULT 'IN',
  transfer_hours NUMERIC DEFAULT 0,
  required_hours NUMERIC DEFAULT 1500,
  has_host_shop BOOLEAN DEFAULT false,
  host_shop_name TEXT,
  case_id UUID,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists (idempotent)
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS program_slug TEXT;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS funding_source TEXT DEFAULT 'self_pay';
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS region_id TEXT DEFAULT 'IN';
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS transfer_hours NUMERIC DEFAULT 0;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS required_hours NUMERIC DEFAULT 1500;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS has_host_shop BOOLEAN DEFAULT false;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS host_shop_name TEXT;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS case_id UUID;
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create unique constraint on stripe_checkout_session_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'student_enrollments_stripe_checkout_session_id_key'
  ) THEN
    ALTER TABLE public.student_enrollments 
    ADD CONSTRAINT student_enrollments_stripe_checkout_session_id_key 
    UNIQUE (stripe_checkout_session_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_program_slug ON public.student_enrollments(program_slug);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status ON public.student_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_stripe_session ON public.student_enrollments(stripe_checkout_session_id);

-- Enable RLS
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.student_enrollments;
CREATE POLICY "Students can view own enrollments" ON public.student_enrollments
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Service role full access" ON public.student_enrollments;
CREATE POLICY "Service role full access" ON public.student_enrollments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Staff can view all enrollments" ON public.student_enrollments;
CREATE POLICY "Staff can view all enrollments" ON public.student_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff', 'instructor')
    )
  );

-- Grant permissions
GRANT SELECT ON public.student_enrollments TO authenticated;
GRANT ALL ON public.student_enrollments TO service_role;

COMMENT ON TABLE public.student_enrollments IS 'Canonical table for all program enrollments (paid and funded)';
COMMENT ON COLUMN public.student_enrollments.stripe_checkout_session_id IS 'Stripe checkout session ID - unique, used for idempotent provisioning';
COMMENT ON COLUMN public.student_enrollments.funding_source IS 'self_pay, workone, wioa, grant, employer';
-- ============================================================
-- ENROLLMENT STATE MACHINE
-- Adds columns for frictionless enrollment flow tracking
-- ============================================================

-- Add enrollment state tracking columns
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS orientation_completed_at TIMESTAMPTZ;

ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS documents_submitted_at TIMESTAMPTZ;

ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS funding_source TEXT;

ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('self_pay', 'wioa', 'wrg', 'jri', 'employer', 'other'));

-- Drop existing status constraint and add new one with all states
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_status_check 
CHECK (status IN (
  'applied',
  'approved', 
  'paid',
  'confirmed',
  'orientation_complete',
  'documents_complete',
  'active',
  'completed',
  'withdrawn',
  'suspended',
  'pending'
));

-- Create index for faster state queries
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON public.enrollments(user_id, status);

-- Function to get next required action for an enrollment
CREATE OR REPLACE FUNCTION get_enrollment_next_action(enrollment_id UUID)
RETURNS TABLE(action_label TEXT, action_href TEXT, action_description TEXT) AS $$
DECLARE
  enrollment_record RECORD;
  program_slug TEXT;
BEGIN
  SELECT e.*, p.slug INTO enrollment_record
  FROM enrollments e
  LEFT JOIN programs p ON e.program_id = p.id
  WHERE e.id = enrollment_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  program_slug := COALESCE(enrollment_record.slug, 'barber-apprenticeship');
  
  -- Priority 1: Orientation
  IF enrollment_record.orientation_completed_at IS NULL THEN
    RETURN QUERY SELECT 
      'Complete Orientation'::TEXT,
      ('/programs/' || program_slug || '/orientation')::TEXT,
      'Complete your mandatory orientation to continue'::TEXT;
    RETURN;
  END IF;
  
  -- Priority 2: Documents
  IF enrollment_record.documents_submitted_at IS NULL THEN
    RETURN QUERY SELECT 
      'Submit Required Documents'::TEXT,
      ('/programs/' || program_slug || '/documents')::TEXT,
      'Upload your required documents to access your program'::TEXT;
    RETURN;
  END IF;
  
  -- Priority 3: First course
  RETURN QUERY SELECT 
    'Begin Course 1'::TEXT,
    '/apprentice/courses/1'::TEXT,
    'Start your first course module'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_enrollment_next_action(UUID) TO authenticated;

COMMENT ON COLUMN public.enrollments.orientation_completed_at IS 'Timestamp when student completed mandatory orientation';
COMMENT ON COLUMN public.enrollments.documents_submitted_at IS 'Timestamp when student submitted required documents';
COMMENT ON COLUMN public.enrollments.confirmed_at IS 'Timestamp when enrollment was confirmed (post-payment)';

-- ============================================================
-- STORAGE BUCKET FOR ENROLLMENT DOCUMENTS
-- ============================================================

-- Create storage bucket for enrollment documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'enrollment-documents',
  'enrollment-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for enrollment-documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'enrollment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'enrollment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'enrollment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can access all enrollment documents"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'enrollment-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
-- Add Cosmetology Apprenticeship Program

-- First ensure slug column exists
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug if not exists
CREATE UNIQUE INDEX IF NOT EXISTS programs_slug_unique ON public.programs(slug) WHERE slug IS NOT NULL;

-- Insert Cosmetology Apprenticeship program
INSERT INTO public.programs (
  code,
  title,
  slug,
  description,
  duration_weeks,
  total_hours,
  tuition,
  total_cost,
  funding_eligible,
  status,
  category
)
VALUES (
  'COSMO-2024',
  'Cosmetology Apprenticeship',
  'cosmetology-apprenticeship',
  'State-licensed cosmetology apprenticeship program covering hair styling, coloring, skincare, nail care, and salon business management. Combines hands-on training with classroom instruction.',
  52,
  1500,
  2490.00,
  2490.00,
  true,
  'active',
  'Cosmetology'
) ON CONFLICT (code) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  total_cost = EXCLUDED.total_cost,
  status = EXCLUDED.status;

-- Also add Nail Tech program if referenced
INSERT INTO public.programs (
  code,
  title,
  slug,
  description,
  duration_weeks,
  total_hours,
  tuition,
  total_cost,
  funding_eligible,
  status,
  category
)
VALUES (
  'NAIL-2024',
  'Nail Technician Program',
  'nail-technician',
  'Professional nail technician training covering manicures, pedicures, nail art, acrylics, and salon sanitation.',
  16,
  450,
  2490.00,
  2490.00,
  true,
  'active',
  'Cosmetology'
) ON CONFLICT (code) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  total_cost = EXCLUDED.total_cost,
  status = EXCLUDED.status;

-- Update existing programs to have slugs if missing
UPDATE public.programs SET slug = 'barber-apprenticeship' WHERE code = 'BARBER-2024' AND slug IS NULL;
UPDATE public.programs SET slug = 'hvac-technician' WHERE code = 'HVAC-2024' AND slug IS NULL;
-- ============================================================
-- SEED: Test Enrollment Data
-- Creates one real enrollment for testing the student dashboard
-- Run this AFTER creating a test user via Supabase Auth
-- ============================================================

-- This migration creates sample data for testing.
-- It uses DO blocks to safely insert only if data doesn't exist.

DO $$
DECLARE
  v_program_id UUID;
  v_cohort_id UUID;
  v_test_user_id UUID;
BEGIN
  -- Get or create the barber program
  SELECT id INTO v_program_id 
  FROM public.programs 
  WHERE slug = 'barber-apprenticeship' 
  LIMIT 1;

  IF v_program_id IS NULL THEN
    INSERT INTO public.programs (
      slug, 
      title, 
      description, 
      code,
      duration_weeks,
      total_hours,
      tuition,
      funding_eligible,
      status,
      category
    ) VALUES (
      'barber-apprenticeship',
      'Barber Apprenticeship',
      'USDOL Registered Apprenticeship program for barber licensure. 1,500 hours of combined OJT and RTI.',
      'BARBER-APP',
      52,
      1500,
      4980.00,
      true,
      'active',
      'beauty'
    )
    RETURNING id INTO v_program_id;
  END IF;

  -- Get or create a cohort for the program
  SELECT id INTO v_cohort_id 
  FROM public.cohorts 
  WHERE program_id = v_program_id 
  AND status = 'active'
  LIMIT 1;

  IF v_cohort_id IS NULL THEN
    INSERT INTO public.cohorts (
      program_id,
      code,
      name,
      start_date,
      end_date,
      max_capacity,
      status,
      location
    ) VALUES (
      v_program_id,
      'BARBER-2026-01',
      'Barber Apprenticeship - January 2026',
      '2026-01-15',
      '2027-01-15',
      20,
      'active',
      'Indianapolis, IN'
    )
    RETURNING id INTO v_cohort_id;
  END IF;

  -- Note: To create a test enrollment, you need a real user ID from auth.users
  -- The enrollments table uses student_id (not user_id) and course_id
  -- program_id is added via ALTER TABLE in 001_barber_hvac_reference.sql
  --
  -- After creating a user via Supabase Auth UI or API, run:
  --
  -- INSERT INTO public.enrollments (student_id, program_id, cohort_id, status, progress)
  -- VALUES ('YOUR-USER-UUID-HERE', 'PROGRAM-UUID', 'COHORT-UUID', 'active', 0);

  RAISE NOTICE 'Seed data created. Program ID: %, Cohort ID: %', v_program_id, v_cohort_id;
END $$;

-- Create an announcement for testing
INSERT INTO public.announcements (title, content, is_active, created_at)
SELECT 
  'Welcome to the Spring 2026 Cohort!',
  'We are excited to welcome all new apprentices. Please complete your orientation within the first week.',
  true,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcements WHERE title = 'Welcome to the Spring 2026 Cohort!'
);

-- Add a second announcement
INSERT INTO public.announcements (title, content, is_active, created_at)
SELECT 
  'State Board Exam Prep Sessions Available',
  'Sign up for our free state board exam prep sessions. Limited spots available.',
  true,
  NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcements WHERE title = 'State Board Exam Prep Sessions Available'
);

COMMENT ON TABLE public.programs IS 'Training programs offered by Elevate';
COMMENT ON TABLE public.cohorts IS 'Groups of students enrolled in a program delivery';
COMMENT ON TABLE public.enrollments IS 'Student enrollments in programs/cohorts';
-- Migration: Soft Holds Schema Updates
-- Adds fields needed for proper enrollment state tracking and program availability
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ENROLLMENTS TABLE UPDATES
-- ============================================

-- Drop the old status constraint and add new one with more states
ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_status_check 
CHECK (status IN (
  'applied',                    -- Application submitted, no payment
  'enrolled_pending_approval',  -- Payment received, waiting for approval
  'active',                     -- Approved, full access granted
  'paused',                     -- Temporarily suspended (payment failed, compliance)
  'completed',                  -- Program finished
  'withdrawn',                  -- Student withdrew
  'cancelled',                  -- Admin cancelled
  'pending'                     -- Legacy: treat as 'applied'
));

-- Add new columns for enrollment tracking (one at a time for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'application_id') THEN
    ALTER TABLE public.enrollments ADD COLUMN application_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'program_slug') THEN
    ALTER TABLE public.enrollments ADD COLUMN program_slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_option') THEN
    ALTER TABLE public.enrollments ADD COLUMN payment_option TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'amount_paid') THEN
    ALTER TABLE public.enrollments ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'stripe_checkout_session_id') THEN
    ALTER TABLE public.enrollments ADD COLUMN stripe_checkout_session_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'approved_at') THEN
    ALTER TABLE public.enrollments ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'approved_by') THEN
    ALTER TABLE public.enrollments ADD COLUMN approved_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'paused_at') THEN
    ALTER TABLE public.enrollments ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'pause_reason') THEN
    ALTER TABLE public.enrollments ADD COLUMN pause_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'agreement_signed') THEN
    ALTER TABLE public.enrollments ADD COLUMN agreement_signed BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'agreement_signed_at') THEN
    ALTER TABLE public.enrollments ADD COLUMN agreement_signed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add constraint for payment_option
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_payment_option_check;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_payment_option_check 
  CHECK (payment_option IS NULL OR payment_option IN ('full', 'deposit', 'installment', 'funded', 'employer_paid'));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_application_id ON public.enrollments(application_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_slug ON public.enrollments(program_slug);

-- ============================================
-- 2. PROGRAMS TABLE UPDATES
-- ============================================

-- Add availability and funding cycle fields (one at a time for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'availability_status') THEN
    ALTER TABLE public.programs ADD COLUMN availability_status TEXT DEFAULT 'open';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'next_start_date') THEN
    ALTER TABLE public.programs ADD COLUMN next_start_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'enrollment_deadline') THEN
    ALTER TABLE public.programs ADD COLUMN enrollment_deadline DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'seats_available') THEN
    ALTER TABLE public.programs ADD COLUMN seats_available INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'total_seats') THEN
    ALTER TABLE public.programs ADD COLUMN total_seats INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'funding_cycle') THEN
    ALTER TABLE public.programs ADD COLUMN funding_cycle TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'funding_confirmed') THEN
    ALTER TABLE public.programs ADD COLUMN funding_confirmed BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'is_apprenticeship') THEN
    ALTER TABLE public.programs ADD COLUMN is_apprenticeship BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programs' AND column_name = 'requires_employer_match') THEN
    ALTER TABLE public.programs ADD COLUMN requires_employer_match BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add constraint for availability_status
ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_availability_status_check;
ALTER TABLE public.programs ADD CONSTRAINT programs_availability_status_check 
  CHECK (availability_status IS NULL OR availability_status IN ('open', 'waitlist', 'closed', 'funding_pending', 'coming_soon'));

-- Index for availability queries
CREATE INDEX IF NOT EXISTS idx_programs_availability ON public.programs(availability_status);
CREATE INDEX IF NOT EXISTS idx_programs_is_apprenticeship ON public.programs(is_apprenticeship);

-- ============================================
-- 3. APPLICATIONS TABLE UPDATES
-- ============================================

-- Ensure applications table has needed fields (one at a time for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'program_slug') THEN
    ALTER TABLE public.applications ADD COLUMN program_slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_received_at') THEN
    ALTER TABLE public.applications ADD COLUMN payment_received_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'eligibility_status') THEN
    ALTER TABLE public.applications ADD COLUMN eligibility_status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'eligibility_verified_at') THEN
    ALTER TABLE public.applications ADD COLUMN eligibility_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'eligibility_verified_by') THEN
    ALTER TABLE public.applications ADD COLUMN eligibility_verified_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'advisor_assigned') THEN
    ALTER TABLE public.applications ADD COLUMN advisor_assigned UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'advisor_notes') THEN
    ALTER TABLE public.applications ADD COLUMN advisor_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'next_step') THEN
    ALTER TABLE public.applications ADD COLUMN next_step TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'next_step_due_date') THEN
    ALTER TABLE public.applications ADD COLUMN next_step_due_date DATE;
  END IF;
END $$;

-- Add constraint for eligibility_status
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_eligibility_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_eligibility_status_check 
  CHECK (eligibility_status IS NULL OR eligibility_status IN ('pending', 'eligible', 'ineligible', 'review_needed'));

-- Index for application lookups
CREATE INDEX IF NOT EXISTS idx_applications_program_slug ON public.applications(program_slug);
CREATE INDEX IF NOT EXISTS idx_applications_eligibility_status ON public.applications(eligibility_status);

-- ============================================
-- 4. PAYMENT LOGS TABLE (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id),
  enrollment_id UUID REFERENCES public.enrollments(id),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_option TEXT,
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'checkout_started', 'completed', 'failed', 'refunded')),
  metadata JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_user ON public.payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe_session ON public.payment_logs(stripe_session_id);

-- ============================================
-- 5. UPDATE EXISTING DATA
-- ============================================

-- Mark apprenticeship programs
UPDATE public.programs 
SET is_apprenticeship = true, requires_employer_match = true
WHERE slug IN ('barber-apprenticeship', 'barber', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship')
  OR name ILIKE '%apprenticeship%';

-- Set default availability for active programs
UPDATE public.programs 
SET availability_status = 'open'
WHERE is_active = true AND availability_status IS NULL;

-- Migrate legacy 'pending' status to 'applied'
UPDATE public.enrollments 
SET status = 'applied' 
WHERE status = 'pending';

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Payment logs: users can see their own
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment logs" ON public.payment_logs;
CREATE POLICY "Users can view own payment logs" ON public.payment_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage payment logs" ON public.payment_logs;
CREATE POLICY "Service role can manage payment logs" ON public.payment_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 7. HELPER FUNCTION: Check enrollment access
-- ============================================

CREATE OR REPLACE FUNCTION public.check_enrollment_access(
  p_user_id UUID,
  p_program_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  can_access_portal BOOLEAN,
  can_track_hours BOOLEAN,
  can_access_milady BOOLEAN,
  enrollment_status TEXT,
  message TEXT
) AS $$
DECLARE
  v_enrollment RECORD;
BEGIN
  -- Get the most recent enrollment for this user/program
  SELECT e.status, e.agreement_signed
  INTO v_enrollment
  FROM public.enrollments e
  WHERE e.user_id = p_user_id
    AND (p_program_slug IS NULL OR e.program_slug = p_program_slug)
  ORDER BY e.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false, false, false, 
      NULL::TEXT, 
      'No enrollment found. Please apply first.'::TEXT;
    RETURN;
  END IF;

  CASE v_enrollment.status
    WHEN 'active' THEN
      RETURN QUERY SELECT 
        true, true, 
        COALESCE(v_enrollment.agreement_signed, false),
        v_enrollment.status,
        CASE WHEN v_enrollment.agreement_signed 
          THEN 'Full access granted.'
          ELSE 'Sign agreement to access training materials.'
        END;
    WHEN 'enrolled_pending_approval' THEN
      RETURN QUERY SELECT 
        false, false, false,
        v_enrollment.status,
        'Payment received. Waiting for approval and shop assignment.'::TEXT;
    WHEN 'applied' THEN
      RETURN QUERY SELECT 
        false, false, false,
        v_enrollment.status,
        'Application submitted. Complete payment to continue.'::TEXT;
    WHEN 'paused' THEN
      RETURN QUERY SELECT 
        false, false, false,
        v_enrollment.status,
        'Enrollment paused. Contact support to resolve.'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        false, false, false,
        v_enrollment.status,
        'Enrollment not active.'::TEXT;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.check_enrollment_access TO authenticated;

-- ============================================
-- DONE
-- ============================================
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
-- Add enrollment state machine columns to program_enrollments.
-- These columns are referenced by:
--   app/api/enrollment/documents/complete/route.ts
--   app/api/enrollment/orientation/complete/route.ts
--   app/enrollment/documents/page.tsx
--   app/enrollment/confirmed/page.tsx
--   app/enrollment/orientation/page.tsx
--   app/programs/barber-apprenticeship/*/layout.tsx
--   app/programs/nail-technician-apprenticeship/*/layout.tsx

BEGIN;

-- 1. State machine column
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_state text DEFAULT 'applied';

-- 2. Timestamp columns for each state transition
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS orientation_completed_at timestamptz;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS documents_completed_at timestamptz;

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS documents_submitted_at timestamptz;

-- 3. Next action hint for the frontend
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS next_required_action text;

-- 4. Backfill: set enrollment_state from existing status where possible
UPDATE public.program_enrollments
  SET enrollment_state = CASE
    WHEN status = 'ACTIVE' THEN 'active'
    WHEN status = 'active' THEN 'active'
    WHEN status = 'completed' THEN 'active'
    WHEN status = 'pending' THEN 'applied'
    WHEN status = 'confirmed' THEN 'confirmed'
    WHEN status = 'cancelled' THEN 'applied'
    ELSE 'applied'
  END
WHERE enrollment_state IS NULL OR enrollment_state = 'applied';

-- 5. Index for state queries
CREATE INDEX IF NOT EXISTS idx_program_enrollments_state
  ON public.program_enrollments (enrollment_state);

-- 6. Student UPDATE policy so the API routes can advance state
-- (The server-side createClient uses the user's JWT, so RLS applies)
DROP POLICY IF EXISTS "Students can update own program enrollments" ON public.program_enrollments;
CREATE POLICY "Students can update own program enrollments"
  ON public.program_enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
