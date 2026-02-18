-- ================================================================
-- PHASE 3: ENABLE RLS + CREATE POLICIES
-- Run after Phase 1 + 2. All use DROP IF EXISTS — safe to re-run.
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE license_agreement_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE handbook_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_mous ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wioa_compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferpa_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE wioa_pirl_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wioa_pirl_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE wioa_pirl_export_issues ENABLE ROW LEVEL SECURITY;

-- ============================================
-- license_agreement_acceptances
-- ============================================
DROP POLICY IF EXISTS "Users can view own acceptances" ON license_agreement_acceptances;
CREATE POLICY "Users can view own acceptances" ON license_agreement_acceptances
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own acceptances" ON license_agreement_acceptances;
CREATE POLICY "Users can insert own acceptances" ON license_agreement_acceptances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view all acceptances" ON license_agreement_acceptances;
CREATE POLICY "Staff can view all acceptances" ON license_agreement_acceptances
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','super_admin')));

DROP POLICY IF EXISTS "No updates allowed" ON license_agreement_acceptances;
CREATE POLICY "No updates allowed" ON license_agreement_acceptances FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No deletes allowed" ON license_agreement_acceptances;
CREATE POLICY "No deletes allowed" ON license_agreement_acceptances FOR DELETE USING (false);

-- ============================================
-- agreement_versions
-- ============================================
DROP POLICY IF EXISTS "Anyone can view versions" ON agreement_versions;
CREATE POLICY "Anyone can view versions" ON agreement_versions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view agreement versions" ON agreement_versions;
CREATE POLICY "Anyone can view agreement versions" ON agreement_versions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage versions" ON agreement_versions;
CREATE POLICY "Only admins can manage versions" ON agreement_versions
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

-- ============================================
-- onboarding_progress
-- ============================================
DROP POLICY IF EXISTS "Users can view own onboarding" ON onboarding_progress;
CREATE POLICY "Users can view own onboarding" ON onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding" ON onboarding_progress;
CREATE POLICY "Users can update own onboarding" ON onboarding_progress
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view all onboarding" ON onboarding_progress;
CREATE POLICY "Staff can view all onboarding" ON onboarding_progress
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','super_admin')));

-- ============================================
-- handbook_acknowledgments
-- ============================================
DROP POLICY IF EXISTS "Users can view own handbook ack" ON handbook_acknowledgments;
CREATE POLICY "Users can view own handbook ack" ON handbook_acknowledgments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own handbook ack" ON handbook_acknowledgments;
CREATE POLICY "Users can insert own handbook ack" ON handbook_acknowledgments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can view all handbook acks" ON handbook_acknowledgments;
CREATE POLICY "Staff can view all handbook acks" ON handbook_acknowledgments
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','super_admin')));

-- ============================================
-- compliance_audit_log
-- ============================================
DROP POLICY IF EXISTS "Admins can view audit log" ON compliance_audit_log;
CREATE POLICY "Admins can view audit log" ON compliance_audit_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

DROP POLICY IF EXISTS "System can insert audit log" ON compliance_audit_log;
CREATE POLICY "System can insert audit log" ON compliance_audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================
-- automated_decisions
-- ============================================
DROP POLICY IF EXISTS "Admins can view automated decisions" ON automated_decisions;
CREATE POLICY "Admins can view automated decisions" ON automated_decisions
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

DROP POLICY IF EXISTS "System can insert automated decisions" ON automated_decisions;
CREATE POLICY "System can insert automated decisions" ON automated_decisions
  FOR INSERT WITH CHECK (true);

-- ============================================
-- review_queue
-- ============================================
DROP POLICY IF EXISTS "Admins can view review queue" ON review_queue;
CREATE POLICY "Admins can view review queue" ON review_queue
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

DROP POLICY IF EXISTS "Admins can update review queue" ON review_queue;
CREATE POLICY "Admins can update review queue" ON review_queue
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

DROP POLICY IF EXISTS "System can insert review queue" ON review_queue;
CREATE POLICY "System can insert review queue" ON review_queue
  FOR INSERT WITH CHECK (true);

-- ============================================
-- shop_recommendations
-- ============================================
DROP POLICY IF EXISTS "Admins can view shop recommendations" ON shop_recommendations;
CREATE POLICY "Admins can view shop recommendations" ON shop_recommendations
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- ============================================
-- partner_documents
-- ============================================
DROP POLICY IF EXISTS "Partners can view own documents" ON partner_documents;
CREATE POLICY "Partners can view own documents" ON partner_documents
  FOR SELECT USING (partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all partner documents" ON partner_documents;
CREATE POLICY "Admins can view all partner documents" ON partner_documents
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- ============================================
-- partner_mous
-- ============================================
DROP POLICY IF EXISTS "Partners can view own MOUs" ON partner_mous;
CREATE POLICY "Partners can view own MOUs" ON partner_mous
  FOR SELECT USING (partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all MOUs" ON partner_mous;
CREATE POLICY "Admins can view all MOUs" ON partner_mous
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- ============================================
-- apprentice_placements
-- ============================================
DROP POLICY IF EXISTS "Apprentices can view own placements" ON apprentice_placements;
CREATE POLICY "Apprentices can view own placements" ON apprentice_placements
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Partners can view their shop placements" ON apprentice_placements;
CREATE POLICY "Partners can view their shop placements" ON apprentice_placements
  FOR SELECT USING (shop_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all placements" ON apprentice_placements;
CREATE POLICY "Admins can view all placements" ON apprentice_placements
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- ============================================
-- Wire shell page tables: admin read, user read own
-- ============================================
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'enrollment_requirements','compliance_alerts','wioa_compliance_reports',
    'crm_follow_ups','crm_deals','crm_appointments',
    'apprentice_milestones','time_off_requests'
  ]) LOOP
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = tbl AND policyname = 'admin_read_' || tbl) THEN
      EXECUTE format('CREATE POLICY "admin_read_%s" ON %I FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN (''admin'',''super_admin'',''staff'')))', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- portal_messages: users see own sent/received
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'portal_messages' AND policyname = 'users_own_messages') THEN
    CREATE POLICY "users_own_messages" ON portal_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'portal_messages' AND policyname = 'users_send_messages') THEN
    CREATE POLICY "users_send_messages" ON portal_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

-- conversations: participants only
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'participants_view') THEN
    CREATE POLICY "participants_view" ON conversations FOR SELECT USING (auth.uid() = ANY(participants));
  END IF;
END $$;

-- practice_tests + study_topics: public read
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'practice_tests' AND policyname = 'public_read_tests') THEN
    CREATE POLICY "public_read_tests" ON practice_tests FOR SELECT USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'study_topics' AND policyname = 'public_read_topics') THEN
    CREATE POLICY "public_read_topics" ON study_topics FOR SELECT USING (is_published = true);
  END IF;
END $$;

-- practice_test_attempts: users see own
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'practice_test_attempts' AND policyname = 'users_own_attempts') THEN
    CREATE POLICY "users_own_attempts" ON practice_test_attempts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'practice_test_attempts' AND policyname = 'users_insert_attempts') THEN
    CREATE POLICY "users_insert_attempts" ON practice_test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- search: users see own history, anyone reads suggestions
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'users_own_search') THEN
    CREATE POLICY "users_own_search" ON search_history FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'users_insert_search') THEN
    CREATE POLICY "users_insert_search" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'search_suggestions' AND policyname = 'public_read_suggestions') THEN
    CREATE POLICY "public_read_suggestions" ON search_suggestions FOR SELECT USING (true);
  END IF;
END $$;

-- ferpa_access_logs: admins only
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'ferpa_access_logs' AND policyname = 'admin_read_ferpa') THEN
    CREATE POLICY "admin_read_ferpa" ON ferpa_access_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'ferpa_access_logs' AND policyname = 'system_insert_ferpa') THEN
    CREATE POLICY "system_insert_ferpa" ON ferpa_access_logs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- marketplace_products: public read
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'marketplace_products' AND policyname = 'public_read_products') THEN
    CREATE POLICY "public_read_products" ON marketplace_products FOR SELECT USING (status = 'active');
  END IF;
END $$;

-- WIOA PIRL tables: admin only
DROP POLICY IF EXISTS "admin_manage_pirl_mappings" ON wioa_pirl_mappings;
CREATE POLICY "admin_manage_pirl_mappings" ON wioa_pirl_mappings
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

DROP POLICY IF EXISTS "admin_manage_pirl_exports" ON wioa_pirl_exports;
CREATE POLICY "admin_manage_pirl_exports" ON wioa_pirl_exports
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

DROP POLICY IF EXISTS "admin_manage_pirl_issues" ON wioa_pirl_export_issues;
CREATE POLICY "admin_manage_pirl_issues" ON wioa_pirl_export_issues
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
