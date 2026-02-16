-- Consolidated Migration: Ensure All Required Tables Exist
-- Run this in Supabase SQL Editor to create any missing tables
-- Safe to run multiple times (uses IF NOT EXISTS)

-- ============================================================================
-- EMPLOYMENT TRACKING (WIOA Compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID,
  
  employer_name TEXT,
  job_title TEXT,
  employment_start_date DATE,
  employment_end_date DATE,
  
  hourly_wage DECIMAL(10,2),
  hours_per_week DECIMAL(5,2),
  annual_salary DECIMAL(12,2),
  
  verified_2nd_quarter BOOLEAN DEFAULT false,
  verified_2nd_quarter_date DATE,
  wage_2nd_quarter DECIMAL(10,2),
  
  verified_4th_quarter BOOLEAN DEFAULT false,
  verified_4th_quarter_date DATE,
  wage_4th_quarter DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_employment_tracking_student ON public.employment_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_employment_tracking_enrollment ON public.employment_tracking(enrollment_id);

-- ============================================================================
-- CREDENTIAL VERIFICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.credential_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID,
  
  credential_type TEXT NOT NULL,
  credential_name TEXT NOT NULL,
  credential_number TEXT,
  issuing_organization TEXT,
  issue_date DATE,
  expiration_date DATE,
  
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')) DEFAULT 'pending',
  verified_date DATE,
  verified_by UUID REFERENCES auth.users(id),
  verification_method TEXT,
  verification_url TEXT,
  
  state_registry_id TEXT,
  state_registry_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_credential_verification_student ON public.credential_verification(student_id);
CREATE INDEX IF NOT EXISTS idx_credential_verification_status ON public.credential_verification(verification_status);

-- ============================================================================
-- TRAINING HOURS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID,
  
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  activity_type TEXT,
  description TEXT,
  
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_hours_student ON public.training_hours(student_id);
CREATE INDEX IF NOT EXISTS idx_training_hours_date ON public.training_hours(date);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- ============================================================================
-- CONSENT RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  version TEXT NOT NULL,
  consented BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user ON public.consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_type ON public.consent_records(consent_type);

-- ============================================================================
-- COMMUNITY POSTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_author ON public.community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts(category);

-- ============================================================================
-- COMMUNITY COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.community_comments(id),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON public.community_comments(author_id);

-- ============================================================================
-- COMMUNITY EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_url TEXT,
  max_attendees INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_events_start ON public.community_events(start_time);
CREATE INDEX IF NOT EXISTS idx_community_events_type ON public.community_events(event_type);

-- ============================================================================
-- STUDY GROUPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID,
  program_id UUID,
  max_members INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_groups_course ON public.study_groups(course_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_program ON public.study_groups(program_id);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- ============================================================================
-- SUPPORT TICKETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- ============================================================================
-- CUSTOMER SERVICE TICKETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_service_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_status ON public.customer_service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_customer_service_tickets_email ON public.customer_service_tickets(customer_email);

-- ============================================================================
-- VITA APPOINTMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vita_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vita_appointments_user ON public.vita_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_vita_appointments_date ON public.vita_appointments(appointment_date);

-- ============================================================================
-- TAX FILINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tax_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  filing_status TEXT,
  gross_income DECIMAL(12,2),
  adjusted_gross_income DECIMAL(12,2),
  refund_amount DECIMAL(12,2),
  status TEXT DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_filings_user ON public.tax_filings(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_filings_year ON public.tax_filings(tax_year);

-- ============================================================================
-- PARTNERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_type ON public.partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partners(status);

-- ============================================================================
-- WORKSITE PARTNERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.worksite_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  program_id UUID,
  site_name TEXT NOT NULL,
  site_address TEXT,
  supervisor_name TEXT,
  supervisor_email TEXT,
  supervisor_phone TEXT,
  max_apprentices INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worksite_partners_partner ON public.worksite_partners(partner_id);
CREATE INDEX IF NOT EXISTS idx_worksite_partners_program ON public.worksite_partners(program_id);

-- ============================================================================
-- APPRENTICE ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.apprentice_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  worksite_id UUID REFERENCES public.worksite_partners(id) ON DELETE CASCADE,
  enrollment_id UUID,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apprentice_assignments_student ON public.apprentice_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_assignments_worksite ON public.apprentice_assignments(worksite_id);

-- ============================================================================
-- ANALYTICS EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_data JSONB,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.employment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vita_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worksite_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprentice_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BASIC RLS POLICIES
-- ============================================================================

-- Users can view their own data
CREATE POLICY IF NOT EXISTS "users_view_own" ON public.employment_tracking FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY IF NOT EXISTS "users_view_own" ON public.credential_verification FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY IF NOT EXISTS "users_view_own" ON public.training_hours FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY IF NOT EXISTS "users_view_own" ON public.consent_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "users_view_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "users_view_own" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "users_view_own" ON public.vita_appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "users_view_own" ON public.tax_filings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "users_view_own" ON public.apprentice_assignments FOR SELECT USING (auth.uid() = student_id);

-- Public read for community content
CREATE POLICY IF NOT EXISTS "public_read" ON public.community_posts FOR SELECT USING (is_published = true);
CREATE POLICY IF NOT EXISTS "public_read" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read" ON public.community_events FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read" ON public.study_groups FOR SELECT USING (is_public = true);
CREATE POLICY IF NOT EXISTS "public_read" ON public.partners FOR SELECT USING (status = 'active');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON public.community_posts TO authenticated;
GRANT INSERT, UPDATE ON public.community_comments TO authenticated;
GRANT INSERT ON public.consent_records TO authenticated;
GRANT INSERT ON public.support_tickets TO authenticated;
GRANT UPDATE ON public.notifications TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully';
  RAISE NOTICE 'Tables created/verified: employment_tracking, credential_verification, training_hours, audit_logs, consent_records, community_posts, community_comments, community_events, study_groups, notifications, support_tickets, customer_service_tickets, vita_appointments, tax_filings, partners, worksite_partners, apprentice_assignments, analytics_events';
END $$;
