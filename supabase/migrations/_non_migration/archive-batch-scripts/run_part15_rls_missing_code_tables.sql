-- RLS policies for 11 tables from run_part14_missing_code_tables.sql

ALTER TABLE IF EXISTS compliance_evidence ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_compliance_evidence" ON compliance_evidence FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS course_leaderboard ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_course_leaderboard" ON course_leaderboard FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS email_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_email_templates" ON email_templates FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS global_leaderboard ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_global_leaderboard" ON global_leaderboard FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS leaderboard_scores ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_leaderboard_scores" ON leaderboard_scores FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS learning_goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_learning_goals" ON learning_goals FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS lesson_answers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_lesson_answers" ON lesson_answers FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS partner_seat_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_partner_seat_orders" ON partner_seat_orders FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS security_scan_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_security_scan_events" ON security_scan_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS signature_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_signature_documents" ON signature_documents FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE IF EXISTS video_bookmarks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_read_video_bookmarks" ON video_bookmarks FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
