-- RLS policies for 14 tables flagged by Supabase Database Linter.
-- Also fixes broken quiz_attempts policies (integer user_id vs uuid auth.uid()).
-- All comparisons cast to text to handle type mismatches on live DB.

-- Fix broken quiz_attempts policies
DROP POLICY IF EXISTS "quiz_attempts_own" ON quiz_attempts;
CREATE POLICY "quiz_attempts_own" ON quiz_attempts
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "quiz_attempts_admin" ON quiz_attempts;
CREATE POLICY "quiz_attempts_admin" ON quiz_attempts
  FOR SELECT TO authenticated
  USING (
    auth.uid()::text IN (
      SELECT id::text FROM auth.users
      WHERE raw_user_meta_data->>'role' IN ('admin', 'instructor')
    )
  );

-- ADMIN-ONLY
DROP POLICY IF EXISTS "admin_checkout_sessions_admin_all" ON admin_checkout_sessions;
CREATE POLICY "admin_checkout_sessions_admin_all" ON admin_checkout_sessions
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "approved_payment_links_admin_all" ON approved_payment_links;
CREATE POLICY "approved_payment_links_admin_all" ON approved_payment_links
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "organization_roles_read" ON organization_roles;
CREATE POLICY "organization_roles_read" ON organization_roles
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "organization_roles_admin_all" ON organization_roles;
CREATE POLICY "organization_roles_admin_all" ON organization_roles
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- USER-OWNED (direct user_id)
DROP POLICY IF EXISTS "course_progress_own" ON course_progress;
CREATE POLICY "course_progress_own" ON course_progress
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);
DROP POLICY IF EXISTS "course_progress_admin" ON course_progress;
CREATE POLICY "course_progress_admin" ON course_progress
  FOR SELECT TO authenticated USING (public.is_admin());

-- REFERENCE READ + ADMIN WRITE
DROP POLICY IF EXISTS "quiz_answers_select" ON quiz_answers;
CREATE POLICY "quiz_answers_select" ON quiz_answers
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "quiz_answers_admin_all" ON quiz_answers;
CREATE POLICY "quiz_answers_admin_all" ON quiz_answers
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tax_fee_schedules_read" ON tax_fee_schedules;
CREATE POLICY "tax_fee_schedules_read" ON tax_fee_schedules
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tax_fee_schedules_admin_all" ON tax_fee_schedules;
CREATE POLICY "tax_fee_schedules_admin_all" ON tax_fee_schedules
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- USER-OWNED (via quiz_attempts)
DROP POLICY IF EXISTS "quiz_attempt_answers_own" ON quiz_attempt_answers;
CREATE POLICY "quiz_attempt_answers_own" ON quiz_attempt_answers
  FOR ALL TO authenticated
  USING (attempt_id::text IN (SELECT id::text FROM public.quiz_attempts WHERE user_id::text = auth.uid()::text))
  WITH CHECK (attempt_id::text IN (SELECT id::text FROM public.quiz_attempts WHERE user_id::text = auth.uid()::text));
DROP POLICY IF EXISTS "quiz_attempt_answers_admin" ON quiz_attempt_answers;
CREATE POLICY "quiz_attempt_answers_admin" ON quiz_attempt_answers
  FOR SELECT TO authenticated USING (public.is_admin());

-- USER-OWNED (via tax_returns)
DROP POLICY IF EXISTS "tax_1099_income_own" ON tax_1099_income;
CREATE POLICY "tax_1099_income_own" ON tax_1099_income
  FOR ALL TO authenticated
  USING (tax_return_id::text IN (SELECT id::text FROM tax_returns WHERE user_id::text = auth.uid()::text))
  WITH CHECK (tax_return_id::text IN (SELECT id::text FROM tax_returns WHERE user_id::text = auth.uid()::text));
DROP POLICY IF EXISTS "tax_1099_income_admin" ON tax_1099_income;
CREATE POLICY "tax_1099_income_admin" ON tax_1099_income
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tax_dependents_own" ON tax_dependents;
CREATE POLICY "tax_dependents_own" ON tax_dependents
  FOR ALL TO authenticated
  USING (tax_return_id::text IN (SELECT id::text FROM tax_returns WHERE user_id::text = auth.uid()::text))
  WITH CHECK (tax_return_id::text IN (SELECT id::text FROM tax_returns WHERE user_id::text = auth.uid()::text));
DROP POLICY IF EXISTS "tax_dependents_admin" ON tax_dependents;
CREATE POLICY "tax_dependents_admin" ON tax_dependents
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tax_itemized_deductions_own" ON tax_itemized_deductions;
CREATE POLICY "tax_itemized_deductions_own" ON tax_itemized_deductions
  FOR ALL TO authenticated
  USING (tax_return_id::text IN (SELECT id::text FROM tax_returns WHERE user_id::text = auth.uid()::text))
  WITH CHECK (tax_return_id::text IN (SELECT id::text FROM tax_returns WHERE user_id::text = auth.uid()::text));
DROP POLICY IF EXISTS "tax_itemized_deductions_admin" ON tax_itemized_deductions;
CREATE POLICY "tax_itemized_deductions_admin" ON tax_itemized_deductions
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tax_schedule_c_own" ON tax_schedule_c;
CREATE POLICY "tax_schedule_c_own" ON tax_schedule_c
  FOR ALL TO authenticated
  USING (tax_return_id::text IN (SELECT id::text FROM tax_returns WHERE user_id::text = auth.uid()::text))
  WITH CHECK (tax_return_id::text IN (SELECT id::text FROM tax_returns WHERE user_id::text = auth.uid()::text));
DROP POLICY IF EXISTS "tax_schedule_c_admin" ON tax_schedule_c;
CREATE POLICY "tax_schedule_c_admin" ON tax_schedule_c
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tax_w2_income_own" ON tax_w2_income;
CREATE POLICY "tax_w2_income_own" ON tax_w2_income
  FOR ALL TO authenticated
  USING (tax_return_id::text IN (SELECT id::text FROM tax_returns WHERE user_id::text = auth.uid()::text))
  WITH CHECK (tax_return_id::text IN (SELECT id::text FROM tax_returns WHERE user_id::text = auth.uid()::text));
DROP POLICY IF EXISTS "tax_w2_income_admin" ON tax_w2_income;
CREATE POLICY "tax_w2_income_admin" ON tax_w2_income
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SERVICE-ONLY
DROP POLICY IF EXISTS "ocr_extractions_admin_read" ON ocr_extractions;
CREATE POLICY "ocr_extractions_admin_read" ON ocr_extractions
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "preparer_payouts_admin_all" ON preparer_payouts;
CREATE POLICY "preparer_payouts_admin_all" ON preparer_payouts
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());
