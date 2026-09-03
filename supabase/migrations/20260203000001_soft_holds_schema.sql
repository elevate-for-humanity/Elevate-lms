-- Migration: Soft Holds Schema Updates
-- Adds fields needed for proper enrollment state tracking and program availability
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ENROLLMENTS TABLE UPDATES
-- ============================================

-- Drop the old status constraint and add new one with more states
ALTER TABLE public.training_enrollments 
DROP CONSTRAINT IF EXISTS training_enrollments_status_check;

ALTER TABLE public.training_enrollments 
ADD CONSTRAINT training_enrollments_status_check 
CHECK (status IN (
  'applied',
  'enrolled_pending_approval',
  'active',
  'in_progress',
  'paused',
  'completed',
  'withdrawn',
  'cancelled',
  'suspended',
  'approved',
  'paid',
  'confirmed',
  'orientation_complete',
  'documents_complete',
  'pending'
));

-- Add new columns for enrollment tracking (one at a time for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'application_id') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN application_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'program_slug') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN program_slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'payment_option') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN payment_option TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'amount_paid') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'stripe_checkout_session_id') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN stripe_checkout_session_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'approved_at') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'approved_by') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN approved_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'paused_at') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'pause_reason') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN pause_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'agreement_signed') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN agreement_signed BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_enrollments' AND column_name = 'agreement_signed_at') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN agreement_signed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add constraint for payment_option
ALTER TABLE public.training_enrollments DROP CONSTRAINT IF EXISTS enrollments_payment_option_check;
ALTER TABLE public.training_enrollments ADD CONSTRAINT enrollments_payment_option_check 
  CHECK (payment_option IS NULL OR payment_option IN ('full', 'deposit', 'installment', 'funded', 'employer_paid'));

-- Index for faster lookups
ALTER TABLE public.training_enrollments ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.training_enrollments(status);
ALTER TABLE public.training_enrollments ADD COLUMN IF NOT EXISTS application_id UUID;
CREATE INDEX IF NOT EXISTS idx_enrollments_application_id ON public.training_enrollments(application_id);
ALTER TABLE public.training_enrollments ADD COLUMN IF NOT EXISTS program_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_enrollments_program_slug ON public.training_enrollments(program_slug);

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
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS availability_status TEXT;
CREATE INDEX IF NOT EXISTS idx_programs_availability ON public.programs(availability_status);
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS is_apprenticeship TEXT;
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
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS program_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_applications_program_slug ON public.applications(program_slug);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS eligibility_status TEXT;
CREATE INDEX IF NOT EXISTS idx_applications_eligibility_status ON public.applications(eligibility_status);

-- ============================================
-- 4. PAYMENT LOGS TABLE (NEW)
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id),
  enrollment_id UUID REFERENCES public.training_enrollments(id),
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

ALTER TABLE public.payment_logs ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_payment_logs_user ON public.payment_logs(user_id);
ALTER TABLE public.payment_logs ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
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
UPDATE public.training_enrollments 
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
  FROM public.training_enrollments e
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
