-- Part 4 of 6: Create tables

CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS performance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text,
  amount numeric DEFAULT 0,
  benefits text,
  business_name text,
  city text,
  company text,
  contact_email text,
  contact_phone text,
  cover text,
  dba text,
  dba_name text,
  desc text,
  description text,
  elevateforhumanity text,
  email text,
  employee_count integer DEFAULT 0,
  impact text,
  industry text,
  is_anonymous text,
  jpg text,
  location text,
  phone text,
  position text,
  verified boolean DEFAULT false,
  website text,
  year_established text,
  zip_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  features text,
  schedule text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  features text,
  jpg text,
  price numeric DEFAULT 0,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenticeship text,
  description text,
  elevateforhumanity text,
  gov text,
  jpg text,
  png text,
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_banner_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_completion_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com text,
  elevateforhumanity text,
  issued_at timestamptz,
  jpg text,
  module_name text,
  partner_courses text,
  program_name text,
  qrserver text,
  users text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text,
  content text,
  likes text,
  pinned text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  all text,
  author text,
  author_id uuid,
  content text,
  likes text,
  pinned text,
  reply_count integer DEFAULT 0,
  slug text,
  views text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_funding_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_holder_banking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  all text,
  banking text,
  document_type text,
  documents text,
  file_name text,
  organization_name text,
  verification_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_holder_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric DEFAULT 0,
  status text DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provisioning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public_ai_tutor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_reason text,
  ip_hash text,
  question_length text,
  response_length text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_notification_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS question_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recap_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refund_advance_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimated_amount text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reporting_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reporting_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reporting_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reporting_funding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reporting_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reporting_verdicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch text,
  content text,
  description text,
  duration integer DEFAULT 0,
  elevateforhumanity text,
  jpg text,
  reply_count integer DEFAULT 0,
  slug text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rise_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  description text,
  elevateforhumanity text,
  image_url text,
  jpg text,
  slug text,
  start_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rise_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  description text,
  elevateforhumanity text,
  image_url text,
  jpg text,
  slug text,
  start_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sam_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gov text,
  status text DEFAULT 'active',
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sam_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gov text,
  status text DEFAULT 'active',
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sam_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gov text,
  status text DEFAULT 'active',
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sam_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scorm_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scorm_cmi_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scorm_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  host_id uuid,
  scheduled_at timestamptz,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scraper_detection_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS script_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS script_deviations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com text,
  description text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_checkin_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  average_rating text,
  category text,
  compare_at_price text,
  creator_profiles text,
  description text,
  elevateforhumanity text,
  images text,
  is_free text,
  price numeric DEFAULT 0,
  shop_profiles text,
  thumbnail_url text,
  total_enrollments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid,
  progress text,
  skills text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS slow_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  file_url text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS snap_outreach_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS soc_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_media_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ssn_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text,
  avatar_url text,
  city text,
  description text,
  duration integer DEFAULT 0,
  elevateforhumanity text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS state_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blue text,
  description text,
  duration integer DEFAULT 0,
  elevateforhumanity text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_ai_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_ai_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_funding_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid,
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_risk_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  code text,
  days_since_activity text,
  dropped text,
  email text,
  enrollments text,
  first_name text,
  last_activity_date date,
  last_name text,
  overdue_count integer DEFAULT 0,
  phone text,
  profiles jsonb DEFAULT '[]',
  program_id uuid,
  programs text,
  progress_percentage numeric DEFAULT 0,
  status text DEFAULT 'active',
  student_funding_assignments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_pr_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric DEFAULT 0,
  status text DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_workflow_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric DEFAULT 0,
  status text DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sub_office_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  content text,
  elevateforhumanity text,
  excerpt text,
  ilike text,
  slug text,
  tags text,
  views text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  description text,
  elevateforhumanity text,
  schedule text,
  years_sober text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  features text,
  jpg text,
  start_date timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text,
  value text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_filing_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  email text,
  fee_amount text,
  first_name text,
  jpg text,
  last_name text,
  preparer_id uuid,
  status text DEFAULT 'active',
  tax_year text,
  tsx text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_return_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answer text,
  com text,
  consequence text,
  cta text,
  description text,
  elevateforhumanity text,
  features text,
  items text,
  jpg text,
  mistake text,
  period text,
  popular text,
  price numeric DEFAULT 0,
  question text,
  solution text,
  tsx text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  gov text,
  irs text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
