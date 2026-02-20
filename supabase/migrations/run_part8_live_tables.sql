-- Migration: Create 90 live DB tables that lack migration files
-- Part 1 of 5
-- These tables already exist in the live Supabase DB but had no CREATE TABLE migration.
-- Using IF NOT EXISTS so this is safe to run even if tables are already present.

CREATE TABLE IF NOT EXISTS academic_integrity_violations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  violation_type text NOT NULL,
  description text NOT NULL,
  incident_date date NOT NULL,
  reported_by uuid,
  action_taken text,
  status text DEFAULT 'reported',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS accessibility_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  high_contrast boolean DEFAULT false,
  large_text boolean DEFAULT false,
  screen_reader boolean DEFAULT false,
  keyboard_navigation boolean DEFAULT false,
  reduced_motion boolean DEFAULT false,
  color_blind_mode text,
  font_size integer DEFAULT 16,
  preferences jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  category text,
  points integer DEFAULT 0,
  criteria jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adaptive_learning_paths (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid,
  recommended_lessons text,
  difficulty_level text,
  learning_style text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  alert_type text NOT NULL,
  severity text DEFAULT 'info' NOT NULL,
  partner_id uuid,
  apprentice_id uuid,
  progress_entry_id uuid,
  site_id uuid,
  message text NOT NULL,
  metadata jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz,
  resolved_by uuid
);

CREATE TABLE IF NOT EXISTS admin_applications_queue (
  application_type text,
  application_id uuid,
  created_at timestamptz,
  state text,
  state_updated_at timestamptz,
  intake jsonb
);

CREATE TABLE IF NOT EXISTS admin_compliance_status (
  user_id uuid PRIMARY KEY,
  email text,
  full_name text,
  role text,
  onboarding_status text,
  agreements_signed boolean,
  documents_uploaded boolean,
  documents_verified boolean,
  onboarding_completed_at text,
  total_agreements_signed integer,
  verified_documents_count integer,
  last_agreement_signed text
);

CREATE TABLE IF NOT EXISTS affiliate_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  company_name text,
  website text,
  audience_size integer,
  marketing_channels text,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  affiliate_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT USD,
  period_start date NOT NULL,
  period_end date NOT NULL,
  referral_count integer,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  payment_method text,
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agreements (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  version text DEFAULT 1.0,
  content text,
  required_for text,
  is_active boolean DEFAULT true,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_generated_courses (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  topic text NOT NULL,
  level text,
  output text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_instructors (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  specialty text NOT NULL,
  system_prompt text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_notifications (
  id integer NOT NULL PRIMARY KEY,
  alert_type text NOT NULL,
  severity text DEFAULT 'high',
  title text NOT NULL,
  message text NOT NULL,
  related_log_id integer,
  related_url text,
  sent boolean DEFAULT false,
  sent_at timestamptz,
  sent_to text,
  acknowledged boolean DEFAULT false,
  acknowledged_by integer,
  acknowledged_at text,
  action_required boolean DEFAULT true,
  action_taken text,
  action_taken_by integer,
  action_taken_at text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  event_type text,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_request_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  api_key_id uuid,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer,
  response_time_ms integer,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS application_checklist (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  application_id uuid,
  created_icc_account boolean DEFAULT false,
  scheduled_workone_appointment boolean DEFAULT false,
  workone_appointment_date date,
  workone_location text,
  attended_workone_appointment boolean DEFAULT false,
  funding_verified boolean DEFAULT false,
  advisor_assigned boolean DEFAULT false,
  enrollment_started boolean DEFAULT false,
  enrollment_completed boolean DEFAULT false,
  last_updated text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS application_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid NOT NULL,
  submit_token uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  status text DEFAULT 'draft' NOT NULL,
  personal_info jsonb NOT NULL,
  employment_info jsonb NOT NULL,
  education_info jsonb NOT NULL,
  funding_info jsonb NOT NULL,
  documents jsonb NOT NULL,
  signature jsonb NOT NULL,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  first_name text DEFAULT  NOT NULL,
  last_name text DEFAULT  NOT NULL,
  phone text DEFAULT  NOT NULL,
  email text DEFAULT  NOT NULL,
  city text DEFAULT  NOT NULL,
  zip text DEFAULT  NOT NULL,
  program_interest text DEFAULT General Inquiry NOT NULL,
  has_case_manager boolean DEFAULT false NOT NULL,
  case_manager_agency text,
  support_notes text,
  contact_preference text DEFAULT 'text' NOT NULL,
  advisor_email text,
  status text DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  employer_sponsor_id uuid,
  submit_token uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  user_id uuid DEFAULT auth.uid(),
  pathway_slug text,
  source text DEFAULT 'direct',
  full_name text,
  eligibility_data jsonb,
  reviewer_id uuid,
  review_notes text,
  reviewed_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  intake_id uuid,
  program_slug text,
  payment_received_at text,
  eligibility_status text DEFAULT 'pending',
  eligibility_verified_at text,
  eligibility_verified_by uuid,
  advisor_assigned uuid,
  advisor_notes text,
  next_step text,
  next_step_due_date date,
  sezzle_session_uuid text,
  sezzle_order_uuid text,
  sezzle_reference_id text,
  sezzle_card_token text,
  payment_provider text,
  payment_status text,
  payment_amount_cents integer,
  payment_completed_at text,
  payment_reference text,
  internal_order_id text
);

CREATE TABLE IF NOT EXISTS apprentice_hour_totals (
  apprentice_application_id uuid,
  total_accepted_hours numeric,
  total_pending_hours numeric,
  host_shop_hours numeric,
  transfer_hours numeric,
  approved_entry_count integer,
  pending_entry_count integer,
  pending_review_count integer
);

CREATE TABLE IF NOT EXISTS apprentice_hours_by_shop (
  apprentice_application_id uuid,
  host_shop_application_id uuid,
  approved_hours numeric,
  pending_hours numeric,
  first_entry_date date,
  last_entry_date date
);

CREATE TABLE IF NOT EXISTS apprentice_hours_by_source (
  apprentice_application_id uuid,
  source_type text,
  accepted_hours numeric,
  pending_hours numeric,
  entry_count integer
);

CREATE TABLE IF NOT EXISTS apprentice_notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  apprenticeship_id uuid NOT NULL,
  student_id uuid NOT NULL,
  notification_type text NOT NULL,
  scheduled_time text NOT NULL,
  days_of_week text,
  enabled boolean DEFAULT true,
  last_sent_at text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apprentice_payroll (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  apprenticeship_id uuid NOT NULL,
  student_id uuid NOT NULL,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  total_hours numeric NOT NULL,
  hourly_rate numeric NOT NULL,
  gross_pay numeric NOT NULL,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apprentice_wage_updates (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  placement_id uuid NOT NULL,
  effective_date date NOT NULL,
  hourly_wage numeric NOT NULL,
  note text,
  submitted_by_user_id uuid NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS apprentice_weekly_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  placement_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  hours_total numeric DEFAULT 0 NOT NULL,
  hours_ojt numeric DEFAULT 0 NOT NULL,
  hours_related numeric DEFAULT 0 NOT NULL,
  attendance_notes text,
  competencies_notes text,
  submitted_by_user_id uuid NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'submitted' NOT NULL,
  sponsor_review_notes text,
  sponsor_reviewed_at text,
  sponsor_reviewed_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS apprenticeship_enrollments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  program_id uuid NOT NULL,
  employer_name text NOT NULL,
  supervisor_name text NOT NULL,
  start_date date NOT NULL,
  status text DEFAULT 'active',
  total_hours_required integer DEFAULT 1500,
  total_hours_completed numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  employer_id uuid,
  site_id uuid
);

CREATE TABLE IF NOT EXISTS apprenticeship_hours (
  id uuid PRIMARY KEY,
  student_id uuid,
  shop_id uuid,
  partner_id uuid,
  date_worked date,
  date date,
  week_ending date,
  hours numeric,
  hours_worked numeric,
  program_slug text,
  program_id text,
  category text,
  description text,
  notes text,
  approved boolean,
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  status text,
  submitted_by uuid,
  submitted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS apprenticeship_hours_summary (
  student_id uuid,
  program_slug text,
  week_start text,
  total_hours numeric,
  approved_hours numeric,
  pending_hours numeric,
  disputed_hours numeric,
  entry_count integer
);

CREATE TABLE IF NOT EXISTS apprenticeship_intake (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  phone text,
  city text,
  state text,
  interested_in_barbering boolean DEFAULT true,
  employment_status text,
  funding_needed boolean DEFAULT true,
  workforce_connection text,
  referral_source text,
  probation_or_reentry boolean,
  preferred_location text,
  notes text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apprenticeship_portfolio (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  apprenticeship_id uuid NOT NULL,
  student_id uuid NOT NULL,
  title text NOT NULL,
  file_url text,
  date_created date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apprenticeship_programs (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  slug text NOT NULL,
  name text NOT NULL,
  state text DEFAULT IN NOT NULL,
  required_hours integer NOT NULL,
  program_fee numeric NOT NULL,
  vendor_name text,
  vendor_cost numeric DEFAULT 0,
  licensing_agency text,
  occupation_code text,
  is_etpl_approved boolean DEFAULT true,
  is_active boolean DEFAULT true,
  description text,
  disclaimer text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apprenticeships (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employer_id uuid,
  program_id uuid,
  title text NOT NULL,
  description text,
  duration_months integer,
  wage_progression jsonb,
  requirements text,
  benefits text,
  mentor_assigned uuid,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  assignment_id uuid,
  user_id uuid,
  submission_text text,
  submission_url text,
  file_paths text,
  status text DEFAULT 'draft',
  submitted_at timestamptz,
  graded_at timestamptz,
  grade numeric,
  feedback text,
  graded_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid,
  lesson_id uuid,
  title text NOT NULL,
  description text,
  instructions text,
  max_points numeric DEFAULT 100,
  due_date text,
  allow_late_submission boolean DEFAULT true,
  late_penalty_percent numeric DEFAULT 0,
  submission_type text,
  max_file_size_mb integer DEFAULT 10,
  allowed_file_types text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  date date NOT NULL,
  status text NOT NULL,
  check_in_time text,
  check_out_time text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_snapshot (
  apprentice_id uuid PRIMARY KEY,
  referral_source text,
  program text,
  referral_date text,
  employer text,
  funding_source text,
  funding_status text,
  rapids_status text,
  wotc_submitted boolean,
  ojt_status text
);

CREATE TABLE IF NOT EXISTS badge_definitions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon_url text,
  badge_type text,
  criteria jsonb NOT NULL,
  points_reward integer DEFAULT 0,
  rarity text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS badges (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  criteria jsonb NOT NULL,
  points integer DEFAULT 0,
  rarity text DEFAULT 'common',
  created_at timestamptz DEFAULT now(),
  icon_url text
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  client_id uuid,
  routing_number text NOT NULL,
  account_number text NOT NULL,
  account_type text NOT NULL,
  is_primary boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS barber_shops (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  license_number text,
  address text,
  city text,
  state text DEFAULT IN,
  zip text,
  phone text,
  email text,
  owner_name text,
  owner_license text,
  is_approved boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS barbershop_partner_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'submitted' NOT NULL,
  shop_legal_name text NOT NULL,
  shop_dba_name text,
  owner_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  shop_address_line1 text NOT NULL,
  shop_address_line2 text,
  shop_city text NOT NULL,
  shop_state text DEFAULT IN NOT NULL,
  shop_zip text NOT NULL,
  indiana_shop_license_number text NOT NULL,
  supervisor_name text NOT NULL,
  supervisor_license_number text NOT NULL,
  supervisor_years_licensed integer,
  employment_model text NOT NULL,
  has_workers_comp boolean DEFAULT false NOT NULL,
  can_supervise_and_verify boolean DEFAULT false NOT NULL,
  mou_acknowledged boolean DEFAULT false NOT NULL,
  consent_acknowledged boolean DEFAULT false NOT NULL,
  notes text,
  source_url text,
  user_agent text,
  ip_hash text,
  internal_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz
);

CREATE TABLE IF NOT EXISTS benefits_enrollments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  plan_id uuid,
  enrollment_date date NOT NULL,
  effective_date date NOT NULL,
  termination_date date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS benefits_plans (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  plan_name text NOT NULL,
  plan_type text NOT NULL,
  description text,
  provider text,
  employee_cost numeric,
  employer_cost numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_cycles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  cycle_start date NOT NULL,
  cycle_end date NOT NULL,
  amount_due numeric,
  amount_paid numeric,
  status text DEFAULT 'pending',
  due_date date,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time text,
  duration integer DEFAULT 60,
  color text DEFAULT #3b82f6,
  event_type text,
  location text,
  reminder_minutes integer,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS call_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  preferred_time text,
  reason text,
  status text DEFAULT 'pending',
  assigned_to uuid,
  called_at text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS callback_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  phone text NOT NULL,
  preferred_time text,
  reason text,
  status text DEFAULT 'pending',
  assigned_to uuid,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS career_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  email text,
  phone text,
  program_id uuid,
  application_state text DEFAULT 'started' NOT NULL,
  submitted_at timestamptz,
  last_transition_at text,
  state_history jsonb NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  date_of_birth date,
  address text,
  city text,
  state text,
  zip_code text,
  high_school text,
  graduation_year text,
  gpa text,
  college text,
  major text,
  funding_type text,
  employment_status text,
  current_employer text,
  years_experience text
);

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_manager_assignments (
  application_id uuid NOT NULL PRIMARY KEY,
  case_manager_id uuid NOT NULL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS case_managers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  agency text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cash_advances (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  amount numeric,
  status text DEFAULT 'pending',
  requested_at text DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid,
  disbursed_at text,
  repayment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certificates (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  course_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  certificate_number text,
  issued_at text DEFAULT now(),
  expires_at timestamptz,
  pdf_url text,
  verification_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  tenant_id uuid,
  student_id uuid,
  verification_code text,
  course_title text,
  program_name text,
  hours_completed numeric,
  issued_date text
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  status text DEFAULT 'active',
  assigned_to uuid,
  priority text DEFAULT 'normal',
  tags text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  conversation_id uuid,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  is_ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  middle_name text,
  ssn text NOT NULL,
  date_of_birth date NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  filing_status text,
  jotform_submission_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cobra_enrollments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  plan_id uuid,
  enrollment_date date NOT NULL,
  termination_date date,
  monthly_premium numeric,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'workshop',
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  location text,
  is_virtual boolean DEFAULT false,
  max_attendees integer,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competencies (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competency_evidence (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_competency_id uuid,
  evidence_type text NOT NULL,
  file_url text,
  description text,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaints (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  student_record_id uuid,
  complaint_type text NOT NULL,
  description text NOT NULL,
  desired_resolution text,
  status text DEFAULT 'submitted' NOT NULL,
  assigned_to uuid,
  resolution text,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS content_approvals (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  version_id uuid,
  status text DEFAULT 'pending',
  reviewer_id uuid,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_library (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  description text,
  content_type text NOT NULL,
  file_url text,
  thumbnail_url text,
  duration_seconds integer,
  file_size_bytes integer,
  tags text,
  is_public boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_pages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  slug text,
  title text NOT NULL,
  body text,
  is_published boolean DEFAULT false,
  tenant_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_sync_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  source text NOT NULL,
  sync_status text DEFAULT 'pending',
  sync_started_at text,
  sync_completed_at text,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  conversion_type text NOT NULL,
  value numeric,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_access (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  granted_by uuid,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS course_competencies (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid,
  competency_id uuid,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_credentials (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid,
  credential_id uuid,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_modules (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL,
  duration_minutes integer,
  content text,
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_recommendations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  program_id uuid NOT NULL,
  recommendation_type text,
  score numeric,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_syllabi (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_name text NOT NULL,
  program_name text NOT NULL,
  version text DEFAULT 1.0 NOT NULL,
  content text NOT NULL,
  effective_date date NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS course_tasks (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  type text DEFAULT 'assignment',
  due_date text,
  points integer DEFAULT 0,
  required boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text,
  structure jsonb NOT NULL,
  is_public boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY,
  course_name text,
  title text,
  course_code text,
  description text,
  duration_hours integer,
  price numeric,
  is_active boolean,
  instructor_id uuid,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS credential_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  credential_type text,
  issuer text,
  file_url text,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credential_verification (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  enrollment_id uuid,
  credential_type text NOT NULL,
  credential_name text NOT NULL,
  credential_number text,
  issuing_organization text,
  issue_date date,
  expiration_date date,
  verification_status text DEFAULT 'pending',
  verified_date date,
  verified_by uuid,
  verification_method text,
  verification_url text,
  state_registry_id text,
  state_registry_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text
);

CREATE TABLE IF NOT EXISTS credentialing_partners (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  website text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credentials (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  partner_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credentials_attained (
  id integer NOT NULL PRIMARY KEY,
  user_id integer NOT NULL,
  program_id integer NOT NULL,
  credential_type text NOT NULL,
  credential_name text NOT NULL,
  issuing_organization text,
  credential_number text,
  issue_date date,
  expiration_date date,
  status text DEFAULT 'active',
  is_industry_recognized boolean DEFAULT true,
  is_stackable boolean DEFAULT false,
  verification_url text,
  verification_code text,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  certificate_file_url text,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS critical_audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_type text NOT NULL,
  actor_id uuid,
  actor_email text,
  actor_role text,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_interactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  contact_id uuid,
  user_id uuid,
  type text,
  subject text,
  notes text,
  outcome text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cross_tenant_access (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  source_tenant_id uuid,
  target_tenant_id uuid,
  access_type text NOT NULL,
  resource_type text NOT NULL,
  resource_ids text,
  permissions jsonb,
  is_active boolean DEFAULT true,
  granted_by uuid,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_service_protocols (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  category text NOT NULL,
  dos text,
  donts text,
  examples jsonb,
  escalation_rules text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_service_tickets (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  staff_id uuid,
  subject text NOT NULL,
  description text,
  status text DEFAULT 'open',
  priority text DEFAULT 'normal',
  category text,
  resolution text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_activities (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  activity_date date NOT NULL,
  lessons_completed integer DEFAULT 0,
  quizzes_completed integer DEFAULT 0,
  time_spent_minutes integer DEFAULT 0,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  resource_type text NOT NULL,
  retention_days integer NOT NULL,
  auto_delete boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_sharing_agreements (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  partner_name text NOT NULL,
  partner_type text NOT NULL,
  agreement_type text NOT NULL,
  purpose text NOT NULL,
  data_elements text NOT NULL,
  security_requirements text NOT NULL,
  prohibition_on_redisclosure boolean DEFAULT true NOT NULL,
  data_retention_period text,
  destruction_method text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  signed_by uuid,
  signed_at timestamptz,
  effective_date date NOT NULL,
  expiration_date date,
  status text DEFAULT 'active' NOT NULL,
  document_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS delegate_assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  delegate_id uuid NOT NULL,
  learner_id uuid NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delegates (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  organization text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
