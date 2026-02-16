-- ============================================================================
-- Migration: Fix Enrollment Dependencies
-- Date: 2026-01-19
-- Description: Ensures all required tables and functions exist for enrollment flow
-- ============================================================================

-- ============================================================================
-- 1. CREATE partner_course_enrollments TABLE IF NOT EXISTS
-- ============================================================================
-- Note: partner_enrollments already exists for partner organizations
-- This table is for student enrollments in partner courses (Coursera, LinkedIn, etc.)

CREATE TABLE IF NOT EXISTS public.partner_course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  partner_course_id UUID,
  partner_id UUID,
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percent INTEGER DEFAULT 0,
  funding_source TEXT,
  external_enrollment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_course_enrollments_user ON public.partner_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_course_enrollments_course ON public.partner_course_enrollments(partner_course_id);
CREATE INDEX IF NOT EXISTS idx_partner_course_enrollments_status ON public.partner_course_enrollments(status);

-- Enable RLS
ALTER TABLE public.partner_course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_partner_course_enrollments" ON public.partner_course_enrollments;
CREATE POLICY "users_own_partner_course_enrollments" ON public.partner_course_enrollments
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "service_role_all_partner_course_enrollments" ON public.partner_course_enrollments;
CREATE POLICY "service_role_all_partner_course_enrollments" ON public.partner_course_enrollments
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- 2. CREATE OR REPLACE complete_enrollment_payment FUNCTION
-- ============================================================================

-- Drop existing versions with different signatures
DROP FUNCTION IF EXISTS complete_enrollment_payment(UUID, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS complete_enrollment_payment(UUID, TEXT, TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION complete_enrollment_payment(
  p_enrollment_id UUID,
  p_stripe_event_id TEXT DEFAULT NULL,
  p_stripe_session_id TEXT DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_amount_cents INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_found BOOLEAN := false;
  v_table_name TEXT;
  v_current_status TEXT;
  v_has_payment_status BOOLEAN;
  v_has_stripe_payment_id BOOLEAN;
BEGIN
  -- Try to find and update in program_enrollments first
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_enrollments' AND table_schema = 'public') THEN
    SELECT status INTO v_current_status
    FROM public.program_enrollments
    WHERE id = p_enrollment_id;
    
    IF FOUND THEN
      v_found := true;
      v_table_name := 'program_enrollments';
      
      -- Check if already active (idempotent)
      IF v_current_status IN ('active', 'ACTIVE', 'IN_PROGRESS', 'paid') THEN
        RETURN jsonb_build_object(
          'success', true,
          'duplicate', true,
          'message', 'Already active/paid',
          'enrollment_id', p_enrollment_id
        );
      END IF;
      
      -- Update status
      UPDATE public.program_enrollments
      SET status = 'IN_PROGRESS'
      WHERE id = p_enrollment_id;
    END IF;
  END IF;

  -- If not found, try enrollments table
  IF NOT v_found AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments' AND table_schema = 'public') THEN
    SELECT status INTO v_current_status
    FROM public.enrollments
    WHERE id = p_enrollment_id;
    
    IF FOUND THEN
      v_found := true;
      v_table_name := 'enrollments';
      
      -- Check if already active (idempotent)
      IF v_current_status IN ('active', 'ACTIVE', 'paid', 'completed') THEN
        RETURN jsonb_build_object(
          'success', true,
          'duplicate', true,
          'message', 'Already active/paid',
          'enrollment_id', p_enrollment_id
        );
      END IF;
      
      -- Check which columns exist
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'payment_status' AND table_schema = 'public'
      ) INTO v_has_payment_status;
      
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'stripe_payment_id' AND table_schema = 'public'
      ) INTO v_has_stripe_payment_id;
      
      -- Update based on available columns
      IF v_has_payment_status AND v_has_stripe_payment_id THEN
        UPDATE public.enrollments
        SET status = 'active', payment_status = 'paid', stripe_payment_id = p_stripe_payment_intent_id
        WHERE id = p_enrollment_id;
      ELSIF v_has_payment_status THEN
        UPDATE public.enrollments
        SET status = 'active', payment_status = 'paid'
        WHERE id = p_enrollment_id;
      ELSE
        UPDATE public.enrollments
        SET status = 'active'
        WHERE id = p_enrollment_id;
      END IF;
    END IF;
  END IF;

  IF NOT v_found THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Enrollment not found',
      'enrollment_id', p_enrollment_id
    );
  END IF;

  -- Log the payment event (only if stripe_webhook_events exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_webhook_events' AND table_schema = 'public') THEN
    INSERT INTO public.stripe_webhook_events (
      stripe_event_id,
      event_type,
      status,
      metadata,
      processed_at
    ) VALUES (
      COALESCE(p_stripe_event_id, 'manual-' || gen_random_uuid()::text),
      'enrollment_payment_completed',
      'processed',
      jsonb_build_object(
        'enrollment_id', p_enrollment_id,
        'session_id', p_stripe_session_id,
        'payment_intent_id', p_stripe_payment_intent_id,
        'amount_cents', p_amount_cents
      ),
      NOW()
    ) ON CONFLICT (stripe_event_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', p_enrollment_id,
    'table', v_table_name,
    'status', CASE WHEN v_table_name = 'program_enrollments' THEN 'IN_PROGRESS' ELSE 'active' END
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'enrollment_id', p_enrollment_id
  );
END;
$$;

COMMENT ON FUNCTION complete_enrollment_payment IS 'Marks enrollment as paid/active. Called by Stripe webhook. Idempotent.';

-- ============================================================================
-- 3. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.partner_course_enrollments TO authenticated;
GRANT ALL ON public.partner_course_enrollments TO service_role;
GRANT EXECUTE ON FUNCTION complete_enrollment_payment TO authenticated, anon, service_role;
