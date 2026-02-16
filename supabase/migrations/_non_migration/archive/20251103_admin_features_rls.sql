-- RLS Policies for Admin Features
-- Copyright (c) 2025 Elevate for Humanity

-- Enable RLS on all tables
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin/owner
CREATE OR REPLACE FUNCTION is_org_admin(check_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = check_org_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Email Queue Policies
CREATE POLICY "Service role can manage email queue"
  ON email_queue FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view email queue"
  ON email_queue FOR SELECT
  USING (is_org_admin(org_id));

-- Email Logs Policies
CREATE POLICY "Service role can manage email logs"
  ON email_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  USING (is_org_admin(org_id));

-- Webhooks Policies
CREATE POLICY "Service role can manage webhooks"
  ON webhooks FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can manage webhooks"
  ON webhooks FOR ALL
  USING (is_org_admin(org_id));

-- Webhook Queue Policies
CREATE POLICY "Service role can manage webhook queue"
  ON webhook_queue FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view webhook queue"
  ON webhook_queue FOR SELECT
  USING (is_org_admin(org_id));

-- Webhook Logs Policies
CREATE POLICY "Service role can manage webhook logs"
  ON webhook_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view webhook logs"
  ON webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks
      WHERE webhooks.id = webhook_logs.webhook_id
      AND is_org_admin(webhooks.org_id)
    )
  );

-- Campaigns Policies
CREATE POLICY "Admins can manage campaigns"
  ON campaigns FOR ALL
  USING (is_org_admin(org_id));

CREATE POLICY "Users can view active campaigns"
  ON campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = campaigns.org_id
      AND org_members.user_id = auth.uid()
    )
    AND status = 'active'
  );

-- A/B Tests Policies
CREATE POLICY "Admins can manage ab tests"
  ON ab_tests FOR ALL
  USING (is_org_admin(org_id));

CREATE POLICY "Users can view active ab tests"
  ON ab_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = ab_tests.org_id
      AND org_members.user_id = auth.uid()
    )
    AND active = true
  );

-- Funnels Policies
CREATE POLICY "Admins can manage funnels"
  ON funnels FOR ALL
  USING (is_org_admin(org_id));

CREATE POLICY "Users can view funnels"
  ON funnels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = funnels.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- Forums Policies
CREATE POLICY "Admins can manage forums"
  ON forums FOR ALL
  USING (is_org_admin(org_id));

CREATE POLICY "Users can view public forums"
  ON forums FOR SELECT
  USING (
    NOT is_private
    OR EXISTS (
      SELECT 1 FROM forum_members
      WHERE forum_members.forum_id = forums.id
      AND forum_members.user_id = auth.uid()
    )
  );

-- Forum Posts Policies
CREATE POLICY "Users can view forum posts"
  ON forum_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forums
      WHERE forums.id = forum_posts.forum_id
      AND (
        NOT forums.is_private
        OR EXISTS (
          SELECT 1 FROM forum_members
          WHERE forum_members.forum_id = forums.id
          AND forum_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create forum posts"
  ON forum_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forums
      WHERE forums.id = forum_posts.forum_id
      AND EXISTS (
        SELECT 1 FROM forum_members
        WHERE forum_members.forum_id = forums.id
        AND forum_members.user_id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own posts"
  ON forum_posts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Moderators can manage posts"
  ON forum_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM forum_members
      WHERE forum_members.forum_id = forum_posts.forum_id
      AND forum_members.user_id = auth.uid()
      AND forum_members.role IN ('moderator', 'admin')
    )
  );

-- Forum Members Policies
CREATE POLICY "Users can view forum members"
  ON forum_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forums
      WHERE forums.id = forum_members.forum_id
      AND (
        NOT forums.is_private
        OR EXISTS (
          SELECT 1 FROM forum_members fm
          WHERE fm.forum_id = forums.id
          AND fm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join public forums"
  ON forum_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forums
      WHERE forums.id = forum_members.forum_id
      AND NOT forums.is_private
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Admins can manage forum members"
  ON forum_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM forums
      WHERE forums.id = forum_members.forum_id
      AND is_org_admin(forums.org_id)
    )
  );

-- API Keys Policies
CREATE POLICY "Admins can manage api keys"
  ON api_keys FOR ALL
  USING (is_org_admin(org_id));

-- AI Generations Policies
CREATE POLICY "Service role can manage ai generations"
  ON ai_generations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view ai generations"
  ON ai_generations FOR SELECT
  USING (is_org_admin(org_id));

CREATE POLICY "Users can view own ai generations"
  ON ai_generations FOR SELECT
  USING (user_id = auth.uid());

-- Integrations Policies
CREATE POLICY "Admins can manage integrations"
  ON integrations FOR ALL
  USING (is_org_admin(org_id));

CREATE POLICY "Users can view enabled integrations"
  ON integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = integrations.org_id
      AND org_members.user_id = auth.uid()
    )
    AND enabled = true
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
