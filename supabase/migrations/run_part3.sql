-- Part 3 of 6: Create tables

CREATE TABLE IF NOT EXISTS forum_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_thread_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS foundation_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  description text,
  elevateforhumanity text,
  schedule text,
  years_sober text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_change_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  gov text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric DEFAULT 0,
  status text DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gamification_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generated_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grade_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grant_eligibility_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grant_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency text,
  draft text,
  due_date timestamptz,
  intake text,
  jpg text,
  ready text,
  status text DEFAULT 'active',
  submitted text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grant_federal_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grant_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grant_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grant_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grant_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grant_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  awarded text,
  confirmation_number text,
  elevateforhumanity text,
  entity text,
  grant text,
  jpg text,
  other text,
  portal_url text,
  rejected text,
  status text DEFAULT 'active',
  submitted text,
  submitted_at timestamptz,
  submitted_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency text,
  draft text,
  due_date timestamptz,
  intake text,
  jpg text,
  ready text,
  status text DEFAULT 'active',
  submitted text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS handbook_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  pdf text,
  slug text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_search_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hour_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hours_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hours_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text,
  date timestamptz,
  description text,
  hours integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hsi_course_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name text,
  hsi_enrollment_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS id_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  first_name text,
  id_type text,
  last_name text,
  profiles jsonb DEFAULT '[]',
  rejection_reason text,
  status text DEFAULT 'active',
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS impact_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS impact_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric DEFAULT 0,
  description text,
  donor_name text,
  is_anonymous text,
  stripe text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incentives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  jpg text,
  programs text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intake_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  integration text,
  is_active boolean DEFAULT false,
  jpg text,
  note text,
  schedule text,
  slug text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate text,
  date timestamptz,
  interview_type text,
  jobs text,
  outcome text,
  position text,
  profiles jsonb DEFAULT '[]',
  scheduled_at timestamptz,
  status text DEFAULT 'active',
  time text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issued_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text,
  desc text,
  location text,
  position text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text,
  description text,
  elevateforhumanity text,
  employment_type text,
  gov text,
  irs text,
  jpg text,
  location text,
  max_salary text,
  min_salary text,
  pay text,
  png text,
  requirements text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jri_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learner_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS learner_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS learner_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_enhancements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS license_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS license_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS license_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  all text,
  amount numeric DEFAULT 0,
  clicked_count integer DEFAULT 0,
  expected_close_date date,
  opened_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  stage text,
  subject text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS license_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answer text,
  content text,
  description text,
  elevateforhumanity text,
  featured text,
  features text,
  organization text,
  popular text,
  price numeric DEFAULT 0,
  pricing text,
  question text,
  schedule text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lti_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  creator_name text,
  duration_hours text,
  elevateforhumanity text,
  image_url text,
  jpg text,
  price numeric DEFAULT 0,
  rating text,
  slug text,
  student_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  is_verified text,
  products_count integer DEFAULT 0,
  profile text,
  rating text,
  store_name text,
  total_sales text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  host_id uuid,
  scheduled_at timestamptz,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mentor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz,
  duration integer DEFAULT 0,
  duration_minutes text,
  enrollments text,
  mentee text,
  mentee_id uuid,
  profiles jsonb DEFAULT '[]',
  program text,
  progress text,
  scheduled_at timestamptz,
  session_type text,
  sessions text,
  status text DEFAULT 'active',
  time text,
  topic text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mentorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz,
  enrollments text,
  mentee text,
  mentee_id uuid,
  profiles jsonb DEFAULT '[]',
  program text,
  progress text,
  scheduled_at timestamptz,
  sessions text,
  status text DEFAULT 'active',
  time text,
  topic text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milady_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milady_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milady_license_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milady_orientation_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milady_provisioning_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milady_rise_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  documents_submitted_at timestamptz,
  duration_minutes text,
  has text,
  module_id uuid,
  order_index text,
  orientation_completed_at timestamptz,
  programs text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mous (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_date date,
  elevateforhumanity text,
  expiry_date date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS navigation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  elevateforhumanity text,
  excerpt text,
  image_url text,
  published_at timestamptz,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  elevateforhumanity text,
  excerpt text,
  image_url text,
  published_at timestamptz,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nonprofit_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  age text,
  all text,
  content text,
  date timestamptz,
  description text,
  elevateforhumanity text,
  jpg text,
  png text,
  schedule text,
  webp text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ojt_hours_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ojt_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ojt_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role text DEFAULT 'member',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orientation_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_acknowledgment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fri_hours text,
  mon_hours text,
  notes text,
  program_slug text,
  sat_hours text,
  student_id uuid,
  sun_hours text,
  thu_hours text,
  tue_hours text,
  wed_hours text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_course_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_lms_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active text,
  api_key text,
  api_url text,
  auto_sync text,
  course_name text,
  course_url text,
  error_message text,
  hours integer DEFAULT 0,
  last_sync text,
  logo_url text,
  provider_name text,
  provider_type text,
  records_synced text,
  send_notifications text,
  status text DEFAULT 'active',
  sync_frequency text,
  sync_type text,
  track_progress text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  file_url text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  absent boolean DEFAULT false,
  absent_count integer DEFAULT 0,
  date timestamptz,
  end_time text,
  enrolled_count integer DEFAULT 0,
  present integer DEFAULT 0,
  present_count integer DEFAULT 0,
  scheduled_date date,
  start_time text,
  time text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pathways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blue text,
  credential text,
  description text,
  duration integer DEFAULT 0,
  elevateforhumanity text,
  format text,
  funding text,
  industry text,
  location text,
  outcomes text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_plan_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  host_id uuid,
  scheduled_at timestamptz,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
