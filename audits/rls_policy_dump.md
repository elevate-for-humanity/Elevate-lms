# Elevate LMS — RLS Policy Dump

Generated: 2026-02-14
Source: Migration files (supabase/migrations/*.sql) + live anon/service-role comparison
Method: Parsed 493 migration files for CREATE POLICY + ENABLE ROW LEVEL SECURITY statements;
        verified enforcement by comparing anon vs service-role query results on live database

## Summary

| Metric | Count |
|--------|-------|
| Total tables | 551 |
| Tables with RLS enabled (in migrations) | 186 |
| Tables with policies defined | 167 |
| Total policies | 333 |
| Tables where anon can read data | 17 |
| Tables where anon is blocked | 101 |

## Anon-Readable Tables (17)

These tables return data to unauthenticated (anon key) requests:

| Table | Anon Rows | Total Rows | Ratio |
|-------|-----------|------------|-------|
| lessons | 540 | 540 | 100% |
| training_lessons | 540 | 540 | 100% |
| courses | 60 | 60 | 100% |
| training_courses | 60 | 60 | 100% |
| programs | 55 | 55 | 100% |
| achievements | 22 | 22 | 100% |
| partner_courses | 14 | 329 | 4% |
| partner_lms_courses | 14 | 329 | 4% |
| faqs | 10 | 10 | 100% |
| shop_products | 10 | 10 | 100% |
| locations | 8 | 8 | 100% |
| team_members | 6 | 6 | 100% |
| discussion_forums | 5 | 5 | 100% |
| testimonials | 5 | 5 | 100% |
| apprenticeship_programs | 4 | 4 | 100% |
| success_stories | 3 | 3 | 100% |
| certificates | 2 | 2 | 100% |

## RLS Status by Table

### Tables with RLS Enabled + Policies

#### access_tokens (RLS: ENABLED)

```sql
CREATE POLICY "Service role full access access_tokens" ON access_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### admin_activity_log (RLS: ENABLED)

```sql
CREATE POLICY "Admin read" ON admin_activity_log FOR SELECT USING (auth.uid() IS NOT NULL);
```

```sql
CREATE POLICY "Admin insert" ON admin_activity_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

#### admin_notifications (RLS: ENABLED)

```sql
CREATE POLICY "Own notifications" ON admin_notifications FOR SELECT USING (auth.uid() = admin_id);
```

```sql
CREATE POLICY "Service role insert" ON admin_notifications FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

```sql
CREATE POLICY "Own update" ON admin_notifications FOR UPDATE USING (auth.uid() = admin_id);
```

#### agreement_acceptances (RLS: ENABLED)

```sql
CREATE POLICY "Public can insert agreement acceptances" ON agreement_acceptances
  FOR INSERT TO anon WITH CHECK (true);
```

```sql
CREATE POLICY "Service role full access agreement_acceptances" ON agreement_acceptances
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### announcements (RLS: ENABLED)

```sql
CREATE POLICY "Users can view relevant announcements" ON announcements
  FOR SELECT USING (
    published = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (audience = 'all' OR audience = (
      SELECT role FROM profiles WHERE id = auth.uid()
    ))
  );
```

```sql
CREATE POLICY "Public can view published announcements" ON announcements
  FOR SELECT USING (
    published = true 
    AND (expires_at IS NULL OR expires_at > now())
  );
```

```sql
CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );
```

#### api_keys (RLS: ENABLED)

```sql
CREATE POLICY "Admin full access to api_keys" ON api_keys FOR ALL USING (true);
```

#### application_state_events (RLS: ENABLED)

```sql
CREATE POLICY "Admins can view all state events" ON application_state_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

```sql
CREATE POLICY "Users can view own application events" ON application_state_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_applications ca
      WHERE ca.id = application_state_events.application_id
      AND ca.user_id = auth.uid()
    )
  );
```

```sql
CREATE POLICY "Admins can view all state events" ON application_state_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

```sql
CREATE POLICY "Staff can view all state events" ON application_state_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'staff'));
```

```sql
CREATE POLICY "Users can view own application events" ON application_state_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM career_applications ca WHERE ca.id = application_state_events.application_id AND ca.user_id = auth.uid()));
```

#### applications (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "applications_own_read" ON public.applications
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR email = (SELECT email FROM public.profiles WHERE id = auth.uid()));
```

```sql
CREATE POLICY "applications_admin_all" ON public.applications
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

```sql
CREATE POLICY "anyone_insert" ON applications FOR INSERT
      WITH CHECK (email IS NOT NULL AND LENGTH(email) <= 255 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

#### apprentice_applications (RLS: ENABLED)

```sql
CREATE POLICY "Public can insert apprentice applications" ON apprentice_applications
  FOR INSERT TO anon WITH CHECK (true);
```

```sql
CREATE POLICY "Service role full access apprentice_applications" ON apprentice_applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### apprentice_assignments (RLS: ENABLED)

```sql
CREATE POLICY "assignments_student_read" ON public.apprentice_assignments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.id = apprentice_assignments.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);
```

```sql
CREATE POLICY "assignments_partner_read" ON public.apprentice_assignments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.partner_organizations po ON p.partner_org_id = po.id
    JOIN public.partner_sites ps ON ps.partner_id = po.id
    WHERE p.id = auth.uid()
    AND ps.id = apprentice_assignments.site_id
  )
);
```

```sql
CREATE POLICY "assignments_admin_all" ON public.apprentice_assignments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);
```

```sql
CREATE POLICY "Service role full access apprentice_assignments" ON apprentice_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### apprentices (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own apprentice record" ON apprentices
  FOR SELECT USING (user_id = auth.uid());
```

```sql
CREATE POLICY "Admins can view all apprentices" ON apprentices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
  );
```

```sql
CREATE POLICY "Admins can manage apprentices" ON apprentices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

```sql
CREATE POLICY "Service role full access" ON apprentices
  FOR ALL USING (auth.role() = 'service_role');
```

#### attendance_hours (RLS: ENABLED)

```sql
CREATE POLICY "hours_student_read" ON public.attendance_hours
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.id = attendance_hours.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);
```

```sql
CREATE POLICY "hours_instructor_insert" ON public.attendance_hours
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);
```

```sql
CREATE POLICY "hours_admin_update" ON public.attendance_hours
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);
```

```sql
CREATE POLICY "hours_admin_delete" ON public.attendance_hours
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

#### audit_logs (RLS: ENABLED)

```sql
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

```sql
CREATE POLICY "audit_logs_insert" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);
```

```sql
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

```sql
CREATE POLICY "Users can create own audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);
```

#### avatar_sales_messages (RLS: ENABLED)

```sql
CREATE POLICY "Public read sales_messages" ON avatar_sales_messages FOR SELECT USING (is_active = true);
```

#### banner_analytics (RLS: ENABLED)

```sql
CREATE POLICY "Anyone can insert" ON banner_analytics FOR INSERT WITH CHECK (true);
```

```sql
CREATE POLICY "Service role read" ON banner_analytics FOR SELECT USING (auth.role() = 'service_role');
```

#### barbershop_partner_applications (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "Allow public inserts" ON barbershop_partner_applications FOR INSERT
      WITH CHECK (business_name IS NOT NULL AND LENGTH(business_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

#### blog_posts (RLS: ENABLED)

```sql
CREATE POLICY "Public can view published blog posts" ON blog_posts FOR SELECT USING (published = true);
```

#### campaigns (RLS: ENABLED)

```sql
CREATE POLICY "Admin full access to campaigns" ON campaigns FOR ALL USING (true);
```

#### career_applications (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "Users can view own applications" ON career_applications
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR user_id IS NULL  -- Allow anonymous applications to be viewed during session
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );
```

```sql
CREATE POLICY "Block direct inserts" ON career_applications
  FOR INSERT
  WITH CHECK (FALSE);
```

```sql
CREATE POLICY "Block direct updates" ON career_applications
  FOR UPDATE
  USING (FALSE)  -- Always deny direct updates
  WITH CHECK (FALSE);
```

```sql
CREATE POLICY "Block direct deletes" ON career_applications
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
```

#### career_course_features (RLS: ENABLED)

```sql
CREATE POLICY "Anyone can view course features" ON career_course_features
  FOR SELECT USING (true);
```

#### career_course_modules (RLS: ENABLED)

```sql
CREATE POLICY "Anyone can view preview modules" ON career_course_modules
  FOR SELECT USING (is_preview = true);
```

```sql
CREATE POLICY "Purchased users can view all modules" ON career_course_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM career_course_purchases
      WHERE career_course_purchases.course_id = career_course_modules.course_id
      AND career_course_purchases.user_id = auth.uid()
      AND career_course_purchases.status = 'completed'
    )
  );
```

#### career_course_purchases (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own purchases" ON career_course_purchases
  FOR SELECT USING (user_id = auth.uid());
```

```sql
CREATE POLICY "System can insert purchases" ON career_course_purchases
  FOR INSERT WITH CHECK (true);
```

```sql
CREATE POLICY "career_course_purchases_insert" ON career_course_purchases FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
```

#### career_courses (RLS: ENABLED)

```sql
CREATE POLICY "Anyone can view active courses" ON career_courses
  FOR SELECT USING (is_active = true);
```

```sql
CREATE POLICY "Admins can manage courses" ON career_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### certificate_downloads (RLS: ENABLED)

```sql
CREATE POLICY "Own downloads" ON certificate_downloads FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Auth insert" ON certificate_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### cohorts (RLS: ENABLED)

```sql
CREATE POLICY "cohorts_instructor_read" ON public.cohorts
FOR SELECT TO authenticated
USING (
  instructor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);
```

```sql
CREATE POLICY "cohorts_admin_all" ON public.cohorts
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

#### community_posts (RLS: ENABLED)

```sql
CREATE POLICY "Public read" ON community_posts FOR SELECT USING (true);
```

```sql
CREATE POLICY "Auth insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY "Own update" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
```

#### content_views (RLS: ENABLED)

```sql
CREATE POLICY "Auth insert" ON content_views FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

```sql
CREATE POLICY "Service role read" ON content_views FOR SELECT USING (auth.role() = 'service_role');
```

#### continuing_education_hours (RLS: ENABLED)

```sql
CREATE POLICY "Service role full access continuing_education_hours" ON continuing_education_hours
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

```sql
CREATE POLICY "Public can insert CE hours" ON continuing_education_hours
  FOR INSERT TO anon WITH CHECK (true);
```

#### conversions (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "System can insert conversions" ON conversions FOR INSERT
      WITH CHECK (created_at IS NULL OR created_at >= NOW() - INTERVAL '1 hour');
```

#### copilot_deployments (RLS: ENABLED)

```sql
CREATE POLICY "Admins can manage copilot deployments" ON copilot_deployments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### coupons (RLS: ENABLED)

```sql
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (is_active = true);
```

#### courses (RLS: ENABLED)

```sql
CREATE POLICY "courses_admin_all" ON public.courses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);
```

```sql
CREATE POLICY "courses_student_read" ON public.courses
FOR SELECT TO authenticated
USING (is_published = true);
```

#### crm_contacts (RLS: ENABLED)

```sql
CREATE POLICY "Admin full access to contacts" ON crm_contacts FOR ALL USING (true);
```

#### document_requirements (RLS: ENABLED)

```sql
CREATE POLICY "doc_requirements_read" ON public.document_requirements
FOR SELECT TO authenticated
USING (true);
```

```sql
CREATE POLICY "doc_requirements_admin_all" ON public.document_requirements
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

#### document_verifications (RLS: ENABLED)

```sql
CREATE POLICY "doc_verifications_admin_all" ON public.document_verifications
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

#### documents (RLS: ENABLED)

```sql
CREATE POLICY "Public can insert documents" ON documents
  FOR INSERT TO anon WITH CHECK (true);
```

```sql
CREATE POLICY "Service role full access documents" ON documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### employer_applications (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "employer_applications_insert" ON employer_applications FOR INSERT
      WITH CHECK (company_name IS NOT NULL AND LENGTH(company_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

#### employer_profiles (RLS: ENABLED)

```sql
CREATE POLICY "Public read active" ON employer_profiles FOR SELECT USING (is_active = true);
```

```sql
CREATE POLICY "Service role full" ON employer_profiles FOR ALL USING (auth.role() = 'service_role');
```

#### enrollments (RLS: ENABLED)

```sql
CREATE POLICY "enrollments_admin_all" ON public.enrollments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

```sql
CREATE POLICY "enrollments_student_own" ON public.enrollments
FOR SELECT TO authenticated
USING (user_id = auth.uid());
```

#### evaluations (RLS: ENABLED)

```sql
CREATE POLICY "evaluations_student_read" ON public.evaluations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.id = evaluations.enrollment_id
    AND enrollments.user_id = auth.uid()
  )
);
```

```sql
CREATE POLICY "evaluations_instructor_all" ON public.evaluations
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'instructor'))
);
```

#### events (RLS: ENABLED)

```sql
CREATE POLICY "Public can view active events" ON events FOR SELECT USING (is_active = true);
```

#### faqs (RLS: ENABLED)

```sql
CREATE POLICY "Public can view active faqs" ON faqs
  FOR SELECT USING (is_active = true);
```

#### financial_aid_calculations (RLS: ENABLED)

```sql
CREATE POLICY "Anyone insert" ON financial_aid_calculations FOR INSERT WITH CHECK (true);
```

```sql
CREATE POLICY "Service role read" ON financial_aid_calculations FOR SELECT USING (auth.role() = 'service_role');
```

#### franchise_audit_log (RLS: ENABLED)

```sql
CREATE POLICY franchise_audit_access ON franchise_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );
```

#### franchise_clients (RLS: ENABLED)

```sql
CREATE POLICY franchise_clients_access ON franchise_clients
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE office_id = franchise_clients.office_id AND user_id = auth.uid())
  );
```

#### franchise_ero_configs (RLS: ENABLED)

```sql
CREATE POLICY franchise_ero_configs_access ON franchise_ero_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );
```

#### franchise_fee_schedules (RLS: ENABLED)

```sql
CREATE POLICY franchise_fee_schedules_access ON franchise_fee_schedules
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );
```

#### franchise_offices (RLS: ENABLED)

```sql
CREATE POLICY franchise_offices_admin ON franchise_offices
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR owner_id = auth.uid()
  );
```

#### franchise_preparer_payouts (RLS: ENABLED)

```sql
CREATE POLICY franchise_preparer_payouts_access ON franchise_preparer_payouts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE id = preparer_id AND user_id = auth.uid())
  );
```

#### franchise_preparers (RLS: ENABLED)

```sql
CREATE POLICY franchise_preparers_access ON franchise_preparers
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
  );
```

#### franchise_return_submissions (RLS: ENABLED)

```sql
CREATE POLICY franchise_returns_access ON franchise_return_submissions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE id = preparer_id AND user_id = auth.uid())
  );
```

#### franchise_royalties (RLS: ENABLED)

```sql
CREATE POLICY franchise_royalties_access ON franchise_royalties
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );
```

#### funding_sources (RLS: ENABLED)

```sql
CREATE POLICY "funding_sources_public_read" ON public.funding_sources
FOR SELECT USING (is_active = true);
```

```sql
CREATE POLICY "funding_sources_admin_all" ON public.funding_sources
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

#### generated_pages (RLS: ENABLED)

```sql
CREATE POLICY "Public read published" ON generated_pages FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);
```

```sql
CREATE POLICY "Admin write" ON generated_pages FOR ALL USING (auth.role() = 'service_role');
```

#### google_classroom_sync (RLS: ENABLED)

```sql
CREATE POLICY "Own sync" ON google_classroom_sync FOR ALL USING (auth.uid() = user_id);
```

#### grades (RLS: ENABLED)

```sql
CREATE POLICY "Own grades" ON grades FOR SELECT USING (auth.uid() = student_id);
```

```sql
CREATE POLICY "Service role full" ON grades FOR ALL USING (auth.role() = 'service_role');
```

#### grant_applications (RLS: ENABLED)

```sql
CREATE POLICY "Admin full access to grant_apps" ON grant_applications FOR ALL USING (true);
```

#### grant_opportunities (RLS: ENABLED)

```sql
CREATE POLICY "Admin full access to grants" ON grant_opportunities FOR ALL USING (true);
```

#### guide_messages (RLS: ENABLED)

```sql
CREATE POLICY "Public read guide_messages" ON guide_messages FOR SELECT USING (is_active = true);
```

#### host_shop_applications (RLS: ENABLED)

```sql
CREATE POLICY "Public can insert host shop applications" ON host_shop_applications
  FOR INSERT TO anon WITH CHECK (true);
```

```sql
CREATE POLICY "Service role full access host_shop_applications" ON host_shop_applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### hour_entries (RLS: ENABLED)

```sql
CREATE POLICY "Service role full access hour_entries" ON hour_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### hour_transfer_requests (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own transfer requests" ON hour_transfer_requests
  FOR SELECT USING (submitted_by = auth.uid());
```

```sql
CREATE POLICY "Users can create own transfer requests" ON hour_transfer_requests
  FOR INSERT WITH CHECK (submitted_by = auth.uid());
```

```sql
CREATE POLICY "Admins can view all transfer requests" ON hour_transfer_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

```sql
CREATE POLICY "Admins can update transfer requests" ON hour_transfer_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

```sql
CREATE POLICY "Service role full access" ON hour_transfer_requests
  FOR ALL USING (auth.role() = 'service_role');
```

#### inquiries (RLS: ENABLED)

```sql
CREATE POLICY "Public can insert inquiries" ON inquiries
  FOR INSERT TO anon WITH CHECK (true);
```

```sql
CREATE POLICY "Service role full access inquiries" ON inquiries
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### intakes (RLS: ENABLED)

```sql
CREATE POLICY "intakes_public_insert" ON public.intakes
FOR INSERT TO anon, authenticated
WITH CHECK (true);
```

```sql
CREATE POLICY "intakes_admin_all" ON public.intakes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

#### leads (RLS: ENABLED)

```sql
CREATE POLICY "Admin full access to leads" ON leads FOR ALL USING (true);
```

```sql
CREATE POLICY "leads_insert" ON leads FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

```sql
CREATE POLICY "leads_admin_all" ON leads FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
```

```sql
CREATE POLICY "leads_select" ON leads FOR SELECT USING (true);
```

#### lesson_progress (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own lesson progress" ON lesson_progress
  FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can insert own lesson progress" ON lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can update own lesson progress" ON lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "lesson_progress_admin_read" ON public.lesson_progress
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);
```

```sql
CREATE POLICY "lesson_progress_own" ON public.lesson_progress
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

#### lessons (RLS: ENABLED)

```sql
CREATE POLICY "lessons_admin_all" ON public.lessons
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);
```

```sql
CREATE POLICY "lessons_student_read" ON public.lessons
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = lessons.course_id
    AND courses.is_published = true
  )
);
```

#### license_purchases (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "license_purchases_select" ON license_purchases FOR SELECT
      USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
```

```sql
CREATE POLICY "license_purchases_insert" ON license_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY "license_purchases_admin" ON license_purchases FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

#### license_violations (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "license_violations_admin" ON license_violations FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
```

```sql
CREATE POLICY "license_violations_select" ON license_violations FOR SELECT USING (true);
```

#### licenses (RLS: ENABLED)

```sql
CREATE POLICY "licenses_select" ON licenses FOR SELECT USING (true);
```

```sql
CREATE POLICY "licenses_admin" ON licenses FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

#### licensure_exam_events (RLS: ENABLED)

```sql
CREATE POLICY "Service role full access licensure_exam_events" ON licensure_exam_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### live_chat_messages (RLS: ENABLED)

```sql
CREATE POLICY "Session access" ON live_chat_messages FOR ALL USING (auth.uid() IS NOT NULL OR auth.role() = 'service_role');
```

```sql
CREATE POLICY "Anon insert" ON live_chat_messages FOR INSERT WITH CHECK (true);
```

#### live_chat_sessions (RLS: ENABLED)

```sql
CREATE POLICY "Own sessions" ON live_chat_sessions FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
```

```sql
CREATE POLICY "Anon insert" ON live_chat_sessions FOR INSERT WITH CHECK (true);
```

#### live_session_attendance (RLS: ENABLED)

```sql
CREATE POLICY "Auth read" ON live_session_attendance FOR SELECT USING (auth.uid() IS NOT NULL);
```

```sql
CREATE POLICY "Auth insert" ON live_session_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY "Own update" ON live_session_attendance FOR UPDATE USING (auth.uid() = user_id);
```

#### locations (RLS: ENABLED)

```sql
CREATE POLICY "Public can view active locations" ON locations FOR SELECT USING (is_active = true);
```

#### marketing_pages (RLS: ENABLED)

```sql
CREATE POLICY "Public can view published marketing pages" ON marketing_pages
  FOR SELECT USING (published = true);
```

```sql
CREATE POLICY "Admins can manage marketing pages" ON marketing_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

```sql
CREATE POLICY "Public can view published marketing pages" ON marketing_pages
  FOR SELECT USING (published = true);
```

```sql
CREATE POLICY "Admins can manage marketing pages" ON marketing_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### marketing_sections (RLS: ENABLED)

```sql
CREATE POLICY "Public can view marketing sections" ON marketing_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM marketing_pages 
      WHERE marketing_pages.id = marketing_sections.page_id 
      AND marketing_pages.published = true
    )
  );
```

```sql
CREATE POLICY "Public can view marketing sections" ON marketing_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM marketing_pages 
      WHERE marketing_pages.id = marketing_sections.page_id 
      AND marketing_pages.published = true
    )
  );
```

```sql
CREATE POLICY "Admins can manage marketing sections" ON marketing_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### mef_acknowledgments (RLS: ENABLED)

```sql
CREATE POLICY "Service role full access acknowledgments" ON mef_acknowledgments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

#### mef_errors (RLS: ENABLED)

```sql
CREATE POLICY "Service role full access errors" ON mef_errors
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

#### mef_submissions (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own submissions" ON mef_submissions
  FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Admins can view all submissions" ON mef_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );
```

```sql
CREATE POLICY "Admins can insert submissions" ON mef_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );
```

```sql
CREATE POLICY "Admins can update submissions" ON mef_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );
```

```sql
CREATE POLICY "Service role full access submissions" ON mef_submissions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

#### nds_cdl_included_courses (RLS: ENABLED)

```sql
CREATE POLICY "Anyone can view CDL included courses" ON nds_cdl_included_courses
  FOR SELECT USING (is_active = true);
```

#### nds_course_purchases (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own NDS purchases" ON nds_course_purchases
  FOR SELECT USING (user_id = auth.uid());
```

```sql
CREATE POLICY "System can insert NDS purchases" ON nds_course_purchases
  FOR INSERT WITH CHECK (true);
```

```sql
CREATE POLICY "Admins can manage NDS purchases" ON nds_course_purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### nds_training_courses (RLS: ENABLED)

```sql
CREATE POLICY "Anyone can view active NDS courses" ON nds_training_courses
  FOR SELECT USING (is_active = true);
```

```sql
CREATE POLICY "Admins can manage NDS courses" ON nds_training_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### newsletter_subscribers (RLS: ENABLED)

```sql
CREATE POLICY "Service role full access" ON newsletter_subscribers FOR ALL USING (auth.role() = 'service_role');
```

#### notification_events (RLS: ENABLED)

```sql
CREATE POLICY "Own events" ON notification_events FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Service role insert" ON notification_events FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

#### notification_outbox (RLS: ENABLED)

```sql
CREATE POLICY "Admins can view all notifications" ON notification_outbox
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

```sql
CREATE POLICY "Service role can manage notifications" ON notification_outbox
  FOR ALL USING (auth.role() = 'service_role');
```

#### notification_preferences (RLS: ENABLED)

```sql
CREATE POLICY "Users manage own notifications" ON notification_preferences 
  FOR ALL USING (auth.uid() = user_id);
```

#### notification_tokens (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own tokens" ON notification_tokens
  FOR SELECT USING (user_id = auth.uid());
```

```sql
CREATE POLICY "Service role can manage tokens" ON notification_tokens
  FOR ALL USING (auth.role() = 'service_role');
```

#### page_guides (RLS: ENABLED)

```sql
CREATE POLICY "Public read page_guides" ON page_guides FOR SELECT USING (is_active = true);
```

#### page_versions (RLS: ENABLED)

```sql
CREATE POLICY "Admin read" ON page_versions FOR SELECT USING (auth.uid() IS NOT NULL);
```

```sql
CREATE POLICY "Service role write" ON page_versions FOR ALL USING (auth.role() = 'service_role');
```

#### page_views (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "Anyone can insert page views" ON page_views FOR INSERT
      WITH CHECK (created_at IS NULL OR created_at >= NOW() - INTERVAL '1 hour');
```

#### partner_applications (RLS: ENABLED)

```sql
CREATE POLICY "partner_applications_insert" ON partner_applications FOR INSERT
      WITH CHECK (company_name IS NOT NULL AND LENGTH(company_name) <= 255);
```

```sql
CREATE POLICY "partner_applications_select" ON partner_applications FOR SELECT USING (true);
```

```sql
CREATE POLICY "partner_applications_admin" ON partner_applications FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'staff')));
```

#### partner_audit_log (RLS: ENABLED)

```sql
CREATE POLICY "partner_audit_log_admin" ON partner_audit_log FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

#### partner_inquiries (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "partner_inquiries_insert" ON partner_inquiries FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

#### partner_organizations (RLS: ENABLED)

```sql
CREATE POLICY "partner_orgs_own_read" ON public.partner_organizations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role IN ('admin', 'super_admin') OR profiles.partner_org_id = partner_organizations.id)
  )
);
```

```sql
CREATE POLICY "partner_orgs_admin_all" ON public.partner_organizations
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

#### partner_program_access (RLS: ENABLED)

```sql
CREATE POLICY "partner_program_access_select" ON partner_program_access FOR SELECT
      USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

```sql
CREATE POLICY "partner_program_access_admin" ON partner_program_access FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

#### partner_sites (RLS: ENABLED)

```sql
CREATE POLICY "partner_sites_own_read" ON public.partner_sites
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.partner_organizations po ON p.partner_org_id = po.id
    WHERE p.id = auth.uid()
    AND po.id = partner_sites.partner_id
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

```sql
CREATE POLICY "partner_sites_admin_all" ON public.partner_sites
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
```

#### partner_users (RLS: ENABLED)

```sql
CREATE POLICY "partner_users_select" ON partner_users FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

```sql
CREATE POLICY "partner_users_admin" ON partner_users FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

#### partners (RLS: ENABLED)

```sql
CREATE POLICY "Public can view active partners" ON partners FOR SELECT USING (is_active = true);
```

```sql
CREATE POLICY "partners_select" ON partners FOR SELECT USING (true);
```

```sql
CREATE POLICY "partners_own" ON partners FOR UPDATE USING (user_id = auth.uid());
```

```sql
CREATE POLICY "partners_admin" ON partners FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

#### payment_logs (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own payment logs" ON public.payment_logs
  FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Service role can manage payment logs" ON public.payment_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

#### product_categories (RLS: ENABLED)

```sql
CREATE POLICY "Public read categories" ON product_categories FOR SELECT USING (is_active = true);
```

#### product_recommendations (RLS: ENABLED)

```sql
CREATE POLICY "Public read recommendations" ON product_recommendations FOR SELECT USING (is_active = true);
```

#### product_reports (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "product_reports_insert" ON product_reports FOR INSERT
      WITH CHECK (product_id IS NOT NULL AND reason IS NOT NULL AND LENGTH(reason) <= 1000);
```

#### product_reviews (RLS: ENABLED)

```sql
CREATE POLICY "Public read reviews" ON product_reviews FOR SELECT USING (is_approved = true);
```

#### profiles (RLS: ENABLED)

```sql
CREATE POLICY "profiles_admin_all" ON public.profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'super_admin')
  )
);
```

```sql
CREATE POLICY "profiles_own_read" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());
```

```sql
CREATE POLICY "profiles_own_update" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

#### program_enrollments (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own program enrollments" ON program_enrollments
  FOR SELECT USING (user_id = auth.uid());
```

```sql
CREATE POLICY "System can insert program enrollments" ON program_enrollments
  FOR INSERT WITH CHECK (true);
```

```sql
CREATE POLICY "Admins can manage program enrollments" ON program_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### program_funding_links (RLS: ENABLED)

```sql
CREATE POLICY "program_funding_public_read" ON public.program_funding_links
FOR SELECT USING (true);
```

```sql
CREATE POLICY "program_funding_admin_all" ON public.program_funding_links
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

#### program_holder_applications (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "program_holder_applications_insert" ON program_holder_applications FOR INSERT
      WITH CHECK (organization_name IS NOT NULL AND LENGTH(organization_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

#### program_modules (RLS: ENABLED)

```sql
CREATE POLICY "Public read published" ON program_modules FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
```

```sql
CREATE POLICY "Admin write" ON program_modules FOR ALL USING (auth.role() = 'service_role');
```

#### program_outcomes (RLS: ENABLED)

```sql
CREATE POLICY "Public can view program outcomes" ON program_outcomes
  FOR SELECT USING (true);
```

```sql
CREATE POLICY "Admins can manage program outcomes" ON program_outcomes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### program_requirements (RLS: ENABLED)

```sql
CREATE POLICY "Public can view program requirements" ON program_requirements
  FOR SELECT USING (true);
```

```sql
CREATE POLICY "Admins can manage program requirements" ON program_requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### program_tasks (RLS: ENABLED)

```sql
CREATE POLICY "Public can view program tasks" ON program_tasks
  FOR SELECT USING (true);
```

```sql
CREATE POLICY "Admins can manage program tasks" ON program_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### promo_code_uses (RLS: ENABLED)

```sql
CREATE POLICY "promo_code_uses_insert" ON promo_code_uses
  FOR INSERT WITH CHECK (true);
```

```sql
CREATE POLICY "promo_code_uses_select" ON promo_code_uses
  FOR SELECT USING (user_id = auth.uid());
```

```sql
CREATE POLICY "promo_code_uses_insert" ON promo_code_uses FOR INSERT
      WITH CHECK (promo_code_id IS NOT NULL);
```

#### promo_codes (RLS: ENABLED)

```sql
CREATE POLICY "promo_codes_select" ON promo_codes
  FOR SELECT USING (is_active = true);
```

```sql
CREATE POLICY "promo_codes_admin" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### provisioning_events (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "provisioning_events_select" ON provisioning_events FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

```sql
CREATE POLICY "provisioning_events_insert" ON provisioning_events FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

#### push_subscriptions (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
```

#### quiz_questions (RLS: ENABLED)

```sql
CREATE POLICY "quiz_questions_admin_all" ON public.quiz_questions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);
```

```sql
CREATE POLICY "quiz_questions_student_read" ON public.quiz_questions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    JOIN public.courses ON courses.id = quizzes.course_id
    WHERE quizzes.id = quiz_questions.quiz_id
    AND courses.is_published = true
  )
);
```

#### quizzes (RLS: ENABLED)

```sql
CREATE POLICY "quizzes_admin_all" ON public.quizzes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'instructor')
  )
);
```

```sql
CREATE POLICY "quizzes_student_read" ON public.quizzes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = quizzes.course_id
    AND courses.is_published = true
  )
);
```

#### rapids_apprentices (RLS: ENABLED)

```sql
CREATE POLICY "Admins can manage RAPIDS apprentices" ON rapids_apprentices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

```sql
CREATE POLICY "Users can view own RAPIDS record" ON rapids_apprentices
  FOR SELECT USING (user_id = auth.uid());
```

#### rapids_employers (RLS: ENABLED)

```sql
CREATE POLICY "Admins can manage RAPIDS employers" ON rapids_employers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### rapids_progress_updates (RLS: ENABLED)

```sql
CREATE POLICY "Admins can manage RAPIDS progress" ON rapids_progress_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### rapids_submissions (RLS: ENABLED)

```sql
CREATE POLICY "Admins can manage RAPIDS submissions" ON rapids_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### roles (RLS: ENABLED)

```sql
CREATE POLICY "roles_public_read" ON public.roles
FOR SELECT USING (true);
```

```sql
CREATE POLICY "roles_admin_all" ON public.roles
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

#### search_index (RLS: ENABLED)

```sql
CREATE POLICY "Public read search_index" ON search_index FOR SELECT USING (is_active = true);
```

#### sfc_tax_documents (RLS: ENABLED)

```sql
CREATE POLICY sfc_tax_documents_service_all ON public.sfc_tax_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

#### sfc_tax_returns (RLS: ENABLED)

```sql
CREATE POLICY sfc_tax_returns_service_all ON public.sfc_tax_returns
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

#### shop_applications (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "shop_applications_insert" ON shop_applications FOR INSERT
      WITH CHECK (shop_name IS NOT NULL AND LENGTH(shop_name) <= 255 AND contact_email IS NOT NULL AND contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

#### site_content (RLS: ENABLED)

```sql
CREATE POLICY "Public can view active site content" ON site_content FOR SELECT USING (is_active = true);
```

#### site_settings (RLS: ENABLED)

```sql
CREATE POLICY "Public read" ON site_settings FOR SELECT USING (true);
```

```sql
CREATE POLICY "Service role write" ON site_settings FOR ALL USING (auth.role() = 'service_role');
```

#### sms_messages (RLS: ENABLED)

```sql
CREATE POLICY "Admin access" ON sms_messages FOR ALL USING (auth.uid() IS NOT NULL);
```

#### sms_templates (RLS: ENABLED)

```sql
CREATE POLICY "Admin read" ON sms_templates FOR SELECT USING (auth.uid() IS NOT NULL);
```

```sql
CREATE POLICY "Service role write" ON sms_templates FOR ALL USING (auth.role() = 'service_role');
```

#### staff_applications (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "staff_applications_insert" ON staff_applications FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND full_name IS NOT NULL AND LENGTH(full_name) <= 255);
```

#### store_cards (RLS: ENABLED)

```sql
CREATE POLICY "Public read store_cards" ON store_cards FOR SELECT USING (is_active = true);
```

#### stripe_price_enrollment_map (RLS: ENABLED)

```sql
CREATE POLICY "Admins can manage stripe price mappings" ON stripe_price_enrollment_map
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

```sql
CREATE POLICY "Service role can read stripe mappings" ON stripe_price_enrollment_map
  FOR SELECT USING (true);
```

#### student_applications (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "student_applications_insert" ON student_applications FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND full_name IS NOT NULL AND LENGTH(full_name) <= 255);
```

#### student_enrollments (RLS: ENABLED)

```sql
CREATE POLICY "Students can view own enrollments" ON public.student_enrollments
  FOR SELECT USING (auth.uid() = student_id);
```

```sql
CREATE POLICY "Service role full access" ON public.student_enrollments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

```sql
CREATE POLICY "Staff can view all enrollments" ON public.student_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff', 'instructor')
    )
  );
```

#### student_hours (RLS: ENABLED)

```sql
CREATE POLICY "Students can view own hours" ON student_hours
  FOR SELECT USING (student_id = auth.uid());
```

```sql
CREATE POLICY "Staff can view all hours" ON student_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'instructor', 'admin', 'super_admin')
    )
  );
```

```sql
CREATE POLICY "Students can view own hours" ON student_hours
  FOR SELECT USING (student_id = auth.uid());
```

```sql
CREATE POLICY "Students can insert own hours" ON student_hours
  FOR INSERT WITH CHECK (student_id = auth.uid());
```

```sql
CREATE POLICY "Staff can manage all hours" ON student_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'instructor', 'admin', 'super_admin')
    )
  );
```

#### student_tasks (RLS: ENABLED)

```sql
CREATE POLICY "Students can view own tasks" ON student_tasks
  FOR SELECT USING (student_id = auth.uid());
```

```sql
CREATE POLICY "Students can update own tasks" ON student_tasks
  FOR UPDATE USING (student_id = auth.uid());
```

```sql
CREATE POLICY "Staff can manage all tasks" ON student_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('staff', 'instructor', 'admin', 'super_admin')
    )
  );
```

#### studio_files (RLS: ENABLED)

```sql
CREATE POLICY studio_files_select ON studio_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );
```

```sql
CREATE POLICY studio_files_insert ON studio_files
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );
```

```sql
CREATE POLICY studio_files_update ON studio_files
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );
```

```sql
CREATE POLICY studio_files_delete ON studio_files
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );
```

#### studio_terminal_commands (RLS: ENABLED)

```sql
CREATE POLICY studio_terminal_commands_select ON studio_terminal_commands
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM studio_terminal_sessions WHERE id = session_id AND user_id = auth.uid())
  );
```

```sql
CREATE POLICY studio_terminal_commands_insert ON studio_terminal_commands
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM studio_terminal_sessions WHERE id = session_id AND user_id = auth.uid())
  );
```

#### studio_terminal_sessions (RLS: ENABLED)

```sql
CREATE POLICY studio_terminal_sessions_select ON studio_terminal_sessions
  FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY studio_terminal_sessions_insert ON studio_terminal_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY studio_terminal_sessions_update ON studio_terminal_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

#### studio_workspaces (RLS: ENABLED)

```sql
CREATE POLICY studio_workspaces_select ON studio_workspaces
  FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY studio_workspaces_insert ON studio_workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY studio_workspaces_update ON studio_workspaces
  FOR UPDATE USING (auth.uid() = user_id);
```

```sql
CREATE POLICY studio_workspaces_delete ON studio_workspaces
  FOR DELETE USING (auth.uid() = user_id);
```

#### study_group_members (RLS: ENABLED)

```sql
CREATE POLICY "Public read" ON study_group_members FOR SELECT USING (true);
```

```sql
CREATE POLICY "Auth join" ON study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### study_groups (RLS: ENABLED)

```sql
CREATE POLICY "Public read" ON study_groups FOR SELECT USING (true);
```

```sql
CREATE POLICY "Auth insert" ON study_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

#### success_stories (RLS: ENABLED)

```sql
CREATE POLICY "Public can view approved success stories" ON success_stories FOR SELECT USING (approved = true);
```

#### tax_appointments (RLS: ENABLED)

```sql
CREATE POLICY "tax_appointments_insert" ON tax_appointments FOR INSERT
      WITH CHECK (client_name IS NOT NULL AND LENGTH(client_name) <= 255 AND client_email IS NOT NULL AND client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND appointment_date IS NOT NULL AND appointment_date >= CURRENT_DATE);
```

#### tax_audit_log (RLS: ENABLED)

```sql
CREATE POLICY "Admins can view audit log" ON tax_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );
```

```sql
CREATE POLICY "Anyone can create audit entries" ON tax_audit_log
  FOR INSERT WITH CHECK (true);
```

#### tax_clients (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own client record" ON tax_clients
  FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can insert own client record" ON tax_clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can update own client record" ON tax_clients
  FOR UPDATE USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Admins can view all clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );
```

```sql
CREATE POLICY "Admins full access to clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );
```

```sql
CREATE POLICY "Office staff can access office clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tax_preparers 
      WHERE tax_preparers.office_id = tax_clients.office_id 
      AND tax_preparers.user_id = auth.uid()
      AND tax_preparers.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM tax_offices 
      WHERE tax_offices.id = tax_clients.office_id 
      AND tax_offices.owner_id = auth.uid()
    )
  );
```

#### tax_document_uploads (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "tax_document_uploads_insert" ON tax_document_uploads FOR INSERT
      WITH CHECK (appointment_id IS NOT NULL AND file_name IS NOT NULL AND LENGTH(file_name) <= 255);
```

#### tax_intake (RLS: NOT IN MIGRATIONS)

```sql
CREATE POLICY "tax_intake_insert" ON tax_intake FOR INSERT
      WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND full_name IS NOT NULL AND LENGTH(full_name) <= 255);
```

#### tax_offices (RLS: ENABLED)

```sql
CREATE POLICY "Franchise admin full access to offices" ON tax_offices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );
```

```sql
CREATE POLICY "Office owners can view own office" ON tax_offices
  FOR SELECT USING (owner_id = auth.uid());
```

```sql
CREATE POLICY "Office owners can update own office" ON tax_offices
  FOR UPDATE USING (owner_id = auth.uid());
```

#### tax_preparers (RLS: ENABLED)

```sql
CREATE POLICY "Admins full access to preparers" ON tax_preparers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );
```

```sql
CREATE POLICY "Office owners can manage their preparers" ON tax_preparers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tax_offices 
      WHERE tax_offices.id = tax_preparers.office_id 
      AND tax_offices.owner_id = auth.uid()
    )
  );
```

```sql
CREATE POLICY "Preparers can view own record" ON tax_preparers
  FOR SELECT USING (user_id = auth.uid());
```

#### tax_returns (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own tax returns" ON tax_returns
  FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can insert own tax returns" ON tax_returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can update own tax returns" ON tax_returns
  FOR UPDATE USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Admins can view all tax returns" ON tax_returns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );
```

#### team_members (RLS: ENABLED)

```sql
CREATE POLICY "Public can view active team members" ON team_members FOR SELECT USING (is_active = true);
```

#### testimonials (RLS: ENABLED)

```sql
CREATE POLICY "Public can view approved testimonials" ON testimonials FOR SELECT USING (approved = true);
```

```sql
CREATE POLICY "Public can view published testimonials" ON testimonials
  FOR SELECT USING (published = true);
```

```sql
CREATE POLICY "Admins can manage testimonials" ON testimonials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### timeclock_shifts (RLS: ENABLED)

```sql
CREATE POLICY "Apprentices can view own shifts" ON timeclock_shifts
  FOR SELECT USING (
    apprentice_id IN (
      SELECT id FROM apprentices WHERE user_id = auth.uid()
    )
  );
```

```sql
CREATE POLICY "Admins can manage shifts" ON timeclock_shifts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );
```

#### training_programs (RLS: ENABLED)

```sql
CREATE POLICY "Anyone can view active training programs" ON training_programs
  FOR SELECT USING (is_active = true);
```

```sql
CREATE POLICY "Admins can manage training programs" ON training_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

#### transfer_hour_submissions (RLS: ENABLED)

```sql
CREATE POLICY "Service role full access transfer_hour_submissions" ON transfer_hour_submissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

```sql
CREATE POLICY "Public can insert transfer submissions" ON transfer_hour_submissions
  FOR INSERT TO anon WITH CHECK (true);
```

#### transfer_requests (RLS: ENABLED)

```sql
CREATE POLICY "Service role full access transfer_requests" ON transfer_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

#### turnstile_verifications (RLS: ENABLED)

```sql
CREATE POLICY "Anyone insert" ON turnstile_verifications FOR INSERT WITH CHECK (true);
```

```sql
CREATE POLICY "Service role read" ON turnstile_verifications FOR SELECT USING (auth.role() = 'service_role');
```

#### user_activity (RLS: ENABLED)

```sql
CREATE POLICY "Admin read" ON user_activity FOR SELECT USING (auth.uid() IS NOT NULL);
```

```sql
CREATE POLICY "Anyone insert" ON user_activity FOR INSERT WITH CHECK (true);
```

#### user_learning_paths (RLS: ENABLED)

```sql
CREATE POLICY "Own paths" ON user_learning_paths FOR ALL USING (auth.uid() = user_id);
```

#### user_roles (RLS: ENABLED)

```sql
CREATE POLICY "user_roles_read_own" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());
```

```sql
CREATE POLICY "user_roles_admin_all" ON public.user_roles
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
```

#### user_skills (RLS: ENABLED)

```sql
CREATE POLICY "Own skills" ON user_skills FOR ALL USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Public read" ON user_skills FOR SELECT USING (true);
```

#### video_engagement (RLS: ENABLED)

```sql
CREATE POLICY "Anyone can insert" ON video_engagement FOR INSERT WITH CHECK (true);
```

```sql
CREATE POLICY "Service role read" ON video_engagement FOR SELECT USING (auth.role() = 'service_role');
```

#### wishlists (RLS: ENABLED)

```sql
CREATE POLICY "Users can view own wishlists" ON wishlists FOR SELECT USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can add to own wishlist" ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
```

```sql
CREATE POLICY "Users can remove from own wishlist" ON wishlists FOR DELETE USING (auth.uid() = user_id);
```

```sql
CREATE POLICY "Admins can view all wishlists" ON wishlists FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));
```

#### wotc_applications (RLS: ENABLED)

```sql
CREATE POLICY "Admin full access to wotc" ON wotc_applications FOR ALL USING (true);
```

### Tables with RLS Enabled but No Policies

| Table | Rows |
|-------|------|
| admin_checkout_sessions | 0 |
| apprentice_sites | 1 |
| approved_payment_links | 0 |
| barber_subscriptions | 1 |
| certificates | 2 |
| checkout_contexts | 1 |
| content_versions | 0 |
| forum_categories | 0 |
| forum_replies | 0 |
| forum_topics | 0 |
| forum_upvotes | 0 |
| license_agreement_acceptances | 21 |
| license_events | 1 |
| license_validations | 0 |
| ocr_extractions | 0 |
| organization_roles | 0 |
| organization_settings | 1 |
| partner_document_requirements | 0 |
| partner_documents | 0 |
| partner_export_logs | 1 |
| payments | 0 |
| preparer_payouts | 0 |
| progress_entries | 0 |
| sezzle_card_events | 0 |
| social_media_posts | 0 |
| social_media_settings | 0 |
| staff_permissions | 0 |
| tax_1099_income | 0 |
| tax_dependents | 0 |
| tax_fee_schedules | 0 |
| tax_itemized_deductions | 0 |
| tax_schedule_c | 0 |
| tax_w2_income | 0 |
| tenant_domains | 0 |
| user_documents | 0 |
| user_onboarding_status | 0 |

### Tables with No RLS and No Policies (with data)

| Table | Rows | Has tenant_id | Has org_id |
|-------|------|---------------|------------|
| users | 669 | no | YES |
| training_lessons | 540 | no | no |
| user_capabilities | 514 | no | no |
| partner_courses | 329 | no | no |
| partner_lms_courses | 329 | no | no |
| stripe_webhook_events | 214 | no | no |
| scraping_attempts | 107 | no | no |
| training_enrollments | 91 | no | no |
| external_partner_modules | 88 | no | no |
| program_partner_lms | 79 | no | no |
| application_checklist | 76 | no | no |
| v_applications | 76 | no | no |
| training_courses | 60 | no | no |
| programs | 55 | YES | YES |
| modules | 43 | no | no |
| v_active_programs | 43 | no | YES |
| v_published_programs | 43 | no | YES |
| products | 40 | no | no |
| indiana_hour_categories | 25 | no | no |
| achievements | 22 | no | no |
| partner_courses_catalog | 21 | no | no |
| shop_required_docs_status | 20 | no | no |
| permissions | 16 | no | no |
| partner_lms_providers | 14 | no | no |
| analytics_events | 11 | no | no |
| donations | 10 | no | no |
| shop_document_requirements | 10 | no | no |
| shop_products | 10 | no | no |
| enrollment_steps | 9 | no | no |
| staff_training_modules | 8 | no | no |
| course_modules | 7 | no | no |
| credentialing_partners | 7 | no | no |
| credentials | 7 | no | no |
| program_required_courses | 7 | no | no |
| course_credentials | 6 | no | no |
| help_categories | 6 | no | no |
| tenants | 6 | no | no |
| assignments | 5 | no | no |
| discussion_forums | 5 | no | no |
| help_articles | 5 | no | no |
| interactive_quizzes | 5 | no | no |
| job_postings | 5 | no | no |
| marketing_campaigns | 5 | YES | no |
| marketing_contacts | 5 | YES | no |
| qa_checklists | 5 | no | no |
| shop_categories | 5 | no | no |
| admin_applications_queue | 4 | no | no |
| apprenticeship_programs | 4 | no | no |
| community_events | 4 | no | no |
| learning_paths | 4 | no | no |
| social_media_accounts | 4 | no | no |
| forum_threads | 3 | no | no |
| timeclock_cron_runs | 3 | no | no |
| audit_snapshot | 2 | no | no |
| etpl_metrics | 2 | no | no |
| shop_staff | 2 | no | no |
| shops | 2 | no | no |
| x | 2 | no | no |
| ai_instructors | 1 | no | no |
| apprentice_placements | 1 | no | no |
| apprentice_weekly_reports | 1 | no | no |
| apprenticeship_enrollments | 1 | no | no |
| employers | 1 | no | no |
| license_usage | 1 | YES | no |
| organization_users | 1 | no | YES |
| organizations | 1 | no | no |
| partner_enrollment_summary | 1 | no | no |
| partner_lms_enrollments | 1 | no | no |
| program_holders | 1 | no | no |
| state_compliance | 1 | no | no |
| store_instances | 1 | no | no |
| tenant_licenses | 1 | YES | no |
| tenant_memberships | 1 | YES | no |

## Queries Used

```
1. RLS enable detection:
   grep "ENABLE ROW LEVEL SECURITY" supabase/migrations/*.sql

2. Policy extraction:
   Regex parse of CREATE POLICY statements from all 493 migration files

3. Live enforcement verification:
   Anon client: createClient(URL, ANON_KEY).from(table).select('*', { count: 'exact', head: true })
   Service client: createClient(URL, SERVICE_ROLE_KEY).from(table).select('*', { count: 'exact', head: true })
   Comparison: if anon gets 0 rows but service gets >0, RLS is enforced

4. INSERT test:
   Anon client: .from(table).insert({ id: '00000000-...' })
   All 18 key tables returned policy violation errors -> INSERT blocked for anon
```
