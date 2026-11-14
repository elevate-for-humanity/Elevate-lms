-- Notification Outbox Table
-- Implements outbox pattern for reliable transactional email delivery
-- Supports no-login token links for document re-upload and enrollment continuation

-- Create enum for notification status
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for notification channel
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('email', 'sms');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create notification_outbox table
CREATE TABLE IF NOT EXISTS notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient info
  to_email TEXT,
  to_phone TEXT,
  channel notification_channel DEFAULT 'email',
  
  -- Template info
  template_key TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  
  -- Status tracking
  status notification_status DEFAULT 'queued',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  
  -- Reference to related entity (optional)
  entity_type TEXT,
  entity_id UUID
  
  -- Constraints
  CONSTRAINT valid_recipient CHECK (
    (channel = 'email' AND to_email IS NOT NULL) OR
    (channel = 'sms' AND to_phone IS NOT NULL)
  )
);

-- Create indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_scheduled 
  ON notification_outbox (status, scheduled_for) 
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_notification_outbox_entity 
  ON notification_outbox (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_created 
  ON notification_outbox (created_at DESC);

-- Create notification_tokens table for no-login links
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Token value (hashed for security)
  token TEXT UNIQUE NOT NULL,
  
  -- Purpose and target
  purpose TEXT NOT NULL, -- 'reupload', 'continue_enrollment', 'transfer_submission'
  target_url TEXT NOT NULL,
  
  -- Owner info
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  
  -- Usage limits
  max_uses INT DEFAULT 5,
  use_count INT DEFAULT 0,
  
  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Create indexes for token lookup (no NOW() in partial index — not immutable)
CREATE INDEX IF NOT EXISTS idx_notification_tokens_token 
  ON notification_tokens (token) 
  WHERE use_count < max_uses;

CREATE INDEX IF NOT EXISTS idx_notification_tokens_user 
  ON notification_tokens (user_id);

-- Enable RLS
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_outbox (admin only)
DROP POLICY IF EXISTS "Admins can view all notifications" ON notification_outbox;
CREATE POLICY "Admins can view all notifications" ON notification_outbox
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Service role can manage notifications" ON notification_outbox;
CREATE POLICY "Service role can manage notifications" ON notification_outbox
  FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for notification_tokens
DROP POLICY IF EXISTS "Users can view own tokens" ON notification_tokens;
CREATE POLICY "Users can view own tokens" ON notification_tokens
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage tokens" ON notification_tokens;
CREATE POLICY "Service role can manage tokens" ON notification_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Function to enqueue a notification
CREATE OR REPLACE FUNCTION enqueue_notification(
  p_to_email TEXT,
  p_template_key TEXT,
  p_template_data JSONB DEFAULT '{}',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notification_outbox (
    to_email,
    template_key,
    template_data,
    entity_type,
    entity_id,
    scheduled_for
  ) VALUES (
    p_to_email,
    p_template_key,
    p_template_data,
    p_entity_type,
    p_entity_id,
    p_scheduled_for
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to generate a notification token
CREATE OR REPLACE FUNCTION generate_notification_token(
  p_purpose TEXT,
  p_target_url TEXT,
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_expires_days INT DEFAULT 7,
  p_max_uses INT DEFAULT 5,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'base64');
  -- Make URL-safe
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
  
  INSERT INTO notification_tokens (
    token,
    purpose,
    target_url,
    user_id,
    email,
    max_uses,
    expires_at,
    metadata
  ) VALUES (
    v_token,
    p_purpose,
    p_target_url,
    p_user_id,
    p_email,
    p_max_uses,
    NOW() + (p_expires_days || ' days')::INTERVAL,
    p_metadata
  );
  
  RETURN v_token;
END;
$$;

-- Function to validate and use a token
CREATE OR REPLACE FUNCTION use_notification_token(p_token TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  target_url TEXT,
  purpose TEXT,
  user_id UUID,
  email TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_record notification_tokens%ROWTYPE;
BEGIN
  -- Find and lock the token
  SELECT * INTO v_token_record
  FROM notification_tokens t
  WHERE t.token = p_token
  FOR UPDATE;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check if max uses exceeded
  IF v_token_record.use_count >= v_token_record.max_uses THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Increment use count
  UPDATE notification_tokens
  SET use_count = use_count + 1, last_used_at = NOW()
  WHERE id = v_token_record.id;
  
  -- Return token data
  RETURN QUERY SELECT 
    true,
    v_token_record.target_url,
    v_token_record.purpose,
    v_token_record.user_id,
    v_token_record.email,
    v_token_record.metadata;
END;
$$;

-- Add comment
COMMENT ON TABLE notification_outbox IS 'Outbox pattern for reliable transactional email/SMS delivery';
COMMENT ON TABLE notification_tokens IS 'Tokens for no-login links in notification emails';
