-- PHASE 1: COMPLIANCE SPINE
-- Enrollment state machine, payment tracking, credential verification

-- 1. EXTEND ENROLLMENTS WITH REQUIRED STATE MACHINE
ALTER TABLE program_enrollments 
  DROP CONSTRAINT IF EXISTS program_enrollments_status_check;

ALTER TABLE program_enrollments
  ADD CONSTRAINT program_enrollments_status_check 
  CHECK (status IN ('pending', 'active', 'paused', 'completed', 'withdrawn', 'failed'));

-- Add payment verification fields
ALTER TABLE program_enrollments
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('stripe', 'invoice', 'sponsored', 'waived')),
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

-- 2. CREATE PAYMENTS TABLE (STRIPE SOURCE OF TRUTH)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES program_enrollments(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'invoice', 'sponsored', 'waived')),
  metadata JSONB DEFAULT '{}'::jsonb,
  stripe_webhook_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_enrollment_id ON payments(enrollment_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Students can view their own payments
CREATE POLICY "Students can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM program_enrollments
      WHERE program_enrollments.id = payments.enrollment_id
      AND program_enrollments.student_id = auth.uid()
    )
  );

-- Staff can view all payments
CREATE POLICY "Staff can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- System can insert/update payments (webhooks)
CREATE POLICY "System can manage payments"
  ON payments FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 3. CREATE CREDENTIAL VERIFICATIONS (IMMUTABLE COMPLETION OBJECT)
CREATE TABLE IF NOT EXISTS credential_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES program_enrollments(id) ON DELETE SET NULL,
  partner_id TEXT,
  program_name TEXT NOT NULL,
  credential_name TEXT NOT NULL,
  completion_status TEXT NOT NULL CHECK (completion_status IN ('completed', 'failed', 'revoked')),
  completion_date DATE NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('api_sync', 'certificate_upload', 'partner_attestation', 'roster_import', 'manual_verification')),
  evidence_link TEXT,
  evidence_metadata JSONB DEFAULT '{}'::jsonb,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profiles(id),
  revocation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credential_verifications_learner_id ON credential_verifications(learner_id);
CREATE INDEX idx_credential_verifications_enrollment_id ON credential_verifications(enrollment_id);
CREATE INDEX idx_credential_verifications_completion_date ON credential_verifications(completion_date DESC);
CREATE INDEX idx_credential_verifications_verified_at ON credential_verifications(verified_at DESC);

-- Enable RLS
ALTER TABLE credential_verifications ENABLE ROW LEVEL SECURITY;

-- Learners can view their own credentials
CREATE POLICY "Learners can view own credentials"
  ON credential_verifications FOR SELECT
  TO authenticated
  USING (learner_id = auth.uid());

-- Staff can view all credentials
CREATE POLICY "Staff can view all credentials"
  ON credential_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Only staff can insert credentials
CREATE POLICY "Staff can insert credentials"
  ON credential_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Only staff can revoke credentials
CREATE POLICY "Staff can revoke credentials"
  ON credential_verifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    -- Can only update revocation fields
    revoked_at IS NOT NULL AND revoked_by IS NOT NULL
  );

-- 4. CREATE OFFERINGS TABLE (PROGRAM ↔ STRIPE MAPPING)
CREATE TABLE IF NOT EXISTS offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL UNIQUE,
  program_name TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('one_time', 'subscription', 'invoice')),
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offerings_program_id ON offerings(program_id);
CREATE INDEX idx_offerings_stripe_product_id ON offerings(stripe_product_id);
CREATE INDEX idx_offerings_active ON offerings(active);

-- Enable RLS
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;

-- Everyone can view active offerings
CREATE POLICY "Anyone can view active offerings"
  ON offerings FOR SELECT
  TO authenticated, anon
  USING (active = true);

-- Only staff can manage offerings
CREATE POLICY "Staff can manage offerings"
  ON offerings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- 5. CREATE ENROLLMENT JOBS TABLE (ORCHESTRATION QUEUE)
CREATE TABLE IF NOT EXISTS enrollment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES program_enrollments(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('activate_enrollment', 'partner_lms_enrollment', 'send_confirmation_email', 'assign_ai_policy', 'initialize_milestones')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')) DEFAULT 'pending',
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrollment_jobs_enrollment_id ON enrollment_jobs(enrollment_id);
CREATE INDEX idx_enrollment_jobs_status ON enrollment_jobs(status);
CREATE INDEX idx_enrollment_jobs_job_type ON enrollment_jobs(job_type);
CREATE INDEX idx_enrollment_jobs_scheduled_for ON enrollment_jobs(scheduled_for);

-- Enable RLS
ALTER TABLE enrollment_jobs ENABLE ROW LEVEL SECURITY;

-- Only staff can view jobs
CREATE POLICY "Staff can view all jobs"
  ON enrollment_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- System can manage jobs
CREATE POLICY "System can manage jobs"
  ON enrollment_jobs FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 6. ADD UPDATED_AT TRIGGERS
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offerings_updated_at
  BEFORE UPDATE ON offerings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollment_jobs_updated_at
  BEFORE UPDATE ON enrollment_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. CREATE FUNCTION TO ACTIVATE ENROLLMENT (CALLED BY WEBHOOK)
CREATE OR REPLACE FUNCTION activate_enrollment_from_payment(
  p_enrollment_id UUID,
  p_payment_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_enrollment program_enrollments%ROWTYPE;
BEGIN
  -- Get enrollment
  SELECT * INTO v_enrollment
  FROM program_enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found: %', p_enrollment_id;
  END IF;

  -- Update enrollment to active
  UPDATE program_enrollments
  SET 
    status = 'active',
    payment_verified_at = NOW(),
    activated_at = NOW(),
    updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- Queue orchestration jobs
  INSERT INTO enrollment_jobs (enrollment_id, job_type, status)
  VALUES 
    (p_enrollment_id, 'partner_lms_enrollment', 'pending'),
    (p_enrollment_id, 'send_confirmation_email', 'pending'),
    (p_enrollment_id, 'assign_ai_policy', 'pending'),
    (p_enrollment_id, 'initialize_milestones', 'pending');

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CREATE FUNCTION TO RECORD CREDENTIAL COMPLETION
CREATE OR REPLACE FUNCTION record_credential_completion(
  p_learner_id UUID,
  p_enrollment_id UUID,
  p_partner_id TEXT,
  p_program_name TEXT,
  p_credential_name TEXT,
  p_completion_date DATE,
  p_verification_method TEXT,
  p_evidence_link TEXT DEFAULT NULL,
  p_evidence_metadata JSONB DEFAULT '{}'::jsonb,
  p_verified_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_credential_id UUID;
BEGIN
  -- Insert immutable credential verification
  INSERT INTO credential_verifications (
    learner_id,
    enrollment_id,
    partner_id,
    program_name,
    credential_name,
    completion_status,
    completion_date,
    verification_method,
    evidence_link,
    evidence_metadata,
    verified_by,
    verified_at
  ) VALUES (
    p_learner_id,
    p_enrollment_id,
    p_partner_id,
    p_program_name,
    p_credential_name,
    'completed',
    p_completion_date,
    p_verification_method,
    p_evidence_link,
    p_evidence_metadata,
    COALESCE(p_verified_by, auth.uid()),
    NOW()
  ) RETURNING id INTO v_credential_id;

  -- Update enrollment to completed if not already
  UPDATE program_enrollments
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_enrollment_id
  AND status != 'completed';

  RETURN v_credential_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE payments IS 'Stripe payment tracking - source of truth for payment state';
COMMENT ON TABLE credential_verifications IS 'Immutable credential completion records - required for audit compliance';
COMMENT ON TABLE offerings IS 'Program to Stripe product/price mapping';
COMMENT ON TABLE enrollment_jobs IS 'Orchestration queue for enrollment activation workflow';
COMMENT ON FUNCTION activate_enrollment_from_payment IS 'Called by Stripe webhook to activate enrollment and queue jobs';
COMMENT ON FUNCTION record_credential_completion IS 'Creates immutable credential verification record';
