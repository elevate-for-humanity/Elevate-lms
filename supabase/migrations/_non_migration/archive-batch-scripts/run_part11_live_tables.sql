-- Migration: Create 90 live DB tables that lack migration files
-- Part 4 of 5
-- These tables already exist in the live Supabase DB but had no CREATE TABLE migration.
-- Using IF NOT EXISTS so this is safe to run even if tables are already present.

CREATE TABLE IF NOT EXISTS product_reports (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  product_id uuid NOT NULL,
  reporter_email text,
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS products (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric DEFAULT 0 NOT NULL,
  "type" text DEFAULT 'digital',
  category text,
  image_url text,
  stripe_price_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  audiences text,
  features text,
  tags text,
  is_featured boolean DEFAULT false,
  badge text,
  sort_order integer DEFAULT 0,
  inventory_quantity integer DEFAULT 0,
  track_inventory boolean DEFAULT false,
  requires_shipping boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS profiles (  id uuid NOT NULL PRIMARY KEY,
  email text,
  full_name text,
  "role" text DEFAULT 'student',
  enrollment_status text DEFAULT 'pending' NOT NULL,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  organization_id uuid,
  tenant_id uuid,
  is_active boolean DEFAULT true,
  zip_code text,
  onboarding_completed boolean DEFAULT false,
  onboarding_completed_at text
);

CREATE TABLE IF NOT EXISTS program_catalog (  id uuid PRIMARY KEY,
  slug text,
  name text,
  category text,
  description text,
  duration_formatted text,
  tuition_dollars numeric,
  total_cost_dollars numeric,
  stripe_product_id text,
  stripe_price_id text,
  funding_types text,
  wioa_eligible boolean,
  wrg_eligible boolean,
  apprenticeship_registered boolean,
  certification_name text
);

CREATE TABLE IF NOT EXISTS program_courses (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid NOT NULL,
  course_id uuid NOT NULL,
  is_required boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_holder_applications (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  user_id uuid,
  organization_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text DEFAULT 'pending',
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_holder_documents (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  organization_id uuid,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  description text,
  uploaded_by uuid NOT NULL,
  approved boolean DEFAULT false,
  approved_by uuid,
  approved_at timestamptz,
  approval_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  uploaded_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text
);

CREATE TABLE IF NOT EXISTS program_holder_notes (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  program_holder_id uuid NOT NULL,
  status text,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_holder_payouts (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  stripe_account_id text NOT NULL,
  stripe_account_type text DEFAULT 'express' NOT NULL,
  external_account_last4 text,
  bank_name text,
  account_type text,
  payouts_enabled boolean DEFAULT false NOT NULL,
  charges_enabled boolean DEFAULT false NOT NULL,
  verification_status text DEFAULT 'pending' NOT NULL,
  verified_at timestamptz,
  verified_by uuid,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS program_holder_students (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_holder_id uuid NOT NULL,
  student_id uuid NOT NULL,
  program_id uuid,
  enrolled_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  notes text
);

CREATE TABLE IF NOT EXISTS program_holder_verification (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  verification_type text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  stripe_verification_session_id text,
  verified_at timestamptz,
  verified_by uuid,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  decision text,
  reviewed_at timestamptz,
  reviewed_by uuid
);

CREATE TABLE IF NOT EXISTS program_holders (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_name text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  contact_name text,
  contact_email text,
  contact_phone text,
  mou_signed boolean DEFAULT false,
  mou_signed_at text,
  payout_status text DEFAULT 'not_started' NOT NULL,
  is_using_internal_lms boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS program_licenses (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid NOT NULL,
  license_holder_id uuid NOT NULL,
  license_key text NOT NULL,
  license_type text NOT NULL,
  max_enrollments integer,
  current_enrollments integer DEFAULT 0,
  lms_model text DEFAULT 'external' NOT NULL,
  external_lms_url text,
  can_create_courses boolean DEFAULT false,
  can_upload_scorm boolean DEFAULT false,
  status text DEFAULT 'active',
  is_store_license boolean DEFAULT false,
  store_id uuid,
  purchased_at text DEFAULT now() NOT NULL,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS program_partner_lms (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  is_required boolean DEFAULT true,
  sequence_order integer DEFAULT 1,
  requires_payment boolean DEFAULT false,
  payment_amount numeric,
  auto_enroll_on_program_start boolean DEFAULT false,
  send_welcome_email boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_required_courses (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid NOT NULL,
  partner_course_id uuid NOT NULL,
  is_required boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_revenue (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid NOT NULL,
  program_holder_id uuid,
  amount numeric NOT NULL,
  funding_source text,
  payment_date date,
  paid_at timestamptz,
  fiscal_year integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programs (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  slug text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  estimated_weeks integer,
  estimated_hours integer,
  funding_tags text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  full_description text,
  what_you_learn text,
  day_in_life text,
  salary_min integer,
  salary_max integer,
  credential_type text,
  credential_name text,
  employers text,
  funding_pathways text,
  delivery_method text,
  training_hours integer,
  prerequisites text,
  career_outcomes text,
  industry_demand text,
  image_url text,
  hero_image_url text,
  icon_url text,
  featured boolean DEFAULT false,
  wioa_approved boolean DEFAULT true,
  dol_registered boolean DEFAULT false,
  placement_rate integer,
  completion_rate integer,
  total_cost numeric,
  toolkit_cost numeric,
  credentialing_cost numeric,
  name text,
  duration_weeks integer,
  updated_at timestamptz DEFAULT now(),
  cip_code text,
  soc_code text,
  funding_eligibility text,
  state_code text DEFAULT 'IN',
  organization_id uuid,
  category_norm text,
  cover_image_url text,
  cover_image_alt text,
  excerpt text,
  tenant_id uuid,
  partner_name text,
  partner_id uuid,
  published boolean DEFAULT true,
  lms_model text DEFAULT 'external',
  requires_license boolean DEFAULT false,
  license_type text,
  lms_config jsonb,
  is_store_template boolean DEFAULT false,
  store_config jsonb,
  store_id uuid,
  funding_eligible boolean DEFAULT false,
  is_free boolean DEFAULT false,
  status text DEFAULT 'active',
  canonical_program_id uuid,
  code text,
  total_hours integer,
  tuition numeric,
  requirements jsonb,
  eligibility_rules jsonb,
  credential text,
  required_hours integer,
  hero_image text,
  hero_image_alt text,
  availability_status text DEFAULT 'open',
  next_start_date date,
  enrollment_deadline date,
  seats_available integer,
  total_seats integer,
  funding_cycle text,
  funding_confirmed boolean DEFAULT true,
  is_apprenticeship boolean DEFAULT false,
  requires_employer_match boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS provisioning_events (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  payment_intent_id text,
  correlation_id text,
  step text NOT NULL,
  status text NOT NULL,
  error text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  email text NOT NULL,
  product_id uuid,
  repo text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_notification_tokens (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_tokens (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL,
  device_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qa_checklist_completions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  checklist_id uuid,
  completed_by uuid,
  entity_type text,
  entity_id uuid,
  items_completed jsonb,
  notes text,
  completed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qa_checklists (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text,
  items jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quarterly_performance (  id integer NOT NULL PRIMARY KEY,
  quarter integer NOT NULL,
  year integer NOT NULL,
  program_id integer,
  total_enrolled integer DEFAULT 0,
  total_completed integer DEFAULT 0,
  total_dropped integer DEFAULT 0,
  completion_rate numeric,
  total_employed integer DEFAULT 0,
  employed_in_field integer DEFAULT 0,
  median_wage numeric,
  employment_rate numeric,
  credentials_earned integer DEFAULT 0,
  credential_rate numeric,
  retained_30_days integer DEFAULT 0,
  retained_90_days integer DEFAULT 0,
  retention_rate_90 numeric,
  participants_female integer DEFAULT 0,
  participants_male integer DEFAULT 0,
  participants_minority integer DEFAULT 0,
  participants_veteran integer DEFAULT 0,
  participants_disability integer DEFAULT 0,
  participants_low_income integer DEFAULT 0,
  generated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  generated_by integer,
  report_file_url text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_answer_options (  id integer NOT NULL PRIMARY KEY,
  question_id integer NOT NULL,
  answer_text text NOT NULL,
  is_correct boolean DEFAULT false,
  answer_order integer DEFAULT 0,
  feedback text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rapids_apprentice_data (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  apprentice_id uuid,
  rapids_number text,
  occupation_code text,
  sponsor_name text,
  start_date date,
  status text DEFAULT 'active',
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rapids_registrations (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  enrollment_id uuid,
  rapids_id text,
  occupation_code text DEFAULT '39-5011.00',
  sponsor_id text,
  registration_date date,
  expected_completion_date date,
  status text DEFAULT 'pending',
  submitted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rapids_tracking (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  apprentice_id uuid,
  rapids_id text,
  status text DEFAULT 'pending',
  registration_date date,
  completion_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_codes (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  code text NOT NULL,
  discount_type text,
  discount_value numeric,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referrals (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  referrer_id uuid DEFAULT gen_random_uuid() NOT NULL,
  referred_user_id uuid,
  referral_code text,
  status text DEFAULT 'pending',
  reward_amount numeric,
  rewarded_at text,
  created_at timestamptz DEFAULT now(),
  source text,
  program text
);

CREATE TABLE IF NOT EXISTS refund_tracking (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tax_return_id uuid,
  refund_type text NOT NULL,
  expected_amount numeric,
  actual_amount numeric,
  status text DEFAULT 'pending',
  direct_deposit_date date,
  check_mailed_date date,
  received_date date,
  irs_status_code text,
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refunds (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  amount_requested numeric NOT NULL,
  amount_approved numeric,
  reason text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  requested_at text DEFAULT now() NOT NULL,
  processed_at timestamptz,
  processed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS resource_downloads (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  downloaded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  reviewer_name text NOT NULL,
  reviewer_email text,
  rating integer NOT NULL,
  content text NOT NULL,
  response text,
  responded_by uuid,
  responded_at text,
  platform_synced boolean DEFAULT false,
  synced_platforms text,
  moderation_status text DEFAULT 'pending',
  moderated_by uuid,
  moderated_at text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  role_id uuid,
  permission_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_templates (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  permissions jsonb,
  is_public boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_history (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  previous_salary numeric,
  new_salary numeric NOT NULL,
  change_reason text,
  effective_date date NOT NULL,
  changed_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sap_records (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_record_id uuid NOT NULL,
  check_date text DEFAULT now() NOT NULL,
  status text NOT NULL,
  gpa numeric,
  attendance_percentage numeric,
  hours_completed numeric,
  hours_required numeric,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS scorm_completion_summary (  id uuid PRIMARY KEY,
  user_id uuid,
  student_name text,
  student_email text,
  scorm_title text,
  status text,
  progress_percentage numeric,
  score numeric,
  attempts integer,
  time_spent_minutes integer,
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS scorm_enrollments (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  scorm_package_id uuid NOT NULL,
  user_id uuid NOT NULL,
  enrollment_id uuid,
  status text DEFAULT 'not_attempted',
  progress_percentage numeric DEFAULT 0,
  score numeric,
  attempts integer DEFAULT 0,
  time_spent_seconds integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz,
  suspend_data jsonb,
  cmi_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scorm_packages (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  description text,
  version text DEFAULT 1.2,
  package_url text NOT NULL,
  manifest_url text,
  launch_url text NOT NULL,
  duration_minutes integer,
  passing_score integer DEFAULT 80,
  max_attempts integer,
  active boolean DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scorm_registrations (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  scorm_package_id uuid,
  registration_id text NOT NULL,
  status text DEFAULT 'incomplete',
  score numeric,
  completion_status text,
  success_status text,
  total_time_seconds integer,
  last_accessed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scorm_state (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  cmi_data jsonb NOT NULL,
  suspend_data text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS scorm_tracking (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  scorm_enrollment_id uuid NOT NULL,
  element text NOT NULL,
  value text,
  timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scraping_attempts (  id integer NOT NULL PRIMARY KEY,
  detection_type text NOT NULL,
  url text NOT NULL,
  ip_address text,
  user_agent text,
  additional_data jsonb,
  detected_at timestamptz NOT NULL,
  logged_at text DEFAULT 'CURRENT_TIMESTAMP',
  blocked boolean DEFAULT false,
  ip_banned boolean DEFAULT false,
  alert_sent boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_audit_logs (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL,
  severity text NOT NULL,
  description text,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_tickets (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  issue text NOT NULL,
  priority text DEFAULT 'medium',
  status text DEFAULT 'open',
  assigned_to uuid,
  resolution text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS sfc_tax_return_public_status (  tracking_id text,
  status text,
  rejection_reason text,
  created_at timestamptz,
  updated_at timestamptz,
  client_first_name text,
  client_last_initial text
);

CREATE TABLE IF NOT EXISTS sfc_tax_return_public_status_v2 (  public_tracking_code text,
  status text,
  client_first_name text,
  client_last_name text,
  efile_submission_id text,
  last_error text,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS sfc_tax_returns_public_lookup (  id uuid PRIMARY KEY,
  tracking_id text,
  source_system text,
  source_submission_id text,
  client_first_name text,
  client_last_name text,
  client_email text,
  client_phone text,
  status text,
  efile_submission_id text,
  intake_payload jsonb,
  calculation_payload jsonb,
  tax_return_payload jsonb,
  provider_metadata jsonb,
  last_error text,
  last_error_at text,
  created_at timestamptz,
  updated_at timestamptz,
  is_deleted boolean,
  deleted_at timestamptz,
  submission_environment text,
  public_tracking_code text
);

CREATE TABLE IF NOT EXISTS shift_schedules (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  employee_id uuid,
  shift_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  break_minutes integer DEFAULT 0,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_applications (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shop_name text NOT NULL,
  owner_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text DEFAULT 'IN' NOT NULL,
  zip text NOT NULL,
  ein text,
  years_in_business integer,
  licensed_barbers integer,
  agree_supervision boolean DEFAULT false NOT NULL,
  agree_reporting boolean DEFAULT false NOT NULL,
  agree_wages boolean DEFAULT false NOT NULL,
  status text DEFAULT 'submitted' NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_categories (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_document_requirements (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_slug text DEFAULT 'barber-apprenticeship' NOT NULL,
  state text DEFAULT 'IN' NOT NULL,
  document_type text NOT NULL,
  required boolean DEFAULT true NOT NULL,
  display_name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_documents (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shop_id uuid NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid NOT NULL,
  approved boolean DEFAULT false NOT NULL,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_onboarding (  shop_id uuid NOT NULL PRIMARY KEY,
  handbook_ack boolean DEFAULT false NOT NULL,
  reporting_trained boolean DEFAULT false NOT NULL,
  apprentice_supervisor_assigned boolean DEFAULT false NOT NULL,
  rapids_reporting_ready boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_orders (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shop_id uuid,
  customer_id uuid,
  order_number text,
  total_amount numeric,
  status text DEFAULT 'pending',
  ordered_at text DEFAULT now(),
  fulfilled_at text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_placements (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  shop_name text NOT NULL,
  shop_address text,
  supervisor_name text,
  supervisor_email text,
  supervisor_phone text,
  status text DEFAULT 'active',
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_products (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text NOT NULL,
  stock_quantity integer DEFAULT 0,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  image_url text,
  is_featured boolean DEFAULT false,
  stripe_product_id text,
  stripe_price_id text
);

CREATE TABLE IF NOT EXISTS shop_reports (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shop_id uuid,
  submitted_by uuid,
  report_type text,
  report_period_start date,
  report_period_end date,
  data jsonb,
  attachments jsonb,
  status text DEFAULT 'submitted',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_required_docs_status (  shop_id uuid PRIMARY KEY,
  shop_name text,
  program_slug text,
  state text,
  document_type text,
  display_name text,
  description text,
  required boolean,
  approved boolean,
  file_url text,
  uploaded_by uuid,
  uploaded_at timestamptz,
  approved_by uuid,
  approved_at timestamptz
);

CREATE TABLE IF NOT EXISTS shop_signatures (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shop_id uuid NOT NULL,
  document_type text NOT NULL,
  signed_by_name text NOT NULL,
  signed_by_title text,
  signed_at date DEFAULT CURRENT_DATE NOT NULL,
  file_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  ip_acknowledged boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS shop_staff (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shop_id uuid NOT NULL,
  user_id uuid NOT NULL,
  "role" text DEFAULT 'manager' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  active boolean DEFAULT true NOT NULL,
  deactivated_at timestamptz,
  deactivated_by uuid,
  tenant_id uuid
);

CREATE TABLE IF NOT EXISTS shop_supervisors (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  shop_id uuid,
  user_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  license_number text,
  license_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shops (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  ein text,
  address1 text,
  address2 text,
  city text,
  state text DEFAULT 'IN' NOT NULL,
  zip text,
  phone text,
  email text,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  tenant_id uuid,
  latitude numeric,
  longitude numeric,
  geocoded_at text,
  geocode_source text,
  geocode_failed_at text,
  geocode_error text
);

CREATE TABLE IF NOT EXISTS signatures (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  document_type text,
  document_id uuid,
  signature_data text,
  signed_at timestamptz DEFAULT now(),
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sms_reminders (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  application_id uuid,
  reminder_type text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'sent'
);

CREATE TABLE IF NOT EXISTS social_media_accounts (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  platform text NOT NULL,
  account_name text NOT NULL,
  account_id text,
  access_token text,
  refresh_token text,
  token_expires_at text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_media_queue (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  post_id uuid,
  scheduled_for text NOT NULL,
  priority integer DEFAULT 5,
  status text DEFAULT 'pending',
  attempts integer DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sso_connections (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  provider_id uuid,
  user_id uuid NOT NULL,
  external_user_id text NOT NULL,
  email text,
  metadata jsonb,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sso_login_attempts (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  provider_id uuid,
  email text,
  success boolean NOT NULL,
  error_message text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sso_providers (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  provider_type text NOT NULL,
  provider_name text NOT NULL,
  client_id text NOT NULL,
  client_secret text,
  issuer_url text,
  authorization_url text,
  token_url text,
  userinfo_url text,
  jwks_uri text,
  scopes text,
  attribute_mapping jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sso_sessions (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  connection_id uuid,
  session_token text NOT NULL,
  access_token text,
  refresh_token text,
  id_token text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_applications (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  position text,
  status text DEFAULT 'pending',
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_processes (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text,
  steps jsonb,
  attachments jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_training_modules (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  description text,
  content text,
  video_url text,
  duration_minutes integer,
  category text,
  required_for_roles text,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_training_progress (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  module_id uuid,
  status text DEFAULT 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  score integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS state_board_readiness (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  enrollment_id uuid,
  total_hours_completed numeric DEFAULT 0,
  rti_hours_completed numeric DEFAULT 0,
  ojt_hours_completed numeric DEFAULT 0,
  milady_completed boolean DEFAULT false,
  practical_skills_verified boolean DEFAULT false,
  ready_for_exam boolean DEFAULT false,
  exam_scheduled_date date,
  exam_location text,
  written_exam_passed boolean,
  written_exam_date date,
  practical_exam_passed boolean,
  practical_exam_date date,
  license_number text,
  license_issued_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS state_compliance (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  state_code text NOT NULL,
  state_name text NOT NULL,
  required_hours integer NOT NULL,
  classroom_hours integer NOT NULL,
  on_the_job_hours integer NOT NULL,
  exam_required boolean DEFAULT true,
  active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_branding (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  store_id uuid NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#10B981',
  font_family text DEFAULT 'Inter',
  custom_css text,
  custom_domain text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS store_instances (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  store_name text NOT NULL,
  store_url text NOT NULL,
  owner_id uuid NOT NULL,
  parent_store_id uuid,
  license_id uuid,
  is_active boolean DEFAULT true,
  settings jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS student_applications (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  user_id uuid,
  full_name text NOT NULL,
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

CREATE TABLE IF NOT EXISTS student_badges (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  earned_date text DEFAULT now(),
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS student_credentials (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  credential_id uuid,
  issued_date text DEFAULT now(),
  credential_number text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_next_steps (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  organization_id uuid,
  program_id uuid,
  inquiry_submitted boolean DEFAULT false NOT NULL,
  inquiry_submitted_at text,
  icc_account_created boolean DEFAULT false NOT NULL,
  icc_username text,
  workone_appointment_scheduled boolean DEFAULT false NOT NULL,
  workone_appointment_date date,
  workone_appointment_time text,
  workone_location text,
  told_advisor_efh boolean DEFAULT false NOT NULL,
  advisor_docs_uploaded boolean DEFAULT false NOT NULL,
  advisor_docs_note text,
  funding_status text DEFAULT 'pending' NOT NULL,
  funding_type text,
  efh_onboarding_call_completed boolean DEFAULT false NOT NULL,
  efh_onboarding_call_date date,
  program_start_confirmed boolean DEFAULT false NOT NULL,
  program_start_date date,
  staff_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS student_onboarding (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  handbook_reviewed boolean DEFAULT false,
  milady_orientation_completed boolean DEFAULT false,
  ai_instructor_met boolean DEFAULT false,
  shop_placed boolean DEFAULT false,
  handbook_reviewed_at text,
  milady_orientation_completed_at text,
  ai_instructor_met_at text,
  shop_placed_at text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_points (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid NOT NULL,
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_activity_date date DEFAULT CURRENT_DATE,
  total_study_minutes integer DEFAULT 0,
  total_lessons_completed integer DEFAULT 0,
  total_quizzes_passed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_progress (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  student_id uuid,
  course_id uuid,
  module_id uuid,
  lesson_id uuid,
  progress_percentage integer DEFAULT 0,
  completed boolean DEFAULT false,
  last_accessed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_records (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  program_name text NOT NULL,
  gpa numeric DEFAULT 0,
  attendance_percentage numeric DEFAULT 100,
  hours_completed numeric DEFAULT 0,
  hours_required numeric DEFAULT 0,
  sap_status text DEFAULT 'good_standing',
  sap_last_checked text,
  enrollment_status text DEFAULT 'active',
  start_date date DEFAULT CURRENT_DATE,
  expected_completion_date date,
  actual_completion_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS students (  id uuid NOT NULL PRIMARY KEY,
  date_of_birth date,
  address text,
  city text,
  state text,
  zip_code text,
  county text,
  funding_type text,
  case_manager_name text,
  case_manager_email text,
  case_manager_phone text,
  eligibility_verified boolean DEFAULT false,
  eligibility_verified_at text,
  eligibility_verified_by uuid,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
