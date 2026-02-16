-- Auto-Enrollment Schema Changes
-- Phase 2: Automatic Enrollment + Program Holder Alerts

-- 1. Add program_holder_id to program_enrollments
ALTER TABLE program_enrollments 
ADD COLUMN IF NOT EXISTS program_holder_id UUID REFERENCES program_holders(id);

CREATE INDEX IF NOT EXISTS idx_program_enrollments_program_holder 
ON program_enrollments(program_holder_id);

-- 2. Fix notifications table schema (add missing columns that code expects)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_label TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_notifications_idempotency 
ON notifications(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 3. Create notification_preferences table for program holders
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID NOT NULL REFERENCES program_holders(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  phone_e164 TEXT,
  sms_consent BOOLEAN DEFAULT FALSE,
  sms_consent_at TIMESTAMPTZ,
  sms_opt_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_program_holder 
ON notification_preferences(program_holder_id);

-- 4. Create delivery_logs table for email/SMS audit trail
CREATE TABLE IF NOT EXISTS delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_notification 
ON delivery_logs(notification_id);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_status 
ON delivery_logs(status);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_created 
ON delivery_logs(created_at DESC);

-- 5. Update generate_enrollment_steps() to work with program_enrollments
CREATE OR REPLACE FUNCTION generate_enrollment_steps(p_enrollment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_program_id_text TEXT;
  v_program_id_uuid UUID;
BEGIN
  -- Get program_id from program_enrollments (it's TEXT, likely a slug)
  SELECT program_id INTO v_program_id_text
  FROM program_enrollments
  WHERE id = p_enrollment_id;

  IF v_program_id_text IS NULL THEN
    RAISE EXCEPTION 'Enrollment % not found', p_enrollment_id;
  END IF;

  -- Look up the actual program UUID by slug
  SELECT id INTO v_program_id_uuid
  FROM programs
  WHERE slug = v_program_id_text;

  IF v_program_id_uuid IS NULL THEN
    RAISE EXCEPTION 'Program with slug % not found', v_program_id_text;
  END IF;

  -- Insert steps from program_partner_lms
  INSERT INTO enrollment_steps (
    enrollment_id,
    provider_id,
    sequence_order,
    status
  )
  SELECT 
    p_enrollment_id,
    ppl.provider_id,
    ppl.sequence_order,
    'pending'
  FROM program_partner_lms ppl
  WHERE ppl.program_id = v_program_id_uuid
  AND ppl.is_required = true
  ORDER BY ppl.sequence_order
  ON CONFLICT (enrollment_id, provider_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Mark first step as in_progress
  UPDATE enrollment_steps
  SET 
    status = 'in_progress',
    started_at = NOW()
  WHERE enrollment_id = p_enrollment_id
  AND sequence_order = (
    SELECT MIN(sequence_order) 
    FROM enrollment_steps 
    WHERE enrollment_id = p_enrollment_id
  )
  AND status = 'pending';
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_enrollment_steps(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION generate_enrollment_steps IS 'Generate enrollment steps from program_partner_lms blueprint. Updated to work with program_enrollments table where program_id is TEXT (slug).';

-- 6. RLS policies for new tables
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- Program holders can view/update their own preferences
CREATE POLICY "Program holders can manage own preferences"
ON notification_preferences FOR ALL
USING (
  program_holder_id IN (
    SELECT id FROM program_holders WHERE user_id = auth.uid()
  )
);

-- Admins can view all preferences
CREATE POLICY "Admins can view all preferences"
ON notification_preferences FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Admins and program holders can view delivery logs for their notifications
CREATE POLICY "Program holders can view own delivery logs"
ON delivery_logs FOR SELECT
USING (
  notification_id IN (
    SELECT n.id FROM notifications n
    JOIN program_holders ph ON ph.user_id = n.user_id
    WHERE ph.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all delivery logs"
ON delivery_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Service role can insert delivery logs
CREATE POLICY "Service role can insert delivery logs"
ON delivery_logs FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

COMMENT ON TABLE notification_preferences IS 'Program holder notification channel preferences (email/SMS)';
COMMENT ON TABLE delivery_logs IS 'Audit trail for all notification deliveries (email/SMS/in-app)';
