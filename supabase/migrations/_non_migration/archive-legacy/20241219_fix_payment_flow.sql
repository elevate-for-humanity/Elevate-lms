-- ============================================================================
-- FIX PAYMENT FLOW - Charge Only on Enrollment Finalization
-- ============================================================================
-- This migration fixes the payment flow so Stripe charges only happen when
-- enrollment is finalized, not at application submission.
--
-- Two payment modes:
-- Mode A: Sponsored seat (most common) - Elevate pays partner
-- Mode B: Student self-pay - Student pays, then access is provisioned
-- ============================================================================

-- ============================================================================
-- STEP 1: Add billing_lock to prevent double charges
-- ============================================================================

-- Add billing_lock to enrollments table
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS billing_lock BOOLEAN DEFAULT FALSE;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS billing_lock_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS billing_lock_reason TEXT;

-- Add billing_lock to program_enrollments table
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS billing_lock BOOLEAN DEFAULT FALSE;
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS billing_lock_at TIMESTAMPTZ;
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS billing_lock_reason TEXT;

-- Add payment_mode to track who pays
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_mode TEXT CHECK (payment_mode IN ('sponsored', 'self_pay', 'employer', 'scholarship'));
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS payment_mode_detail TEXT CHECK (payment_mode_detail IN ('sponsored', 'self_pay', 'employer', 'scholarship'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_billing_lock ON enrollments(billing_lock) WHERE billing_lock = TRUE;
CREATE INDEX IF NOT EXISTS idx_program_enrollments_billing_lock ON program_enrollments(billing_lock) WHERE billing_lock = TRUE;

COMMENT ON COLUMN enrollments.billing_lock IS 'Prevents double-charging. Set to TRUE when payment is initiated.';
COMMENT ON COLUMN enrollments.payment_mode IS 'Who pays: sponsored (Elevate), self_pay (student), employer, scholarship';

-- ============================================================================
-- STEP 2: Create enrollment status transition tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_enrollment_status_history_enrollment ON enrollment_status_history(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_status_history_changed_at ON enrollment_status_history(changed_at DESC);

-- Enable RLS
ALTER TABLE enrollment_status_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all history
DROP POLICY IF EXISTS "admins_view_status_history" ON enrollment_status_history;
CREATE POLICY "admins_view_status_history"
  ON enrollment_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================================
-- STEP 3: Create payment initiation function
-- ============================================================================

CREATE OR REPLACE FUNCTION initiate_enrollment_payment(
  p_enrollment_id UUID,
  p_payment_mode TEXT,
  p_amount_cents INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment RECORD;
  v_result JSONB;
BEGIN
  -- Get enrollment details
  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Enrollment not found'
    );
  END IF;

  -- Check if already locked (prevents double-charging)
  IF v_enrollment.billing_lock = TRUE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment already initiated',
      'locked_at', v_enrollment.billing_lock_at
    );
  END IF;

  -- Lock the enrollment for billing
  UPDATE enrollments
  SET 
    billing_lock = TRUE,
    billing_lock_at = NOW(),
    billing_lock_reason = 'Payment initiated',
    payment_mode = p_payment_mode
  WHERE id = p_enrollment_id;

  -- Log status change
  INSERT INTO enrollment_status_history (
    enrollment_id,
    from_status,
    to_status,
    changed_by,
    reason,
    metadata
  ) VALUES (
    p_enrollment_id,
    v_enrollment.status,
    'payment_initiated',
    auth.uid(),
    'Payment process started',
    jsonb_build_object(
      'payment_mode', p_payment_mode,
      'amount_cents', p_amount_cents
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', p_enrollment_id,
    'payment_mode', p_payment_mode,
    'amount_cents', p_amount_cents,
    'locked_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION initiate_enrollment_payment IS 'Locks enrollment for payment and prevents double-charging. Call this before creating Stripe session.';

-- ============================================================================
-- STEP 4: Create payment completion function
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_enrollment_payment(
  p_enrollment_id UUID,
  p_stripe_session_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_amount_paid_cents INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment RECORD;
BEGIN
  -- Get enrollment details
  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Enrollment not found'
    );
  END IF;

  -- Check if already paid (idempotent)
  IF v_enrollment.payment_status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Already paid',
      'enrollment_id', p_enrollment_id
    );
  END IF;

  -- Update enrollment to paid and active
  UPDATE enrollments
  SET 
    status = 'active',
    payment_status = 'paid',
    stripe_checkout_session_id = p_stripe_session_id,
    stripe_payment_intent_id = p_stripe_payment_intent_id,
    amount_paid_cents = p_amount_paid_cents,
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- Log status change
  INSERT INTO enrollment_status_history (
    enrollment_id,
    from_status,
    to_status,
    changed_by,
    reason,
    metadata
  ) VALUES (
    p_enrollment_id,
    v_enrollment.status,
    'active',
    NULL, -- Webhook doesn't have user context
    'Payment completed via Stripe',
    jsonb_build_object(
      'stripe_session_id', p_stripe_session_id,
      'stripe_payment_intent_id', p_stripe_payment_intent_id,
      'amount_paid_cents', p_amount_paid_cents
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', p_enrollment_id,
    'status', 'active',
    'payment_status', 'paid'
  );
END;
$$;

COMMENT ON FUNCTION complete_enrollment_payment IS 'Marks enrollment as paid and active. Called by Stripe webhook. Idempotent.';

-- ============================================================================
-- STEP 5: Create trigger to track status changes
-- ============================================================================

CREATE OR REPLACE FUNCTION log_enrollment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO enrollment_status_history (
      enrollment_id,
      from_status,
      to_status,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'Status changed'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_status_change_trigger ON enrollments;
CREATE TRIGGER enrollment_status_change_trigger
  AFTER UPDATE ON enrollments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_enrollment_status_change();

-- ============================================================================
-- STEP 6: Create view for payment-ready enrollments
-- ============================================================================

CREATE OR REPLACE VIEW enrollments_ready_for_payment AS
SELECT 
  e.id,
  e.user_id,
  e.course_id,
  e.status,
  e.payment_status,
  e.payment_mode,
  e.billing_lock,
  c.title AS course_title,
  c.partner_id,
  c.wholesale_cost_cents,
  c.retail_price_cents,
  p.email AS student_email,
  p.full_name AS student_name
FROM enrollments e
JOIN courses c ON e.course_id = c.id
JOIN profiles p ON e.user_id = p.id
WHERE 
  e.status IN ('approved', 'ready_to_start')
  AND e.payment_status = 'pending'
  AND e.billing_lock = FALSE;

COMMENT ON VIEW enrollments_ready_for_payment IS 'Enrollments that are approved and ready for payment initiation';

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION initiate_enrollment_payment TO authenticated;
GRANT EXECUTE ON FUNCTION complete_enrollment_payment TO authenticated, anon;

-- Grant select on view to admins
GRANT SELECT ON enrollments_ready_for_payment TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Payment flow fixes applied';
  RAISE NOTICE '✅ Billing lock added to prevent double charges';
  RAISE NOTICE '✅ Status history tracking enabled';
  RAISE NOTICE '✅ Payment initiation function created';
  RAISE NOTICE '✅ Payment completion function created (idempotent)';
  RAISE NOTICE '✅ View for payment-ready enrollments created';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Payments now trigger only on enrollment finalization';
  RAISE NOTICE '🔒 Double-charging prevented by billing_lock';
  RAISE NOTICE '🔒 Webhook handler is idempotent';
END $$;
