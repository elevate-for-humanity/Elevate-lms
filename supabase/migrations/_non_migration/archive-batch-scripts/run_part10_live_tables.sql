-- Migration: Create 90 live DB tables that lack migration files
-- Part 3 of 5
-- These tables already exist in the live Supabase DB but had no CREATE TABLE migration.
-- Using IF NOT EXISTS so this is safe to run even if tables are already present.

CREATE TABLE IF NOT EXISTS license_purchases (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  license_type text NOT NULL,
  product_slug text,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  tenant_id uuid,
  status text DEFAULT 'pending',
  amount_cents integer,
  currency text DEFAULT 'usd',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS license_requests (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  license_type text,
  status text DEFAULT 'pending',
  requested_at text DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS license_usage (  tenant_id uuid,
  tenant_name text,
  plan_name text,
  status text,
  seats_limit integer,
  seats_used integer,
  seats_remaining integer,
  features jsonb,
  current_period_start text,
  current_period_end text,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS license_usage_log (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  license_id uuid NOT NULL,
  enrollment_id uuid,
  student_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS license_violations (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  violation_type text NOT NULL,
  feature text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_class_attendance (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  class_id uuid,
  user_id uuid NOT NULL,
  joined_at text,
  left_at text,
  duration_minutes integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_classes (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid,
  title text NOT NULL,
  description text,
  instructor_id uuid,
  meeting_url text,
  meeting_id text,
  meeting_password text,
  scheduled_start text NOT NULL,
  scheduled_end text NOT NULL,
  actual_start text,
  actual_end text,
  status text DEFAULT 'scheduled',
  max_participants integer,
  recording_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lms_organizations (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  subdomain text,
  custom_domain text,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#10B981',
  settings jsonb,
  subscription_tier text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  max_users integer DEFAULT 100,
  max_courses integer DEFAULT 10,
  storage_limit_gb integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lms_sync_log (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  provider_id uuid NOT NULL,
  sync_type text NOT NULL,
  status text NOT NULL,
  records_processed integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  sync_data jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS makeup_work_requests (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  missed_date date NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS marketing_campaign_sends (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  campaign_id uuid,
  contact_id uuid,
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  clicked_at text,
  bounced boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  name text NOT NULL,
  campaign_type text NOT NULL,
  subject text,
  content text,
  status text DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_contacts (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  email text NOT NULL,
  first_name text,
  last_name text,
  tags text,
  subscribed boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_creators (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  display_name text NOT NULL,
  bio text,
  payout_method text,
  payout_email text,
  revenue_split numeric DEFAULT 0.7,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  rejection_reason text,
  rejected_at timestamptz,
  rejected_by uuid,
  approved_at timestamptz,
  approved_by uuid
);

CREATE TABLE IF NOT EXISTS marketplace_sales (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  product_id uuid,
  creator_id uuid,
  buyer_email text NOT NULL,
  amount_cents integer NOT NULL,
  creator_earnings_cents integer NOT NULL,
  platform_earnings_cents integer NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  download_token text,
  download_expires_at text,
  paid_out boolean DEFAULT false,
  payout_date text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS media (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  path text NOT NULL,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_action_items (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  recap_id uuid NOT NULL,
  label text NOT NULL,
  due_date date,
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_recaps (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid,
  created_by uuid,
  attendee_email text,
  title text NOT NULL,
  meeting_date text,
  source text DEFAULT 'manual',
  transcript text,
  summary text,
  key_points jsonb,
  decisions jsonb,
  follow_up_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  sender_id uuid,
  recipient_id uuid,
  subject text,
  body text NOT NULL,
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS migration_audit (  id integer NOT NULL PRIMARY KEY,
  filename text NOT NULL,
  applied_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milady_enrollments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  enrollment_id uuid,
  milady_student_id text,
  milady_email text,
  enrolled_at timestamptz DEFAULT now(),
  courses_completed jsonb,
  certificate_url text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_actions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  moderator_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  action_type text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_reports (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  reporter_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_rules (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  rule_name text NOT NULL,
  rule_type text NOT NULL,
  conditions jsonb NOT NULL,
  actions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid NOT NULL,
  title text NOT NULL,
  summary text,
  order_index integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  description text
);

CREATE TABLE IF NOT EXISTS monitoring_alerts (  id integer NOT NULL PRIMARY KEY,
  source text NOT NULL,
  alert_title text NOT NULL,
  alert_description text,
  alert_url text,
  severity text DEFAULT 'medium',
  status text DEFAULT 'new',
  investigated_by integer,
  investigated_at text,
  investigation_notes text,
  action_required boolean DEFAULT true,
  action_taken text,
  related_unauthorized_log_id integer,
  related_dmca_id integer,
  related_legal_action_id integer,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mou_signatures (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  signature_data text NOT NULL,
  signed_at timestamptz DEFAULT now() NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS mou_templates (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  content text NOT NULL,
  version integer DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS nds_course_catalog (  id uuid PRIMARY KEY,
  course_code text,
  course_name text,
  description text,
  category text,
  duration_hours numeric,
  nds_wholesale_cost numeric,
  elevate_retail_price numeric,
  markup_percentage numeric,
  stripe_product_id text,
  stripe_price_id text,
  external_course_url text,
  certification_name text,
  is_active boolean,
  is_new boolean,
  is_popular boolean
);

CREATE TABLE IF NOT EXISTS notification_log (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  recipient_id uuid NOT NULL,
  notification_type text NOT NULL,
  subject text,
  message text,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent',
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS notification_logs (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  "type" text NOT NULL,
  status text NOT NULL,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  "type" text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  action_label text,
  metadata jsonb,
  idempotency_key text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ojt_hours_log (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  apprenticeship_id uuid NOT NULL,
  student_id uuid NOT NULL,
  work_date date NOT NULL,
  check_in_time text NOT NULL,
  check_out_time text,
  total_hours numeric,
  cuts_completed integer DEFAULT 0,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ojt_logs (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  supervisor_id uuid,
  program_id uuid,
  log_date date NOT NULL,
  hours_worked numeric NOT NULL,
  tasks_completed text,
  supervisor_notes text,
  student_reflection text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ojt_reimbursements (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  apprentice_id uuid,
  employer_id uuid,
  wage_rate numeric,
  reimbursement_rate numeric,
  hours_worked numeric,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  amount_due numeric
);

CREATE TABLE IF NOT EXISTS onboarding_checklist (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  task_name text NOT NULL,
  task_description text,
  task_order integer NOT NULL,
  required boolean DEFAULT true,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS onboarding_documents (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  packet_id uuid,
  title text,
  document_url text,
  requires_signature boolean DEFAULT false,
  sort_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_packets (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "role" text,
  title text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_signatures (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  document_id uuid,
  signature_data text,
  signed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_steps (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  step_name text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS open_timeclock_shifts (  id uuid PRIMARY KEY,
  apprentice_id uuid,
  partner_id uuid,
  program_id text,
  site_id uuid,
  work_date date,
  clock_in_at text,
  last_seen_at timestamptz,
  last_seen_within_geofence boolean,
  status text,
  open_duration interval
);

CREATE TABLE IF NOT EXISTS order_items (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  order_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  product_price numeric NOT NULL,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  status text DEFAULT 'pending',
  total numeric DEFAULT 0,
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_invites (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid NOT NULL,
  email text NOT NULL,
  "role" text NOT NULL,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_subscriptions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid NOT NULL,
  stripe_subscription_id text,
  stripe_customer_id text,
  plan_type text DEFAULT 'free' NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  current_period_start text,
  current_period_end text,
  cancel_at_period_end boolean DEFAULT false,
  licenses_included integer DEFAULT 0,
  licenses_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_users (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  "role" text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  slug text NOT NULL,
  name text NOT NULL,
  "type" text DEFAULT 'training_provider' NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  contact_email text
);

CREATE TABLE IF NOT EXISTS page_views (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  path text NOT NULL,
  user_id uuid,
  session_id text,
  referrer text,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participant_demographics (  id integer NOT NULL PRIMARY KEY,
  user_id integer NOT NULL,
  date_of_birth date,
  gender text,
  race_ethnicity text,
  is_veteran boolean DEFAULT false,
  veteran_era text,
  has_disability boolean DEFAULT false,
  disability_type text,
  is_low_income boolean DEFAULT false,
  household_size integer,
  annual_household_income numeric,
  highest_education text,
  employment_status_at_entry text,
  receiving_public_assistance boolean DEFAULT false,
  barriers text,
  consent_to_share_data boolean DEFAULT false,
  consent_date date,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participant_eligibility (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  date_of_birth date,
  gender text,
  ethnicity text,
  race jsonb,
  is_veteran boolean DEFAULT false,
  veteran_verified_at text,
  is_dislocated_worker boolean DEFAULT false,
  dislocated_worker_verified_at text,
  is_low_income boolean DEFAULT false,
  low_income_verified_at text,
  is_youth boolean DEFAULT false,
  youth_verified_at text,
  has_disability boolean DEFAULT false,
  disability_verified_at text,
  eligibility_status text DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_certificates (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  certificate_url text,
  issued_date text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_completions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  enrollment_id uuid,
  student_id uuid,
  partner_id uuid,
  program_id uuid,
  completion_date date NOT NULL,
  hours_completed numeric,
  grade text,
  certificate_issued boolean DEFAULT false,
  certificate_number text,
  notes text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS partner_course_enrollments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  partner_course_id uuid,
  partner_id uuid,
  status text DEFAULT 'active',
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress_percent integer DEFAULT 0,
  funding_source text,
  external_enrollment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_course_mappings (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  partner_course_id uuid NOT NULL,
  internal_program_id uuid,
  internal_course_id uuid,
  scorm_package_id uuid,
  mapping_type text DEFAULT 'equivalent',
  active boolean DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_courses (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  provider_id uuid NOT NULL,
  course_name text NOT NULL,
  course_code text,
  external_course_code text,
  description text,
  hours numeric,
  level text,
  credential_type text,
  price numeric DEFAULT 0,
  active boolean DEFAULT true NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  base_cost_cents integer DEFAULT 0 NOT NULL,
  retail_price_cents integer DEFAULT 0 NOT NULL,
  platform_margin_cents integer DEFAULT 0 NOT NULL,
  markup_percent numeric DEFAULT 40 NOT NULL,
  stripe_price_id text,
  enrollment_link text,
  hsi_course_id text
);

CREATE TABLE IF NOT EXISTS partner_courses_catalog (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  provider_id uuid NOT NULL,
  course_name text NOT NULL,
  description text,
  category text,
  wholesale_price numeric DEFAULT 0,
  retail_price numeric DEFAULT 0,
  duration_hours numeric,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_credentials (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  partner_enrollment_id uuid,
  provider_id uuid NOT NULL,
  credential_name text NOT NULL,
  credential_type text,
  credential_number text,
  external_credential_id text,
  issued_date date,
  expiration_date date,
  verification_url text,
  certificate_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_enrollment_summary (  id uuid PRIMARY KEY,
  student_id uuid,
  student_name text,
  student_email text,
  course_name text,
  provider_name text,
  status text,
  progress_percentage numeric,
  enrolled_at timestamptz,
  completed_at timestamptz,
  module_count integer,
  avg_module_progress numeric
);

CREATE TABLE IF NOT EXISTS partner_enrollments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  partner_id uuid,
  student_id uuid NOT NULL,
  program_id uuid,
  enrollment_date date NOT NULL,
  status text DEFAULT 'active',
  funding_source text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS partner_inquiries (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text,
  email text,
  phone text,
  organization text,
  message text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_lms_courses (  id uuid PRIMARY KEY,
  provider_id uuid,
  course_name text,
  course_code text,
  external_course_code text,
  description text,
  hours numeric,
  level text,
  credential_type text,
  price numeric,
  active boolean,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  base_cost_cents integer,
  retail_price_cents integer,
  platform_margin_cents integer,
  markup_percent numeric,
  stripe_price_id text,
  enrollment_link text,
  hsi_course_id text
);

CREATE TABLE IF NOT EXISTS partner_lms_enrollment_failures (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  provider_id uuid,
  course_id uuid,
  program_id uuid,
  error_code text,
  error_message text,
  payload jsonb,
  occurred_at text DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  tenant_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS partner_lms_enrollments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  provider_id uuid NOT NULL,
  student_id uuid NOT NULL,
  course_id uuid NOT NULL,
  program_id uuid,
  status text DEFAULT 'pending',
  progress_percentage numeric DEFAULT 0,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  external_enrollment_id text NOT NULL,
  external_account_id text,
  external_certificate_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  funding_source text DEFAULT 'self_pay',
  certificate_issued_at text
);

CREATE TABLE IF NOT EXISTS partner_lms_providers (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  provider_name text NOT NULL,
  provider_type text NOT NULL,
  website_url text,
  support_email text,
  active boolean DEFAULT true NOT NULL,
  api_config jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_program_courses (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid NOT NULL,
  partner_course_id uuid NOT NULL,
  is_required boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_shops (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  owner_name text,
  address text,
  city text,
  state text DEFAULT 'IN',
  phone text,
  status text DEFAULT 'active',
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_history (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pay_stubs (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  payroll_run_id uuid,
  employee_id uuid,
  gross_pay numeric NOT NULL,
  net_pay numeric NOT NULL,
  federal_tax numeric DEFAULT 0,
  state_tax numeric DEFAULT 0,
  social_security numeric DEFAULT 0,
  medicare numeric DEFAULT 0,
  deductions jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_plans (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  enrollment_id uuid,
  total_amount numeric,
  installments integer DEFAULT 4,
  status text DEFAULT 'active',
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_records (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  status text DEFAULT 'pending',
  stripe_payment_intent_id text,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payout_rate_configs (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "role" text,
  rate_type text,
  rate_amount numeric,
  effective_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_profiles (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  bank_name text,
  account_type text,
  routing_number text,
  account_number_encrypted text,
  tax_withholding jsonb,
  direct_deposit_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_runs (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  pay_date date NOT NULL,
  status text DEFAULT 'draft',
  total_gross numeric,
  total_net numeric,
  total_taxes numeric,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS peer_review_assignments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  assignment_id uuid,
  user_id uuid NOT NULL,
  peers_to_review text,
  due_date text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS peer_reviews (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  assignment_id uuid,
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  rating integer,
  feedback text,
  status text DEFAULT 'pending',
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS performance_metrics (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  metric_name text NOT NULL,
  value numeric NOT NULL,
  date date NOT NULL,
  category text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS performance_reviews (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  reviewer_id uuid,
  review_period_start date NOT NULL,
  review_period_end date NOT NULL,
  overall_rating integer,
  strengths text,
  areas_for_improvement text,
  goals text,
  status text DEFAULT 'draft',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permission_audit_log (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  permission_name text,
  granted boolean,
  reason text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permission_group_members (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  group_id uuid,
  permission_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permission_groups (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  tenant_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS phone_logs (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  phone_number text NOT NULL,
  call_type text NOT NULL,
  direction text NOT NULL,
  duration_seconds integer,
  status text,
  recording_url text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_stats (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  stat_date date DEFAULT CURRENT_DATE NOT NULL,
  "key" text NOT NULL,
  value numeric DEFAULT 0 NOT NULL,
  metadata jsonb NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS point_transactions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  points integer NOT NULL,
  action_type text NOT NULL,
  description text,
  reference_id uuid,
  reference_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS positions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  title text NOT NULL,
  description text,
  department_id uuid,
  min_salary numeric,
  max_salary numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS process_steps (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  process_id uuid,
  step_number integer NOT NULL,
  title text NOT NULL,
  description text,
  screenshot_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS processed_stripe_events (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  stripe_event_id text NOT NULL,
  payment_intent_id text,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS processes (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  documents_required text,
  average_time integer,
  completion_rate numeric,
  category text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proctored_exams (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  assessment_id uuid,
  proctoring_type text NOT NULL,
  require_webcam boolean DEFAULT true,
  require_screen_share boolean DEFAULT true,
  allow_breaks boolean DEFAULT false,
  max_break_minutes integer DEFAULT 0,
  settings jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proctoring_sessions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  exam_id uuid,
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  status text DEFAULT 'active',
  violations jsonb,
  recording_url text,
  created_at timestamptz DEFAULT now()
);
