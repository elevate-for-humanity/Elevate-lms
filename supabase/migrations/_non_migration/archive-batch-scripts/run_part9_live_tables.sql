-- Migration: Create 90 live DB tables that lack migration files
-- Part 2 of 5
-- These tables already exist in the live Supabase DB but had no CREATE TABLE migration.
-- Using IF NOT EXISTS so this is safe to run even if tables are already present.

CREATE TABLE IF NOT EXISTS delivery_logs (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  notification_id uuid,
  channel text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  name text NOT NULL,
  description text,
  manager_id uuid,
  parent_department_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dependents (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  client_id uuid,
  tax_return_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  ssn text NOT NULL,
  date_of_birth date NOT NULL,
  relationship text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS digital_purchases (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  stripe_session_id text NOT NULL,
  stripe_payment_intent_id text,
  product_name text NOT NULL,
  price_id text NOT NULL,
  amount_total integer NOT NULL,
  currency text DEFAULT 'usd' NOT NULL,
  customer_email text NOT NULL,
  download_url text,
  download_expires_at text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS direct_deposit_accounts (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  account_type text NOT NULL,
  routing_number text NOT NULL,
  account_number text NOT NULL,
  bank_name text,
  is_primary boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discussion_forums (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid,
  lesson_id uuid,
  title text NOT NULL,
  description text,
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discussion_posts (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_solution boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discussion_threads (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  forum_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dmca_takedown_requests (  id integer NOT NULL PRIMARY KEY,
  infringing_domain text NOT NULL,
  infringing_url text NOT NULL,
  hosting_provider text,
  hosting_provider_email text,
  request_date date NOT NULL,
  request_sent_by integer,
  dmca_notice_text text,
  dmca_notice_file_url text,
  infringing_elements text,
  evidence_urls text,
  status text DEFAULT 'pending',
  response_received boolean DEFAULT false,
  response_date date,
  response_text text,
  content_removed boolean DEFAULT false,
  removal_verified_date date,
  escalated_to_legal boolean DEFAULT false,
  escalation_date date,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_audit_log (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  document_id uuid NOT NULL,
  action text NOT NULL,
  performed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS document_signatures (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  document_type text NOT NULL,
  document_id uuid,
  signer_id uuid,
  signature_data text,
  ip_address text,
  user_agent text,
  signed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donations (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  donor_name text NOT NULL,
  donor_email text,
  amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  payment_status text DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  is_recurring boolean DEFAULT false,
  receipt_sent boolean DEFAULT false,
  receipt_sent_at text,
  user_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  donor_phone text,
  campaign_id uuid,
  stripe_checkout_session_id text,
  recurring_frequency text,
  anonymous boolean DEFAULT false,
  message text
);

CREATE TABLE IF NOT EXISTS ecr_snapshots (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  snapshot_date text DEFAULT now() NOT NULL,
  theory_hours numeric DEFAULT 0,
  practical_hours numeric DEFAULT 0,
  total_hours numeric DEFAULT 0,
  gpa numeric DEFAULT 0,
  attendance_percentage numeric DEFAULT 100,
  sap_status text,
  progress_percentage integer DEFAULT 0,
  milady_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS email_notifications (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  email_type text NOT NULL,
  sent_at timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'sent',
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS email_queue (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_documents (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  document_type text NOT NULL,
  document_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now(),
  expires_at date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_goals (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  goal_title text NOT NULL,
  description text,
  target_date date,
  status text DEFAULT 'in_progress',
  progress_percentage integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  tenant_id uuid,
  employee_number text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  date_of_birth date,
  hire_date date NOT NULL,
  termination_date date,
  employment_status text DEFAULT 'active',
  job_title text,
  department_id uuid,
  manager_id uuid,
  salary numeric,
  pay_frequency text,
  address text,
  city text,
  state text,
  zip_code text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employer_applications (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  user_id uuid,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text DEFAULT 'pending',
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  intake jsonb NOT NULL,
  state text DEFAULT 'submitted',
  state_updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employer_onboarding (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employer_id uuid,
  status text DEFAULT 'submitted',
  documents jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employer_sponsors (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  program_supported text NOT NULL,
  wage_commitment numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employers (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  business_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  license_number text,
  trade text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  owner_user_id uuid
);

CREATE TABLE IF NOT EXISTS employment_tracking (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  enrollment_id uuid,
  employer_name text,
  job_title text,
  employment_start_date date,
  employment_end_date date,
  hourly_wage numeric,
  hours_per_week numeric,
  annual_salary numeric,
  verified_2nd_quarter boolean DEFAULT false,
  verified_2nd_quarter_date date,
  wage_2nd_quarter numeric,
  verified_4th_quarter boolean DEFAULT false,
  verified_4th_quarter_date date,
  wage_4th_quarter numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  notes text
);

CREATE TABLE IF NOT EXISTS enrollment_agreements (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  application_id uuid,
  signed boolean DEFAULT false,
  signed_at timestamptz,
  signature_name text,
  ip_address text,
  agreement_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollment_idempotency (  idempotency_key text NOT NULL PRIMARY KEY,
  enrollment_id text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + '24:00:00'::interval)
);

CREATE TABLE IF NOT EXISTS enrollment_payments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_number integer,
  total_payments integer,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollment_status_history (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  changed_at text DEFAULT now() NOT NULL,
  reason text,
  metadata jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollment_steps (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  sequence_order integer NOT NULL,
  status text DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  external_enrollment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollment_transitions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  enrollment_id uuid,
  from_status text,
  to_status text,
  changed_by uuid,
  reason text,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollments (  id uuid PRIMARY KEY,
  user_id uuid,
  course_id uuid,
  status text,
  progress integer,
  enrolled_at timestamptz,
  completed_at timestamptz,
  tenant_id uuid
);

CREATE TABLE IF NOT EXISTS entities (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  uei text,
  cage text,
  ein text,
  entity_type text NOT NULL,
  naics_list text,
  capability_narrative text,
  org_history text,
  key_personnel text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS etpl_metrics (  quarter text,
  enrollments integer,
  completions integer,
  exits integer
);

CREATE TABLE IF NOT EXISTS event_registrations (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id uuid,
  user_id uuid NOT NULL,
  status text DEFAULT 'registered',
  attended boolean DEFAULT false,
  registered_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_lms_enrollments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  external_lms_name text NOT NULL,
  external_course_id text NOT NULL,
  external_enrollment_id text,
  status text DEFAULT 'active',
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  sync_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_module_progress (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  partner_enrollment_id uuid,
  module_id text NOT NULL,
  module_name text,
  status text DEFAULT 'not_started',
  progress_percentage numeric DEFAULT 0,
  score numeric,
  time_spent_seconds integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_modules (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid,
  title text NOT NULL,
  description text,
  external_url text,
  provider text,
  duration_minutes integer,
  sort_order integer,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_partner_modules (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid NOT NULL,
  title text NOT NULL,
  partner_name text NOT NULL,
  partner_type text,
  delivery_mode text DEFAULT 'link' NOT NULL,
  launch_url text NOT NULL,
  external_course_code text,
  description text,
  hours numeric,
  requires_proof boolean DEFAULT true,
  is_required boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_partner_progress (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  module_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'not_started' NOT NULL,
  proof_file_url text,
  notes text,
  external_enrollment_id text,
  external_account_id text,
  progress_percentage integer DEFAULT 0,
  completed_at timestamptz,
  certificate_url text,
  certificate_number text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS failed_login_attempts (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  email text NOT NULL,
  ip_address inet,
  user_agent text,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ferpa_access_log (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  accessed_by uuid NOT NULL,
  access_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  legitimate_interest text NOT NULL,
  ip_address text,
  user_agent text,
  accessed_at text DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ferpa_compliance_checklist (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  checklist_type text NOT NULL,
  academic_year text NOT NULL,
  items jsonb NOT NULL,
  completed_items integer DEFAULT 0 NOT NULL,
  total_items integer NOT NULL,
  completion_percentage numeric,
  reviewed_by uuid,
  reviewed_at timestamptz,
  status text DEFAULT 'in_progress' NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ferpa_consent_forms (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  consent_type text NOT NULL,
  recipient_name text NOT NULL,
  recipient_organization text,
  purpose text NOT NULL,
  data_elements text NOT NULL,
  signature text NOT NULL,
  signed_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  revoked boolean DEFAULT false NOT NULL,
  revoked_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ferpa_disclosure_log (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  disclosed_by uuid NOT NULL,
  disclosed_to text NOT NULL,
  disclosure_type text NOT NULL,
  purpose text NOT NULL,
  data_disclosed jsonb NOT NULL,
  consent_id uuid,
  legal_basis text,
  disclosed_at text DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ferpa_student_acknowledgments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  orientation_completed boolean DEFAULT false NOT NULL,
  orientation_completed_at text,
  rights_acknowledged boolean DEFAULT false NOT NULL,
  directory_opt_out boolean DEFAULT false NOT NULL,
  signature text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ferpa_training_records (  id text NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  quiz_score numeric NOT NULL,
  quiz_answers jsonb NOT NULL,
  training_signature text NOT NULL,
  confidentiality_signature text NOT NULL,
  training_acknowledged boolean DEFAULT false NOT NULL,
  confidentiality_acknowledged boolean DEFAULT false NOT NULL,
  completed_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  status text DEFAULT 'completed' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ferpa_violation_reports (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  reported_by uuid,
  reported_by_name text,
  reported_by_email text,
  violation_type text NOT NULL,
  description text NOT NULL,
  student_affected uuid,
  date_of_violation text,
  evidence jsonb,
  status text DEFAULT 'pending' NOT NULL,
  investigated_by uuid,
  investigation_notes text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS followup_schedule (  id integer NOT NULL PRIMARY KEY,
  user_id integer NOT NULL,
  program_id integer NOT NULL,
  followup_type text NOT NULL,
  scheduled_date date NOT NULL,
  status text DEFAULT 'pending',
  completed_date date,
  completed_by integer,
  contact_method text,
  contact_attempts integer DEFAULT 0,
  outcome_notes text,
  still_employed boolean,
  needs_support boolean DEFAULT false,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forum_comments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  post_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_posts (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  thread_id uuid,
  content text NOT NULL,
  author_id uuid NOT NULL,
  is_solution boolean DEFAULT false,
  attachments jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_reactions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_threads (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  category_id uuid,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_votes (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  thread_id uuid,
  post_id uuid,
  user_id uuid NOT NULL,
  vote_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forums (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS franchises (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid,
  status text DEFAULT 'active',
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_applications (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  program_type text NOT NULL,
  status text DEFAULT 'pending',
  personal_info jsonb,
  employment_info jsonb,
  education_info jsonb,
  funding_info jsonb,
  documents jsonb,
  signature jsonb,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_cases (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  apprentice_id uuid,
  funding_source text,
  ita_number text,
  approved_amount numeric,
  status text DEFAULT 'pending',
  case_manager text,
  workone_region text,
  approval_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funding_payments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  program_id uuid,
  funding_source text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text,
  amount numeric,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grade_records (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  course_name text NOT NULL,
  assignment_name text NOT NULL,
  assignment_type text NOT NULL,
  points_earned numeric NOT NULL,
  points_possible numeric NOT NULL,
  percentage numeric,
  letter_grade text,
  graded_by uuid,
  graded_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS grant_sources (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL,
  base_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_articles (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL,
  excerpt text,
  category text NOT NULL,
  category_slug text NOT NULL,
  read_time_minutes integer DEFAULT 5,
  is_published boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_categories (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS holidays (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  name text NOT NULL,
  date date NOT NULL,
  is_recurring boolean DEFAULT false,
  is_paid boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hour_tracking (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  date date NOT NULL,
  theory_hours numeric DEFAULT 0,
  practical_hours numeric DEFAULT 0,
  total_hours numeric,
  activity_description text,
  supervisor_id uuid,
  approved boolean DEFAULT false,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS hsi_enrollment_queue (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_name text NOT NULL,
  student_email text NOT NULL,
  course_type text NOT NULL,
  amount_paid numeric,
  payment_status text DEFAULT 'pending',
  enrollment_status text DEFAULT 'pending',
  hsi_student_id text,
  hsi_enrollment_link text,
  stripe_session_id text,
  stripe_payment_intent text,
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  funding_source text DEFAULT 'self_pay'
);

CREATE TABLE IF NOT EXISTS income_sources (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tax_return_id uuid,
  income_type text NOT NULL,
  employer_name text,
  ein text,
  wages numeric,
  federal_withholding numeric,
  state_withholding numeric,
  social_security_wages numeric,
  medicare_wages numeric,
  document_id uuid,
  ocr_extracted boolean DEFAULT false,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS indiana_hour_categories (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  hour_type text NOT NULL,
  min_hours numeric,
  max_hours numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS indiana_timeclock_daily_export (  apprentice_id uuid,
  partner_id uuid,
  site_id uuid,
  program_id text,
  work_date date,
  week_ending date,
  clock_in_at text,
  lunch_start_at text,
  lunch_end_at text,
  clock_out_at text,
  paid_hours numeric,
  recorded_hours numeric,
  max_hours_per_week numeric,
  status text,
  verified_by uuid,
  verified_at timestamptz,
  submitted_by uuid,
  submitted_at timestamptz,
  notes text,
  tasks_completed text,
  created_at timestamptz,
  updated_at timestamptz,
  auto_clocked_out boolean,
  auto_clock_out_reason text
);

CREATE TABLE IF NOT EXISTS indiana_timeclock_weekly_summary_export (  apprentice_id uuid,
  partner_id uuid,
  program_id text,
  week_ending date,
  max_hours_per_week numeric,
  total_recorded_hours numeric,
  verified_hours numeric,
  entry_count integer
);

CREATE TABLE IF NOT EXISTS individual_employment_plans (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  participant_id uuid,
  primary_career_goal text NOT NULL,
  secondary_career_goal text,
  target_occupation_soc_code text,
  target_wage_goal numeric,
  identified_barriers text,
  barrier_mitigation_strategies text,
  assessment_services_needed text,
  training_services_needed text,
  supportive_services_needed text,
  follow_up_services_needed text,
  training_program_id uuid,
  expected_training_start_date date,
  expected_training_completion_date date,
  credential_goal text,
  job_search_activities text,
  job_placement_assistance_needed boolean DEFAULT false,
  short_term_goals text,
  long_term_goals text,
  plan_status text DEFAULT 'Draft',
  plan_created_by uuid,
  plan_approved_by uuid,
  plan_approved_date date,
  participant_signature_url text,
  participant_signed_date date,
  case_manager_signature_url text,
  case_manager_signed_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interactive_elements (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  lesson_id uuid,
  element_type text NOT NULL,
  config jsonb NOT NULL,
  position_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interactive_quizzes (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  lesson_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  passing_score integer DEFAULT 70,
  time_limit_minutes integer,
  max_attempts integer DEFAULT 3,
  show_correct_answers boolean DEFAULT true,
  shuffle_questions boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  invoice_number text NOT NULL,
  amount numeric NOT NULL,
  tax numeric DEFAULT 0,
  total numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'draft',
  due_date date,
  paid_at timestamptz,
  items jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ip_access_control (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  ip_address inet NOT NULL,
  ip_range cidr,
  rule_type text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_applications (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  job_posting_id uuid,
  student_id uuid,
  resume_url text,
  cover_letter text,
  status text DEFAULT 'submitted',
  notes text,
  applied_at text DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_placements (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  employer_id uuid,
  job_title text,
  start_date date,
  end_date date,
  status text DEFAULT 'active',
  hourly_wage numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_postings (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employer_id uuid,
  title text NOT NULL,
  description text,
  requirements text,
  responsibilities text,
  salary_range text,
  salary_min numeric,
  salary_max numeric,
  location text,
  remote_allowed boolean DEFAULT false,
  job_type text,
  experience_level text,
  education_required text,
  skills_required text,
  benefits text,
  application_deadline date,
  status text DEFAULT 'active',
  posted_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_queue (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "type" text NOT NULL,
  payload jsonb,
  status text DEFAULT 'pending',
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  error text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  leaderboard_type text NOT NULL,
  program_id uuid,
  score integer NOT NULL,
  rank integer,
  period_start date,
  period_end date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learner_compliance (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  program_id uuid NOT NULL,
  status text DEFAULT 'compliant',
  hours_completed integer DEFAULT 0,
  hours_required integer DEFAULT 0,
  certifications_completed integer DEFAULT 0,
  certifications_required integer DEFAULT 0,
  expiry_date date,
  last_checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_activity (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  activity_type text NOT NULL,
  course_id uuid,
  lesson_id uuid,
  points_earned integer DEFAULT 0,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_activity_streaks (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  current_streak_days integer DEFAULT 0,
  longest_streak_days integer DEFAULT 0,
  last_activity_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_analytics (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid,
  metric_name text NOT NULL,
  metric_value numeric,
  metadata jsonb,
  recorded_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_paths (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  path_type text,
  programs jsonb NOT NULL,
  estimated_weeks integer,
  difficulty text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_streaks (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  streak_start_date date,
  total_active_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_balances (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  leave_type text NOT NULL,
  balance_hours numeric DEFAULT 0,
  accrued_hours numeric DEFAULT 0,
  used_hours numeric DEFAULT 0,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_policies (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  policy_name text NOT NULL,
  leave_type text NOT NULL,
  accrual_rate numeric,
  max_balance numeric,
  carryover_allowed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leave_requests (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric NOT NULL,
  reason text,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal_actions (  id integer NOT NULL PRIMARY KEY,
  case_number text,
  case_type text,
  defendant_name text,
  defendant_domain text,
  attorney_name text,
  law_firm text,
  attorney_contact text,
  action_initiated_date date NOT NULL,
  cease_desist_sent_date date,
  lawsuit_filed_date date,
  court_hearing_date date,
  resolution_date date,
  status text DEFAULT 'initiated',
  damages_sought numeric,
  damages_awarded numeric,
  legal_fees numeric,
  cease_desist_letter_url text,
  complaint_file_url text,
  settlement_agreement_url text,
  court_order_url text,
  outcome text,
  lessons_learned text,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_content_blocks (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  lesson_id uuid,
  block_type text NOT NULL,
  content jsonb NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_resources (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  lesson_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  resource_type text NOT NULL,
  file_url text NOT NULL,
  file_size_kb integer,
  download_count integer DEFAULT 0,
  order_index integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
