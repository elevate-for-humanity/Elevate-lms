-- RLS Policies for Missing Tables
-- Copyright (c) 2025 Elevate for Humanity

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_versions ENABLE ROW LEVEL SECURITY;

-- Analytics Events Policies
CREATE POLICY "Service role can manage analytics events"
  ON analytics_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view analytics events"
  ON analytics_events FOR SELECT
  USING (is_org_admin(org_id));

CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  USING (user_id = auth.uid());

-- Assessment Submissions Policies
CREATE POLICY "Users can view own submissions"
  ON assessment_submissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own submissions"
  ON assessment_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all submissions"
  ON assessment_submissions FOR SELECT
  USING (is_org_admin(org_id));

CREATE POLICY "Admins can update submissions"
  ON assessment_submissions FOR UPDATE
  USING (is_org_admin(org_id));

CREATE POLICY "Service role can manage submissions"
  ON assessment_submissions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Assessments Policies
CREATE POLICY "Admins can manage assessments"
  ON assessments FOR ALL
  USING (is_org_admin(org_id));

CREATE POLICY "Users can view assessments"
  ON assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = assessments.course_id
      AND enrollments.user_id = auth.uid()
    )
  );

-- Audit Logs Policies
CREATE POLICY "Service role can manage audit logs"
  ON audit_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (is_org_admin(org_id));

-- Badges Policies
CREATE POLICY "Admins can manage badges"
  ON badges FOR ALL
  USING (is_org_admin(org_id));

CREATE POLICY "Users can view badges"
  ON badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = badges.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- User Badges Policies
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view other badges"
  ON user_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN org_members ON users.id = org_members.user_id
      WHERE users.id = user_badges.user_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage user badges"
  ON user_badges FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Leaderboards Policies
CREATE POLICY "Users can view leaderboards"
  ON leaderboards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = leaderboards.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage leaderboards"
  ON leaderboards FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Billing Subscriptions Policies
CREATE POLICY "Admins can view billing subscriptions"
  ON billing_subscriptions FOR SELECT
  USING (is_org_admin(org_id));

CREATE POLICY "Service role can manage billing subscriptions"
  ON billing_subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Entitlements Policies
CREATE POLICY "Admins can view entitlements"
  ON entitlements FOR SELECT
  USING (is_org_admin(org_id));

CREATE POLICY "Users can view org entitlements"
  ON entitlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = entitlements.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage entitlements"
  ON entitlements FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Course Versions Policies
CREATE POLICY "Admins can manage course versions"
  ON course_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_versions.course_id
      AND is_org_admin(courses.org_id)
    )
  );

CREATE POLICY "Users can view course versions"
  ON course_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN enrollments ON courses.id = enrollments.course_id
      WHERE courses.id = course_versions.course_id
      AND enrollments.user_id = auth.uid()
    )
  );
