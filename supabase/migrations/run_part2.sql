-- Part 2 of 6: Create tables

CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_manager_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avatar_url text,
  city text,
  content text,
  courses jsonb DEFAULT '[]',
  due_date timestamptz,
  email text,
  enrolled_at timestamptz,
  first_name text,
  last_name text,
  phone text,
  profiles jsonb DEFAULT '[]',
  programs text,
  progress text,
  status text DEFAULT 'active',
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  jpg text,
  logo_url text,
  results jsonb DEFAULT '[]',
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cash_advance_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approved boolean DEFAULT false,
  approved_amount text,
  email text,
  epstax text,
  first_name text,
  jpg text,
  last_name text,
  monthly_income text,
  requested_amount text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cert_revocation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certification_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certification_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_type_id uuid,
  earned_date timestamptz,
  elevateforhumanity text,
  profiles jsonb DEFAULT '[]',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certiport_exam_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  code text,
  exam_code text,
  funding_source text,
  get text,
  json text,
  location text,
  path text,
  status text DEFAULT 'active',
  voucher_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  host_id uuid,
  scheduled_at timestamptz,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_hours_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS code_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com text,
  description text,
  elevateforhumanity text,
  language text,
  path text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collaboration_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collaboration_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  event_id uuid,
  event_type text,
  image_url text,
  location_address text,
  location_type text,
  max_attendees integer DEFAULT 0,
  start_date timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  description text,
  elevateforhumanity text,
  group_id uuid,
  image_url text,
  is_public boolean DEFAULT false,
  member_count integer DEFAULT 0,
  members jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role text DEFAULT 'member',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competency_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  all text,
  email text,
  enrollment_status text,
  full_name text,
  program_id uuid,
  programs text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text,
  value text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cookie_consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS copilot_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_completion_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  jpg text,
  profiles jsonb DEFAULT '[]',
  replies text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignments text,
  completed_at timestamptz,
  courses jsonb DEFAULT '[]',
  final_grade text,
  grade text,
  graded_at timestamptz,
  max_score text,
  programs text,
  progress text,
  score numeric DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid,
  courses jsonb DEFAULT '[]',
  description text,
  elevateforhumanity text,
  file_url text,
  has text,
  resource_id uuid,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  rating integer,
  comment text,
  target_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  abort text,
  average_rating text,
  category text,
  code text,
  com text,
  compare_at_price text,
  connected text,
  creator_profiles text,
  description text,
  elevateforhumanity text,
  elevateforhumanityeducation text,
  images text,
  is_free text,
  objects text,
  org text,
  path text,
  price numeric DEFAULT 0,
  route text,
  shop_profiles text,
  signal text,
  status text DEFAULT 'active',
  tables text,
  thumbnail_url text,
  total_enrollments text,
  txt text,
  www text,
  xml text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credential_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_code text,
  credential_id uuid,
  elevateforhumanity text,
  expires_at timestamptz,
  one_time_use text,
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cta_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS curvature_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS curvature_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  rating integer,
  comment text,
  target_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS curvature_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS demo_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devstudio_chat_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS direct_message_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  add text,
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text,
  content text,
  date timestamptz,
  description text,
  duration integer DEFAULT 0,
  elevateforhumanity text,
  is_pinned boolean DEFAULT false,
  likes text,
  member_count integer DEFAULT 0,
  profiles jsonb DEFAULT '[]',
  replies text,
  reply_count integer DEFAULT 0,
  slug text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  com text,
  description text,
  elevateforhumanity text,
  language text,
  path text,
  reply_count integer DEFAULT 0,
  slug text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donation_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric DEFAULT 0,
  description text,
  donor_name text,
  is_anonymous text,
  stripe text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drug_test_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drug_testing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drug_testing_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drug_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ecr_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employer_incentives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employer_sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollment_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollment_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_count integer DEFAULT 0,
  email text,
  enrollment_id uuid,
  first_name text,
  job_type text,
  last_error text,
  last_name text,
  max_attempts text,
  program_enrollments text,
  scheduled_for text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollment_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric DEFAULT 0,
  status text DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entity_eligibility_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_attempt_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  rating integer,
  comment text,
  target_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  rating integer,
  comment text,
  target_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ferpa_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz,
  description text,
  due_date timestamptz,
  priority text,
  purpose text,
  records_requested text,
  request_type text,
  requester_email text,
  requester_name text,
  requester_phone text,
  requester_relationship text,
  status text DEFAULT 'active',
  student_email text,
  student_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ferpa_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ferpa_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  all_day boolean DEFAULT false,
  date timestamptz,
  description text,
  event_type text,
  other text,
  start_date timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ferpa_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  document_type text,
  file_url text,
  html text,
  url text,
  version text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ferpa_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  file_url text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_assurances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric DEFAULT 0,
  expiration_date date,
  issue_date date,
  provider text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

