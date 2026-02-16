-- ============================================================================
-- STRIPE WORKFLOW - FINAL FORM
-- ============================================================================
-- Stripe only fires when enrollment is finalized (status = 'enrolled')
-- Supports: Sponsored seats (default) and Student self-pay (rare)
-- No double charges, clean audit trail
-- ============================================================================

-- ============================================================================
-- STEP 1: ENROLLMENT DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'handbook_signature', 'background_check', 'wioa_eligibility', 'id_verification'
  status TEXT NOT NULL DEFAULT 'required' CHECK (status IN ('required', 'pending', 'submitted', 'approved', 'rejected', 'waived')),
  file_url TEXT,
  digital_signature TEXT,
  signed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_documents_enrollment ON enrollment_documents(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_documents_status ON enrollment_documents(status);
CREATE INDEX IF NOT EXISTS idx_enrollment_documents_type ON enrollment_documents(document_type);

COMMENT ON TABLE enrollment_documents IS 'Tracks required documents per enrollment (handbooks, signatures, background checks, etc.)';
COMMENT ON COLUMN enrollment_documents.digital_signature IS 'Digital signature for legally binding documents';
COMMENT ON COLUMN enrollment_documents.status IS 'required → pending → submitted → approved/rejected/waived';

-- Enable RLS
ALTER TABLE enrollment_documents ENABLE ROW LEVEL SECURITY;

-- Admins can manage all documents
DROP POLICY IF EXISTS "admins_manage_enrollment_documents" ON enrollment_documents;
CREATE POLICY "admins_manage_enrollment_documents"
  ON enrollment_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Students can view their own documents
DROP POLICY IF EXISTS "students_view_own_documents" ON enrollment_documents;
CREATE POLICY "students_view_own_documents"
  ON enrollment_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = enrollment_documents.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

-- Students can submit their own documents
DROP POLICY IF EXISTS "students_submit_own_documents" ON enrollment_documents;
CREATE POLICY "students_submit_own_documents"
  ON enrollment_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = enrollment_documents.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('submitted', 'pending')
  );

-- ============================================================================
-- STEP 2: ENROLLMENT EVENTS AUDIT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrollment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'state_change', 'document_submitted', 'payment_initiated', 'payment_completed', 'payment_failed'
  from_state TEXT,
  to_state TEXT,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  stripe_event_id TEXT,
  payment_amount_cents INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_events_enrollment ON enrollment_events(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_events_type ON enrollment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_enrollment_events_created ON enrollment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollment_events_stripe ON enrollment_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

COMMENT ON TABLE enrollment_events IS 'Immutable audit log of all enrollment lifecycle events';
COMMENT ON COLUMN enrollment_events.stripe_event_id IS 'Stripe event ID for idempotency';

-- Enable RLS
ALTER TABLE enrollment_events ENABLE ROW LEVEL SECURITY;

-- Admins can view all events
DROP POLICY IF EXISTS "admins_view_enrollment_events" ON enrollment_events;
CREATE POLICY "admins_view_enrollment_events"
  ON enrollment_events
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
-- STEP 3: STRIPE WEBHOOK EVENTS TABLE (IDEMPOTENCY)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  enrollment_id UUID REFERENCES enrollments(id),
  payment_intent_id TEXT,
  checkout_session_id TEXT,
  amount_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'processed', -- 'processed', 'failed', 'duplicate'
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_enrollment ON stripe_webhook_events(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created ON stripe_webhook_events(created_at DESC);

COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhooks for idempotency';
COMMENT ON COLUMN stripe_webhook_events.stripe_event_id IS 'Unique Stripe event ID - prevents duplicate processing';

-- Enable RLS
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Admins can view webhook events
DROP POLICY IF EXISTS "admins_view_stripe_events" ON stripe_webhook_events;
CREATE POLICY "admins_view_stripe_events"
  ON stripe_webhook_events
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
-- STEP 4: ADD PAYMENT FIELDS TO ENROLLMENTS
-- ============================================================================

-- Add payment_mode (lock this early)
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'sponsored' CHECK (payment_mode IN ('sponsored', 'self_pay'));
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_mode_locked_at TIMESTAMPTZ;

-- Add payment tracking fields
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded'));
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Ensure billing_lock exists (from previous migration)
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS billing_lock BOOLEAN DEFAULT FALSE;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS billing_lock_at TIMESTAMPTZ;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_mode ON enrollments(payment_mode);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status ON enrollments(payment_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_billing_lock ON enrollments(billing_lock) WHERE billing_lock = TRUE;
CREATE INDEX IF NOT EXISTS idx_enrollments_stripe_session ON enrollments(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;

COMMENT ON COLUMN enrollments.payment_mode IS 'sponsored (Elevate pays partner) or self_pay (student pays directly)';
COMMENT ON COLUMN enrollments.payment_mode_locked_at IS 'Once set, payment_mode cannot change';
COMMENT ON COLUMN enrollments.billing_lock IS 'Prevents double-charging. Set to TRUE when payment is initiated.';

-- ============================================================================
-- STEP 5: INITIATE STRIPE PAYMENT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION initiate_stripe_payment(
  p_enrollment_id UUID,
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
  -- Get enrollment with lock
  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Enrollment not found'
    );
  END IF;

  -- Check if already paid
  IF v_enrollment.payment_status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Enrollment already paid'
    );
  END IF;

  -- Check billing lock
  IF v_enrollment.billing_lock = TRUE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment already in progress',
      'locked_at', v_enrollment.billing_lock_at
    );
  END IF;

  -- Check enrollment status (must be 'enrolled')
  IF v_enrollment.status != 'enrolled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Enrollment must be in enrolled status',
      'current_status', v_enrollment.status
    );
  END IF;

  -- Lock payment mode if not already locked
  IF v_enrollment.payment_mode_locked_at IS NULL THEN
    UPDATE enrollments
    SET payment_mode_locked_at = NOW()
    WHERE id = p_enrollment_id;
  END IF;

  -- Set billing lock
  UPDATE enrollments
  SET 
    billing_lock = TRUE,
    billing_lock_at = NOW(),
    payment_status = 'processing',
    amount_cents = p_amount_cents,
    updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- Log event
  INSERT INTO enrollment_events (
    enrollment_id,
    event_type,
    from_state,
    to_state,
    actor_id,
    payment_amount_cents,
    metadata
  ) VALUES (
    p_enrollment_id,
    'payment_initiated',
    v_enrollment.payment_status,
    'processing',
    auth.uid(),
    p_amount_cents,
    jsonb_build_object(
      'payment_mode', v_enrollment.payment_mode,
      'amount_cents', p_amount_cents
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', p_enrollment_id,
    'payment_mode', v_enrollment.payment_mode,
    'amount_cents', p_amount_cents
  );
END;
$$;

COMMENT ON FUNCTION initiate_stripe_payment IS 'Initiates Stripe payment for enrollment. Sets billing_lock to prevent double charges.';

-- ============================================================================
-- STEP 6: COMPLETE STRIPE PAYMENT FUNCTION (WEBHOOK HANDLER)
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_stripe_payment(
  p_enrollment_id UUID,
  p_stripe_event_id TEXT,
  p_stripe_session_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_amount_cents INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment RECORD;
  v_already_processed BOOLEAN;
BEGIN
  -- Check if webhook already processed (idempotency)
  SELECT EXISTS (
    SELECT 1 FROM stripe_webhook_events
    WHERE stripe_event_id = p_stripe_event_id
  ) INTO v_already_processed;

  IF v_already_processed THEN
    -- Log duplicate webhook
    INSERT INTO stripe_webhook_events (
      stripe_event_id,
      event_type,
      enrollment_id,
      status,
      metadata
    ) VALUES (
      p_stripe_event_id,
      'checkout.session.completed',
      p_enrollment_id,
      'duplicate',
      jsonb_build_object('message', 'Webhook already processed')
    );

    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'message', 'Webhook already processed'
    );
  END IF;

  -- Get enrollment with lock
  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Log failed webhook
    INSERT INTO stripe_webhook_events (
      stripe_event_id,
      event_type,
      enrollment_id,
      status,
      error_message
    ) VALUES (
      p_stripe_event_id,
      'checkout.session.completed',
      p_enrollment_id,
      'failed',
      'Enrollment not found'
    );

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Enrollment not found'
    );
  END IF;

  -- Check if already paid
  IF v_enrollment.payment_status = 'paid' THEN
    -- Log duplicate payment attempt
    INSERT INTO stripe_webhook_events (
      stripe_event_id,
      event_type,
      enrollment_id,
      status,
      metadata
    ) VALUES (
      p_stripe_event_id,
      'checkout.session.completed',
      p_enrollment_id,
      'duplicate',
      jsonb_build_object('message', 'Enrollment already paid')
    );

    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'message', 'Enrollment already paid'
    );
  END IF;

  -- Update enrollment to paid
  UPDATE enrollments
  SET 
    payment_status = 'paid',
    status = 'active',
    stripe_checkout_session_id = p_stripe_session_id,
    stripe_payment_intent_id = p_stripe_payment_intent_id,
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- Log successful webhook
  INSERT INTO stripe_webhook_events (
    stripe_event_id,
    event_type,
    enrollment_id,
    checkout_session_id,
    payment_intent_id,
    amount_cents,
    status
  ) VALUES (
    p_stripe_event_id,
    'checkout.session.completed',
    p_enrollment_id,
    p_stripe_session_id,
    p_stripe_payment_intent_id,
    p_amount_cents,
    'processed'
  );

  -- Log enrollment event
  INSERT INTO enrollment_events (
    enrollment_id,
    event_type,
    from_state,
    to_state,
    stripe_event_id,
    payment_amount_cents,
    metadata
  ) VALUES (
    p_enrollment_id,
    'payment_completed',
    'processing',
    'paid',
    p_stripe_event_id,
    p_amount_cents,
    jsonb_build_object(
      'stripe_session_id', p_stripe_session_id,
      'stripe_payment_intent_id', p_stripe_payment_intent_id
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

COMMENT ON FUNCTION complete_stripe_payment IS 'Completes payment after Stripe webhook. Idempotent - safe to call multiple times.';

-- ============================================================================
-- STEP 7: FAIL STRIPE PAYMENT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION fail_stripe_payment(
  p_enrollment_id UUID,
  p_stripe_event_id TEXT,
  p_error_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment RECORD;
BEGIN
  -- Get enrollment with lock
  SELECT * INTO v_enrollment
  FROM enrollments
  WHERE id = p_enrollment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Enrollment not found'
    );
  END IF;

  -- Update enrollment to failed
  UPDATE enrollments
  SET 
    payment_status = 'failed',
    billing_lock = FALSE,
    billing_lock_at = NULL,
    updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- Log failed webhook
  INSERT INTO stripe_webhook_events (
    stripe_event_id,
    event_type,
    enrollment_id,
    status,
    error_message
  ) VALUES (
    p_stripe_event_id,
    'payment_intent.payment_failed',
    p_enrollment_id,
    'processed',
    p_error_message
  );

  -- Log enrollment event
  INSERT INTO enrollment_events (
    enrollment_id,
    event_type,
    from_state,
    to_state,
    stripe_event_id,
    metadata
  ) VALUES (
    p_enrollment_id,
    'payment_failed',
    'processing',
    'failed',
    p_stripe_event_id,
    jsonb_build_object('error', p_error_message)
  );

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', p_enrollment_id,
    'payment_status', 'failed'
  );
END;
$$;

COMMENT ON FUNCTION fail_stripe_payment IS 'Handles failed Stripe payment. Unlocks billing_lock for retry.';

-- ============================================================================
-- STEP 8: HELPER FUNCTION - CHECK IF DOCUMENTS COMPLETE
-- ============================================================================

CREATE OR REPLACE FUNCTION are_enrollment_documents_complete(p_enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_incomplete_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_incomplete_count
  FROM enrollment_documents
  WHERE enrollment_id = p_enrollment_id
  AND status NOT IN ('approved', 'waived');

  RETURN v_incomplete_count = 0;
END;
$$;

COMMENT ON FUNCTION are_enrollment_documents_complete IS 'Returns TRUE if all required documents are approved or waived';

-- ============================================================================
-- STEP 9: TRIGGER - AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_enrollment_documents_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_enrollment_documents_timestamp ON enrollment_documents;
CREATE TRIGGER trigger_update_enrollment_documents_timestamp
  BEFORE UPDATE ON enrollment_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_documents_timestamp();

-- ============================================================================
-- DONE
-- ============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION initiate_stripe_payment TO authenticated;
GRANT EXECUTE ON FUNCTION complete_stripe_payment TO service_role;
GRANT EXECUTE ON FUNCTION fail_stripe_payment TO service_role;
GRANT EXECUTE ON FUNCTION are_enrollment_documents_complete TO authenticated;
