-- Migration: Create 80 live DB tables that lack migration files
-- Part 5 of 5
-- These tables already exist in the live Supabase DB but had no CREATE TABLE migration.
-- Using IF NOT EXISTS so this is safe to run even if tables are already present.

CREATE TABLE IF NOT EXISTS studio_chat_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  repo_id uuid,
  session_id uuid,
  messages jsonb NOT NULL,
  file_context text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  repo_id uuid,
  file_path text NOT NULL,
  branch text,
  line_start integer NOT NULL,
  line_end integer,
  content text NOT NULL,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_commit_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  repo_id uuid,
  branch text,
  commits jsonb NOT NULL,
  fetched_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_deploy_tokens (
  id uuid NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  encrypted_token text NOT NULL,
  project_id text
);

CREATE TABLE IF NOT EXISTS studio_favorites (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  repo_id uuid,
  file_path text NOT NULL,
  line_number integer,
  label text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_recent_files (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  repo_id uuid,
  file_path text NOT NULL,
  branch text,
  accessed_at text DEFAULT now(),
  access_count integer DEFAULT 1
);

CREATE TABLE IF NOT EXISTS studio_repos (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  repo_full_name text NOT NULL,
  default_branch text DEFAULT 'main',
  last_accessed_at timestamptz DEFAULT now(),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  repo_id uuid,
  branch text,
  open_files jsonb,
  active_file text,
  cursor_positions jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  theme text DEFAULT 'dark',
  font_size integer DEFAULT 14,
  word_wrap boolean DEFAULT true,
  minimap boolean DEFAULT false,
  auto_save boolean DEFAULT false,
  keyboard_shortcuts jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS studio_shares (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  repo_id uuid,
  file_path text NOT NULL,
  branch text,
  line_start integer,
  line_end integer,
  share_code text NOT NULL,
  expires_at timestamptz,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  plan_id text NOT NULL,
  status text DEFAULT 'active',
  current_period_start date NOT NULL,
  current_period_end date NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  trial_start date,
  trial_end date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supersonic_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date,
  ssn_last_4 text,
  street_address text,
  city text,
  state text,
  zip_code text,
  filing_status text,
  dependents integer DEFAULT 0,
  estimated_refund numeric,
  advance_amount numeric,
  status text DEFAULT 'pending',
  jotform_submission_id text,
  source text DEFAULT 'website',
  notes text
);

CREATE TABLE IF NOT EXISTS supersonic_appointments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  appointment_type text NOT NULL,
  location text,
  status text DEFAULT 'scheduled',
  confirmation_sent boolean DEFAULT false,
  reminder_sent boolean DEFAULT false,
  notes text,
  internal_notes text
);

CREATE TABLE IF NOT EXISTS supersonic_careers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  position text NOT NULL,
  location_preference text,
  years_experience integer,
  certifications text,
  resume_url text,
  competency_test_score integer,
  competency_test_passed boolean DEFAULT false,
  status text DEFAULT 'applied',
  interview_scheduled text,
  notes text,
  internal_notes text
);

CREATE TABLE IF NOT EXISTS supersonic_tax_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  application_id uuid,
  client_email text NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  status text DEFAULT 'uploaded',
  ocr_extracted boolean DEFAULT false,
  ocr_data jsonb,
  uploaded_by text,
  notes text
);

CREATE TABLE IF NOT EXISTS supersonic_training_keys (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  access_key text NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  key_type text DEFAULT 'training',
  expires_at timestamptz,
  max_uses integer DEFAULT 1,
  uses_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  revoked_at timestamptz,
  revoked_by text,
  issued_by text,
  notes text
);

CREATE TABLE IF NOT EXISTS supportive_services (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  participant_id uuid,
  service_type text NOT NULL,
  service_description text,
  amount_requested numeric,
  amount_approved numeric,
  amount_paid numeric,
  request_status text DEFAULT Pending,
  requested_by uuid,
  requested_date date DEFAULT CURRENT_DATE,
  approved_by uuid,
  approved_date date,
  denial_reason text,
  payment_method text,
  payment_date date,
  payment_reference text,
  supporting_documentation_url text,
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid NOT NULL PRIMARY KEY,
  program_id uuid NOT NULL,
  title text NOT NULL,
  instructions text NOT NULL,
  due_days integer NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  tax_year integer,
  application_type text,
  status text DEFAULT 'pending',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_calculations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  user_email text,
  tax_year integer NOT NULL,
  filing_status text NOT NULL,
  total_income numeric,
  adjusted_gross_income numeric,
  taxable_income numeric,
  federal_tax numeric,
  total_tax numeric,
  federal_withholding numeric,
  estimated_refund numeric,
  is_refund boolean,
  calculation_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_document_uploads (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  content_type text,
  status text DEFAULT 'uploaded',
  reviewed_by text,
  reviewed_at timestamptz,
  notes text,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  tax_year integer NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  file_url text NOT NULL,
  mime_type text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  uploaded_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_filings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  tax_year integer NOT NULL,
  filing_type text,
  status text DEFAULT 'pending',
  preparer_id uuid,
  vita_site text,
  filing_date date,
  refund_amount numeric,
  documents jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_intake (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  service_type text NOT NULL,
  diy_service text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  notes text,
  paid boolean DEFAULT false,
  stripe_session_id text,
  ip_address text,
  user_agent text
);

CREATE TABLE IF NOT EXISTS tax_payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  return_id uuid,
  amount numeric,
  payment_type text,
  status text DEFAULT 'pending',
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_withholdings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  filing_status text NOT NULL,
  allowances integer DEFAULT 0,
  additional_withholding numeric DEFAULT 0,
  exempt boolean DEFAULT false,
  state_filing_status text,
  state_allowances integer DEFAULT 0,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_branding (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  primary_color text DEFAULT #3B82F6,
  secondary_color text DEFAULT #10B981,
  accent_color text DEFAULT #F59E0B,
  background_color text DEFAULT #FFFFFF,
  text_color text DEFAULT #1F2937,
  font_family text DEFAULT Inter,
  heading_font text,
  custom_css text,
  email_header_url text,
  email_footer_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_invitations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  email text NOT NULL,
  tenant_role text DEFAULT 'member' NOT NULL,
  invitation_token text NOT NULL,
  status text DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  invited_by uuid,
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_licenses (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  plan_name text DEFAULT 'starter' NOT NULL,
  status text DEFAULT 'inactive' NOT NULL,
  seats_limit integer DEFAULT 1 NOT NULL,
  seats_used integer DEFAULT 0 NOT NULL,
  features jsonb NOT NULL,
  current_period_start text,
  current_period_end text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  user_id uuid,
  tenant_role text DEFAULT 'member' NOT NULL,
  permissions jsonb,
  status text DEFAULT 'active',
  invited_by uuid,
  invited_at text,
  joined_at text DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_memberships (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  timezone text DEFAULT UTC,
  date_format text DEFAULT MM/DD/YYYY,
  time_format text DEFAULT 12h,
  language text DEFAULT 'en',
  currency text DEFAULT USD,
  features jsonb,
  allow_self_enrollment boolean DEFAULT true,
  require_approval boolean DEFAULT false,
  auto_enroll_new_users boolean DEFAULT false,
  certificate_template_id uuid,
  auto_issue_certificates boolean DEFAULT true,
  email_notifications_enabled boolean DEFAULT true,
  sms_notifications_enabled boolean DEFAULT false,
  push_notifications_enabled boolean DEFAULT true,
  require_2fa boolean DEFAULT false,
  password_min_length integer DEFAULT 8,
  password_require_uppercase boolean DEFAULT true,
  password_require_numbers boolean DEFAULT true,
  password_require_symbols boolean DEFAULT false,
  session_timeout_minutes integer DEFAULT 480,
  integrations jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_stripe_customers (
  tenant_id uuid NOT NULL PRIMARY KEY,
  stripe_customer_id text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  plan_name text NOT NULL,
  plan_price numeric NOT NULL,
  billing_cycle text NOT NULL,
  max_users integer,
  max_courses integer,
  storage_limit_gb integer,
  api_rate_limit integer,
  features jsonb,
  status text DEFAULT 'active',
  stripe_subscription_id text,
  stripe_customer_id text,
  trial_ends_at text,
  current_period_start text NOT NULL,
  current_period_end text NOT NULL,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_usage (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  active_users integer DEFAULT 0,
  total_courses integer DEFAULT 0,
  total_enrollments integer DEFAULT 0,
  storage_used_gb numeric DEFAULT 0,
  api_requests_count integer DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  calculated_at text DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_usage_daily (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  usage_date date NOT NULL,
  active_users integer DEFAULT 0,
  api_requests integer DEFAULT 0,
  storage_used_gb numeric DEFAULT 0,
  bandwidth_used_gb numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  slug text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS time_entries (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  entry_date date NOT NULL,
  clock_in text NOT NULL,
  clock_out text,
  break_minutes integer DEFAULT 0,
  total_hours numeric,
  status text DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS timeclock_cron_runs (
  id integer NOT NULL PRIMARY KEY,
  ran_at text DEFAULT now() NOT NULL,
  updated_count integer NOT NULL
);

CREATE TABLE IF NOT EXISTS timeclock_ui_state (
  progress_entry_id uuid PRIMARY KEY,
  apprentice_id uuid,
  partner_id uuid,
  program_id text,
  site_id uuid,
  work_date date,
  week_ending date,
  max_hours_per_week numeric,
  status text,
  clock_in_at text,
  lunch_start_at text,
  lunch_end_at text,
  clock_out_at text,
  derived_hours numeric,
  can_clock_in boolean,
  can_clock_out boolean,
  can_start_lunch boolean,
  can_end_lunch boolean,
  clock_in_block_reason text,
  clock_out_block_reason text,
  lunch_start_block_reason text,
  lunch_end_block_reason text
);

CREATE TABLE IF NOT EXISTS timesheets (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_hours numeric,
  status text DEFAULT 'draft',
  submitted_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_courses (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_name text NOT NULL,
  course_code text,
  description text,
  duration_hours integer,
  price numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  instructor_id uuid,
  program_id uuid
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  status text DEFAULT 'active',
  progress integer DEFAULT 0,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  tenant_id uuid NOT NULL,
  application_id uuid,
  program_id uuid,
  hours_completed numeric DEFAULT 0,
  at_risk boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  cohort_id uuid,
  docs_verified boolean DEFAULT false,
  docs_verified_at text,
  orientation_completed_at text,
  documents_submitted_at text,
  confirmed_at timestamptz,
  funding_source text,
  payment_method text,
  program_slug text,
  payment_option text,
  amount_paid numeric DEFAULT 0,
  stripe_checkout_session_id text,
  approved_at timestamptz,
  approved_by uuid,
  paused_at text,
  pause_reason text,
  agreement_signed boolean DEFAULT false,
  agreement_signed_at text,
  course_id_uuid uuid
);

CREATE TABLE IF NOT EXISTS training_lessons (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid NOT NULL,
  lesson_number integer NOT NULL,
  title text NOT NULL,
  content text,
  video_url text,
  duration_minutes integer,
  topics text,
  quiz_questions jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  course_id_uuid uuid,
  order_index integer DEFAULT 0,
  is_required boolean DEFAULT true,
  is_published boolean DEFAULT true,
  content_type text DEFAULT 'video',
  quiz_id uuid,
  passing_score integer DEFAULT 70,
  description text
);

CREATE TABLE IF NOT EXISTS training_progress (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  quiz_score integer,
  time_spent_minutes integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transfer_hour_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  enrollment_id uuid,
  hours_requested numeric NOT NULL,
  hours_approved numeric,
  previous_school_name text NOT NULL,
  previous_school_address text,
  previous_school_phone text,
  previous_school_license text,
  completion_date date,
  documentation_url text,
  notes text,
  status text DEFAULT 'pending' NOT NULL,
  reviewer_id uuid,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trial_signups (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  email text NOT NULL,
  organization_name text NOT NULL,
  organization_type text NOT NULL,
  contact_name text NOT NULL,
  contact_phone text,
  plan_id text NOT NULL,
  status text DEFAULT 'pending',
  converted_at text,
  organization_id uuid,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + '7 days'::interval)
);

CREATE TABLE IF NOT EXISTS two_factor_attempts (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  code text NOT NULL,
  success boolean NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS two_factor_auth (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  method text NOT NULL,
  secret text NOT NULL,
  backup_codes text,
  is_enabled boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unauthorized_access_log (
  id integer NOT NULL PRIMARY KEY,
  domain text NOT NULL,
  url text NOT NULL,
  referrer text,
  ip_address text,
  user_agent text,
  country text,
  city text,
  detected_at timestamptz NOT NULL,
  logged_at text DEFAULT CURRENT_TIMESTAMP,
  screenshot_url text,
  html_snapshot text,
  status text DEFAULT 'detected',
  cease_desist_sent boolean DEFAULT false,
  cease_desist_date date,
  dmca_filed boolean DEFAULT false,
  dmca_filed_date date,
  legal_action_taken boolean DEFAULT false,
  legal_action_date date,
  notes text,
  assigned_to integer,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS uploaded_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  application_id uuid,
  file_type text NOT NULL,
  file_url text NOT NULL,
  uploaded_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  earned_at text DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_activity_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb,
  page_url text,
  referrer_url text,
  session_id text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  earned_at text DEFAULT now(),
  progress_data jsonb
);

CREATE TABLE IF NOT EXISTS user_capabilities (
  user_id uuid PRIMARY KEY,
  role text,
  is_program_holder boolean
);

CREATE TABLE IF NOT EXISTS user_onboarding (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  flow_id text NOT NULL,
  current_step integer DEFAULT 0,
  completed_steps text,
  completed boolean DEFAULT false,
  skipped boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  permission_id uuid,
  tenant_id uuid,
  granted_by uuid,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_points (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  total_points integer DEFAULT 0,
  level integer DEFAULT 1,
  level_name text DEFAULT Beginner,
  points_to_next_level integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  bio text,
  avatar_url text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_progress (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  program_id uuid NOT NULL,
  total_lessons integer DEFAULT 0,
  completed_lessons integer DEFAULT 0,
  total_quizzes integer DEFAULT 0,
  completed_quizzes integer DEFAULT 0,
  total_resources integer DEFAULT 0,
  downloaded_resources integer DEFAULT 0,
  progress_percentage numeric DEFAULT 0,
  estimated_completion_date date,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_resumes (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  title text DEFAULT My Resume,
  personal_info jsonb NOT NULL,
  summary text,
  work_experience jsonb,
  education jsonb,
  skills jsonb,
  certifications jsonb,
  template_name text DEFAULT 'professional',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  ip_address inet,
  user_agent text,
  last_activity_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_tutorials (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  tutorial_id text NOT NULL,
  current_step integer DEFAULT 0,
  completed_steps text,
  completed boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  app_role text DEFAULT 'student' NOT NULL,
  organization_id uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  vendor_name text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  payment_method text,
  invoice_id text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verify_audit (
  id integer NOT NULL PRIMARY KEY,
  ip_hash text NOT NULL,
  credential_id text NOT NULL,
  result text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS video_captions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  lesson_id uuid,
  language text NOT NULL,
  caption_url text NOT NULL,
  is_auto_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_chapters (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  video_id uuid NOT NULL,
  title text NOT NULL,
  start_time integer NOT NULL,
  end_time integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_transcripts (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  lesson_id uuid NOT NULL,
  language text DEFAULT 'en' NOT NULL,
  transcript_text text NOT NULL,
  vtt_url text,
  srt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vita_appointments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  appointment_date text NOT NULL,
  site_location text,
  preparer_id uuid,
  status text DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voicemails (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  phone_number text NOT NULL,
  recording_url text NOT NULL,
  duration_seconds integer,
  transcription text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  webhook_id uuid NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  error text,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  url text NOT NULL,
  events text NOT NULL,
  secret text NOT NULL,
  enabled boolean DEFAULT true,
  description text,
  headers jsonb,
  retry_count integer DEFAULT 0,
  last_triggered_at text,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS welcome_packets (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  generated_at timestamptz DEFAULT now() NOT NULL,
  pdf_url text,
  status text DEFAULT 'generated',
  acknowledged_at text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS wioa_services (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  participant_id uuid,
  iep_id uuid,
  service_category text NOT NULL,
  service_type text NOT NULL,
  service_description text,
  service_provider text,
  service_provider_id uuid,
  service_start_date date NOT NULL,
  service_end_date date,
  service_hours numeric,
  service_status text DEFAULT Scheduled,
  service_cost numeric,
  funding_source text,
  service_outcome text,
  participant_satisfaction_rating integer,
  service_documentation_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  withdrawal_type text NOT NULL,
  reason text NOT NULL,
  effective_date date NOT NULL,
  last_attendance_date date,
  refund_amount numeric,
  status text DEFAULT 'pending' NOT NULL,
  requested_at text DEFAULT now() NOT NULL,
  processed_at timestamptz,
  processed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS workone_checklist (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid,
  user_id uuid,
  step_key text NOT NULL,
  step_label text NOT NULL,
  status text DEFAULT 'todo' NOT NULL,
  notes text,
  due_date date,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wotc_tracking (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employer_id uuid,
  apprentice_id uuid,
  hire_date date NOT NULL,
  submitted boolean DEFAULT false,
  eligible boolean,
  created_at timestamptz DEFAULT now(),
  deadline date
);

CREATE TABLE IF NOT EXISTS xapi_statements (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  actor jsonb NOT NULL,
  verb jsonb NOT NULL,
  object jsonb NOT NULL,
  result jsonb,
  context jsonb,
  timestamp timestamptz NOT NULL,
  stored_at text DEFAULT now(),
  authority jsonb,
  version text DEFAULT 1.0.3
);
