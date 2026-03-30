-- Baseline migration: documents live DB tables not covered by prior migrations.
-- Generated 2026-03-30T05:00:33.560Z
-- These tables already exist in production. This migration uses CREATE TABLE IF NOT EXISTS
-- so it is safe to run against both fresh and existing databases.
-- Source of truth: live Supabase project cuxzzpsyufcewtmicszk

CREATE TABLE IF NOT EXISTS public.academic_integrity_violations (
  id uuid DEFAULT gen_random_uuid(),
  student_record_id uuid,
  violation_type text,
  description text,
  incident_date date,
  reported_by uuid,
  action_taken text,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accessibility_preferences (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  high_contrast boolean,
  large_text boolean,
  screen_reader boolean,
  keyboard_navigation boolean,
  reduced_motion boolean,
  color_blind_mode text,
  font_size bigint,
  preferences jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tts_pitch text,
  tts_rate numeric,
  tts_voice text
);

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.account_export_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accreditations (
  id uuid DEFAULT gen_random_uuid(),
  apprenticeship text,
  description text,
  dwd text,
  elevateforhumanity text,
  gov text,
  id_number text,
  jpg text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  icon text,
  category text,
  points bigint,
  criteria jsonb,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  code text,
  earned_at timestamptz,
  label text
);

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.adaptive_learning_paths (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  course_id uuid,
  recommended_lessons text,
  difficulty_level text,
  learning_style text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id uuid DEFAULT gen_random_uuid(),
  alert_type text,
  severity text,
  partner_id uuid,
  apprentice_id uuid,
  progress_entry_id uuid,
  site_id uuid,
  message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

CREATE TABLE IF NOT EXISTS public.admin_applications_queue (
  application_type text,
  application_id uuid,
  created_at timestamptz DEFAULT now(),
  state text,
  state_updated_at timestamptz,
  intake jsonb
);

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_compliance_status (
  user_id uuid,
  email text,
  full_name text,
  role text,
  onboarding_status text,
  agreements_signed boolean,
  documents_uploaded boolean,
  documents_verified boolean,
  onboarding_completed_at timestamptz,
  total_agreements_signed bigint,
  verified_documents_count bigint,
  last_agreement_signed timestamptz
);

CREATE TABLE IF NOT EXISTS public.advising_requests (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  company_name text,
  website text,
  audience_size bigint,
  marketing_channels text,
  status text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id uuid DEFAULT gen_random_uuid(),
  affiliate_id uuid,
  amount numeric,
  currency text,
  period_start date,
  period_end date,
  referral_count bigint,
  status text,
  paid_at timestamptz,
  payment_method text,
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agreement_signatures (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  document_type text,
  signed_at timestamptz,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agreements (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  version text,
  content text,
  required_for text,
  is_active boolean,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_assistant_conversations (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_assistant_messages (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  role text
);

CREATE TABLE IF NOT EXISTS public.ai_audit_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_chat_context (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  message text,
  response text
);

CREATE TABLE IF NOT EXISTS public.ai_chat_interactions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  host_id uuid,
  scheduled_at timestamptz,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_course_generation_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_generated_courses (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  topic text,
  level text,
  output text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_generations (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  entity_id text,
  type text,
  prompt text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_instructor_assignments (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_instructor_interactions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_instructor_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_instructors (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  role text,
  specialty text,
  system_prompt text,
  active boolean,
  created_at timestamptz DEFAULT now(),
  availability_status text,
  avatar_url text,
  bio text,
  personality_config jsonb,
  role_title text
);

CREATE TABLE IF NOT EXISTS public.ai_job_matches (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_tutor_interactions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  assistant_response text,
  user_message text
);

CREATE TABLE IF NOT EXISTS public.alert_notifications (
  id bigint,
  alert_type text,
  severity text,
  title text,
  message text,
  related_log_id bigint,
  related_url text,
  sent boolean,
  sent_at text,
  sent_to text,
  acknowledged boolean,
  acknowledged_by bigint,
  acknowledged_at text,
  action_required boolean,
  action_taken text,
  action_taken_by bigint,
  action_taken_at text,
  created_at text DEFAULT now(),
  updated_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ambient_music_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcement_recipients (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id uuid DEFAULT gen_random_uuid(),
  api_key_id uuid,
  endpoint text,
  method text,
  status_code bigint,
  response_time_ms bigint,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_screenshot_views (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.application_checklist (
  id uuid DEFAULT gen_random_uuid(),
  application_id uuid,
  created_icc_account boolean,
  scheduled_workone_appointment boolean,
  workone_appointment_date date,
  workone_location text,
  attended_workone_appointment boolean,
  funding_verified boolean,
  advisor_assigned boolean,
  enrollment_started boolean,
  enrollment_completed boolean,
  last_updated timestamptz
);

CREATE TABLE IF NOT EXISTS public.application_claim_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.application_compliance_checks (
  id uuid DEFAULT gen_random_uuid(),
  application_id uuid,
  requirement_code text,
  status text,
  verified_at timestamptz,
  verified_by uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.application_financials (
  id uuid DEFAULT gen_random_uuid(),
  application_id uuid,
  payment_status text,
  payment_amount numeric,
  payment_received_at timestamptz,
  payment_reference text,
  funding_source text,
  funding_approved boolean,
  waiver_approved boolean,
  waiver_approved_by uuid,
  waiver_approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  payment_path text,
  verification_status text,
  provider_name text,
  provider_reference text,
  verification_method text,
  amount_expected numeric,
  amount_approved numeric,
  verified_at timestamptz,
  verified_by uuid
);

CREATE TABLE IF NOT EXISTS public.application_submissions (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  submit_token uuid,
  user_id uuid,
  status text,
  personal_info jsonb,
  employment_info jsonb,
  education_info jsonb,
  funding_info jsonb,
  documents jsonb,
  signature jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointment_types (
  id uuid DEFAULT gen_random_uuid(),
  address text,
  avatar_url text,
  city text,
  description text,
  duration bigint,
  elevateforhumanity text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprentice_agreements (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprentice_forms (
  id uuid DEFAULT gen_random_uuid(),
  category text,
  program_id uuid,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprentice_funding_profile (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  file_url text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  post_cert_date timestamptz,
  wioa_start_date timestamptz
);

CREATE TABLE IF NOT EXISTS public.apprentice_hour_totals (
  apprentice_application_id uuid,
  total_accepted_hours numeric,
  total_pending_hours numeric,
  host_shop_hours numeric,
  transfer_hours numeric,
  approved_entry_count bigint,
  pending_entry_count bigint,
  pending_review_count bigint
);

CREATE TABLE IF NOT EXISTS public.apprentice_hours_by_shop (
  apprentice_application_id uuid,
  host_shop_application_id uuid,
  approved_hours numeric,
  pending_hours numeric,
  first_entry_date date,
  last_entry_date date
);

CREATE TABLE IF NOT EXISTS public.apprentice_hours_by_source (
  apprentice_application_id uuid,
  source_type text,
  accepted_hours numeric,
  pending_hours numeric,
  entry_count bigint
);

CREATE TABLE IF NOT EXISTS public.apprentice_notifications (
  id uuid DEFAULT gen_random_uuid(),
  apprenticeship_id uuid,
  student_id uuid,
  notification_type text,
  scheduled_time text,
  days_of_week text,
  enabled boolean,
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprentice_payroll (
  id uuid DEFAULT gen_random_uuid(),
  apprenticeship_id uuid,
  student_id uuid,
  pay_period_start date,
  pay_period_end date,
  total_hours numeric,
  hourly_rate numeric,
  gross_pay numeric,
  status text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprentice_progress (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  total_hours bigint
);

CREATE TABLE IF NOT EXISTS public.apprentice_service_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprentice_skill_progress (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  progress text,
  skills text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprentice_wage_updates (
  id uuid DEFAULT gen_random_uuid(),
  placement_id uuid,
  effective_date date,
  hourly_wage numeric,
  note text,
  submitted_by_user_id uuid,
  submitted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.apprentice_weekly_reports (
  id uuid DEFAULT gen_random_uuid(),
  placement_id uuid,
  week_start date,
  week_end date,
  hours_total numeric,
  hours_ojt numeric,
  hours_related numeric,
  attendance_notes text,
  competencies_notes text,
  submitted_by_user_id uuid,
  submitted_at timestamptz,
  status text,
  sponsor_review_notes text,
  sponsor_reviewed_at timestamptz,
  sponsor_reviewed_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprenticeship_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  program_id uuid,
  employer_name text,
  supervisor_name text,
  start_date date,
  status text,
  total_hours_required bigint,
  total_hours_completed numeric,
  created_at timestamptz DEFAULT now(),
  employer_id uuid,
  site_id uuid
);

CREATE TABLE IF NOT EXISTS public.apprenticeship_hours_summary (
  student_id uuid,
  program_slug text,
  week_start timestamptz,
  total_hours numeric,
  approved_hours numeric,
  pending_hours numeric,
  disputed_hours numeric,
  entry_count bigint
);

CREATE TABLE IF NOT EXISTS public.apprenticeship_portfolio (
  id uuid DEFAULT gen_random_uuid(),
  apprenticeship_id uuid,
  student_id uuid,
  title text,
  file_url text,
  date_created date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprenticeship_programs (
  id uuid DEFAULT gen_random_uuid(),
  slug text,
  name text,
  state text,
  required_hours bigint,
  program_fee numeric,
  vendor_name text,
  vendor_cost numeric,
  licensing_agency text,
  occupation_code text,
  is_etpl_approved boolean,
  is_active boolean,
  description text,
  disclaimer text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprenticeship_shop_drafts (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprenticeship_shops (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apprenticeships (
  id uuid DEFAULT gen_random_uuid(),
  employer_id uuid,
  program_id uuid,
  title text,
  description text,
  duration_months bigint,
  wage_progression jsonb,
  requirements text,
  benefits text,
  mentor_assigned uuid,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_tokens (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  application_id uuid,
  token text,
  used_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignment_rubrics (
  id uuid DEFAULT gen_random_uuid(),
  assignment_id uuid,
  rubric_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid DEFAULT gen_random_uuid(),
  check_in_time text,
  description text,
  enrolled_at timestamptz,
  funding_type text,
  get text,
  has text,
  program text,
  program_id uuid,
  status text,
  student text,
  student_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  login_time text,
  student_id uuid
);

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  host_id uuid,
  scheduled_at timestamptz,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audio_preferences (
  id uuid DEFAULT gen_random_uuid(),
  key text,
  value text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ambient_enabled boolean,
  ambient_volume text
);

CREATE TABLE IF NOT EXISTS public.audit_export_log (
  id uuid DEFAULT gen_random_uuid(),
  export_time timestamptz,
  rows_exported bigint,
  from_timestamp timestamptz,
  to_timestamp timestamptz,
  storage_path text,
  checksum text,
  status text
);

CREATE TABLE IF NOT EXISTS public.audit_snapshot (
  apprentice_id uuid,
  referral_source text,
  program text,
  referral_date timestamptz,
  employer text,
  funding_source text,
  funding_status text,
  rapids_status text,
  wotc_submitted boolean,
  ojt_status text
);

CREATE TABLE IF NOT EXISTS public.autopilot_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.autopilot_settings (
  id uuid DEFAULT gen_random_uuid(),
  key text,
  value text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.avatar_chat_interactions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.avatars (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.backups (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  icon_url text,
  badge_type text,
  criteria jsonb,
  points_reward bigint,
  rarity text,
  is_active boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.badges (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  icon text,
  category text,
  criteria jsonb,
  points bigint,
  rarity text,
  created_at timestamptz DEFAULT now(),
  icon_url text
);

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid DEFAULT gen_random_uuid(),
  client_id uuid,
  routing_number text,
  account_number text,
  account_type text,
  is_primary boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banking_services (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  epstax text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.barber_payments (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric,
  status text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  stripe_subscription_id text,
  stripe_invoice_id text,
  amount_paid numeric,
  payment_date timestamptz,
  invoice_url text
);

CREATE TABLE IF NOT EXISTS public.barber_shops (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  license_number text,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  email text,
  owner_name text,
  owner_license text,
  is_approved boolean,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.barbershop_partner_applications (
  id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text,
  shop_legal_name text,
  shop_dba_name text,
  owner_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  shop_address_line1 text,
  shop_address_line2 text,
  shop_city text,
  shop_state text,
  shop_zip text,
  indiana_shop_license_number text,
  supervisor_name text,
  supervisor_license_number text,
  supervisor_years_licensed bigint,
  employment_model text,
  has_workers_comp boolean,
  can_supervise_and_verify boolean,
  mou_acknowledged boolean,
  consent_acknowledged boolean,
  notes text,
  source_url text,
  user_agent text,
  ip_hash text,
  internal_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  apprentices_on_payroll boolean,
  compensation_model text,
  number_of_employees bigint,
  has_general_liability boolean,
  workers_comp_status text,
  signature_data text,
  insurance_status text,
  insurance_validation_json jsonb,
  insurance_reason_codes text,
  insurance_reviewed_at timestamptz,
  insurance_review_method text,
  insurance_coi_file_path text,
  worker_relationship text,
  ein text,
  ein_document_path text,
  ein_qa_notes text,
  shop_physical_address text,
  employer_acceptance_acknowledged boolean,
  employer_acceptance_signature_data text,
  employer_acceptance_signed_at timestamptz,
  employer_acceptance_signer_name text,
  mou_signature_data text,
  mou_signed_at timestamptz,
  mou_signer_name text,
  consent_signature_data text,
  consent_signed_at timestamptz,
  consent_signer_name text
);

CREATE TABLE IF NOT EXISTS public.benefits_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  plan_id uuid,
  enrollment_date date,
  effective_date date,
  termination_date date,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.benefits_plans (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  plan_name text,
  plan_type text,
  description text,
  provider text,
  employee_cost numeric,
  employer_cost numeric,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_accounts (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_cycles (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  cycle_start date,
  cycle_end date,
  amount_due numeric,
  amount_paid numeric,
  status text,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bridge_payment_plans (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric,
  status text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  academic_access_paused boolean,
  academic_access_paused_reason text,
  balance_remaining numeric,
  down_payment_paid numeric,
  plan_start_date timestamptz
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  description text,
  date date,
  time text,
  duration bigint,
  color text,
  event_type text,
  location text,
  reminder_minutes bigint,
  is_recurring boolean,
  recurrence_rule text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  start_at timestamptz,
  end_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.call_requests (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  email text,
  phone text,
  preferred_time text,
  reason text,
  status text,
  assigned_to uuid,
  called_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.callback_requests (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  phone text,
  preferred_time timestamptz,
  reason text,
  status text,
  assigned_to uuid,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_templates (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  content text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.captcha_attempts (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.career_applications (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  phone text,
  program_id uuid,
  application_state text,
  submitted_at timestamptz,
  last_transition_at timestamptz,
  state_history jsonb,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
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
  years_experience text,
  status text
);

CREATE TABLE IF NOT EXISTS public.career_counseling_conversations (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.career_counseling_messages (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  role text
);

CREATE TABLE IF NOT EXISTS public.carts (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_management (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_manager_assignments (
  application_id uuid,
  case_manager_id uuid,
  id text
);

CREATE TABLE IF NOT EXISTS public.case_manager_notes (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_managers (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  agency text,
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_notes (
  id uuid DEFAULT gen_random_uuid(),
  avatar_url text,
  city text,
  content text,
  courses jsonb,
  due_date timestamptz,
  email text,
  enrolled_at timestamptz,
  first_name text,
  last_name text,
  phone text,
  profiles jsonb,
  programs text,
  progress text,
  status text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  author_name text,
  category text,
  note text
);

CREATE TABLE IF NOT EXISTS public.case_studies (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  jpg text,
  logo_url text,
  results jsonb,
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_tasks (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cases (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_advance_applications (
  id uuid DEFAULT gen_random_uuid(),
  approved boolean,
  approved_amount text,
  email text,
  epstax text,
  first_name text,
  jpg text,
  last_name text,
  monthly_income text,
  requested_amount text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_advances (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  amount numeric,
  status text,
  requested_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  disbursed_at timestamptz,
  repayment_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.certificate_funding_status_log (
  id uuid DEFAULT gen_random_uuid(),
  certificate_id uuid,
  previous_status text,
  new_status text,
  changed_by uuid,
  changed_at timestamptz,
  reason text,
  source text
);

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  assigned_to uuid,
  priority text,
  tags text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid DEFAULT gen_random_uuid(),
  conversation_id uuid,
  sender_id uuid,
  content text,
  message_type text,
  is_ai_generated boolean,
  created_at timestamptz DEFAULT now(),
  role text
);

CREATE TABLE IF NOT EXISTS public.checkin_sessions (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  host_id uuid,
  scheduled_at timestamptz,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  checkin_time text,
  shop_id uuid
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  middle_name text,
  ssn text,
  date_of_birth date,
  email text,
  phone text,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  filing_status text,
  jotform_submission_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinical_hours_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinical_placements (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinical_sites (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cobra_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  plan_id uuid,
  enrollment_date date,
  termination_date date,
  monthly_premium numeric,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.code_examples (
  id uuid DEFAULT gen_random_uuid(),
  com text,
  description text,
  elevateforhumanity text,
  language text,
  path text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collaboration_messages (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collaboration_presence (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_sites (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_event_rsvps (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  event_id uuid,
  event_type text,
  image_url text,
  location_address text,
  location_type text,
  max_attendees bigint,
  start_date timestamptz,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_events (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  event_type text,
  start_date timestamptz,
  end_date timestamptz,
  location text,
  is_virtual boolean,
  max_attendees bigint,
  is_featured boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_group_members (
  id uuid DEFAULT gen_random_uuid(),
  category text,
  description text,
  elevateforhumanity text,
  group_id uuid,
  image_url text,
  is_public boolean,
  member_count bigint,
  members jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_groups (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  category text,
  image_url text,
  member_count bigint,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  is_public boolean
);

CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  role text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.competencies (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  name text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.competency_evidence (
  id uuid DEFAULT gen_random_uuid(),
  student_competency_id uuid,
  evidence_type text,
  file_url text,
  description text,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.competency_tests (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  student_record_id uuid,
  complaint_type text,
  description text,
  desired_resolution text,
  status text,
  assigned_to uuid,
  resolution text,
  submitted_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.completions (
  id uuid DEFAULT gen_random_uuid(),
  all text,
  email text,
  enrollment_status text,
  full_name text,
  program_id uuid,
  programs text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_audits (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  admissions_lead_signed text,
  program_director_signed text
);

CREATE TABLE IF NOT EXISTS public.compliance_documents (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_evidence (
  id uuid DEFAULT gen_random_uuid(),
  item_id uuid,
  file_url text,
  file_name text,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_items (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consent_preferences (
  id uuid DEFAULT gen_random_uuid(),
  key text,
  value text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_hours (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  subject text,
  message text,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_approvals (
  id uuid DEFAULT gen_random_uuid(),
  version_id uuid,
  status text,
  reviewer_id uuid,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_blocks (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_items (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_library (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  content_type text,
  file_url text,
  thumbnail_url text,
  duration_seconds bigint,
  file_size_bytes bigint,
  tags text,
  is_public boolean,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_pages (
  id uuid DEFAULT gen_random_uuid(),
  slug text,
  title text,
  body text,
  is_published boolean,
  tenant_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_sync_log (
  id uuid DEFAULT gen_random_uuid(),
  content_type text,
  content_id uuid,
  source text,
  sync_status text,
  sync_started_at timestamptz,
  sync_completed_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  conversion_type text,
  value numeric,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cookie_consent_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.copilot_usage_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_access (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  user_id uuid,
  granted_by uuid,
  granted_at timestamptz,
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.course_announcements (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  body text,
  title text
);

CREATE TABLE IF NOT EXISTS public.course_categories (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_competencies (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  competency_id uuid,
  is_required boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_completion_status (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_completions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_credentials (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  credential_id uuid,
  is_primary boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_discussions (
  id uuid DEFAULT gen_random_uuid(),
  content text,
  jpg text,
  profiles jsonb,
  replies text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  assignments text,
  completed_at timestamptz,
  courses jsonb,
  final_grade text,
  grade text,
  graded_at timestamptz,
  max_score text,
  programs text,
  progress text,
  score numeric,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  course_id uuid,
  student_id uuid
);

CREATE TABLE IF NOT EXISTS public.course_leaderboard (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  user_id uuid,
  progress_percent numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_materials (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  courses jsonb,
  description text,
  elevateforhumanity text,
  file_url text,
  has text,
  resource_id uuid,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text
);

CREATE TABLE IF NOT EXISTS public.course_metrics (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  title text,
  description text,
  order_index bigint,
  duration_minutes bigint,
  content text,
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  duration text,
  is_required boolean,
  order bigint,
  type text
);

CREATE TABLE IF NOT EXISTS public.course_recommendations (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  program_id uuid,
  recommendation_type text,
  score numeric,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_reviews (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  rating bigint,
  comment text,
  target_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_syllabi (
  id uuid DEFAULT gen_random_uuid(),
  course_name text,
  program_name text,
  version text,
  content text,
  effective_date date,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_tasks (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  title text,
  description text,
  type text,
  due_date timestamptz,
  points bigint,
  required boolean,
  order_index bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_templates (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  category text,
  structure jsonb,
  is_public boolean,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_courses (
  id uuid DEFAULT gen_random_uuid(),
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
  price numeric,
  route text,
  shop_profiles text,
  signal text,
  status text,
  tables text,
  thumbnail_url text,
  total_enrollments text,
  txt text,
  www text,
  xml text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credential_blueprint_competencies (
  id uuid DEFAULT gen_random_uuid(),
  blueprint_id uuid,
  domain_id uuid,
  competency_code text,
  competency_text text,
  competency_description text,
  required_depth text,
  priority_level text,
  must_teach boolean,
  must_assess boolean,
  allowed_examples jsonb,
  blocked_examples jsonb,
  source_reference text,
  sort_order bigint,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credential_blueprint_domains (
  id uuid DEFAULT gen_random_uuid(),
  blueprint_id uuid,
  domain_key text,
  domain_name text,
  domain_description text,
  weight_percent numeric,
  lesson_target_count bigint,
  question_target_count bigint,
  priority_level text,
  sort_order bigint,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credential_blueprints (
  id uuid DEFAULT gen_random_uuid(),
  credential_id uuid,
  blueprint_code text,
  blueprint_name text,
  issuing_body text,
  jurisdiction text,
  exam_version text,
  passing_score numeric,
  time_limit_minutes bigint,
  blueprint_status text,
  source_reference text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credential_generation_rules (
  id uuid DEFAULT gen_random_uuid(),
  blueprint_id uuid,
  lesson_template text,
  reading_level_min bigint,
  reading_level_max bigint,
  target_word_count_min bigint,
  target_word_count_max bigint,
  min_objectives_per_lesson bigint,
  max_objectives_per_lesson bigint,
  min_quiz_questions bigint,
  max_quiz_questions bigint,
  scenario_required boolean,
  reflection_required boolean,
  glossary_required boolean,
  rationale_required boolean,
  summary_required boolean,
  tone_rules jsonb,
  required_sections jsonb,
  banned_patterns jsonb,
  prompt_template_version text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credential_registry (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  abbreviation text,
  description text,
  issuer_type text,
  issuing_authority text,
  proctor_authority text,
  delivery text,
  requires_exam boolean,
  exam_type text,
  exam_location text,
  passing_score bigint,
  verification_source text,
  verification_url text,
  renewal_period_months bigint,
  national_registry_id text,
  cip_code text,
  soc_code text,
  wioa_eligible boolean,
  dol_registered boolean,
  credential_stack text,
  stack_level text,
  is_active boolean,
  is_published boolean,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  competency_area text,
  provider_id uuid
);

CREATE TABLE IF NOT EXISTS public.credential_submissions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  credential_type text,
  issuer text,
  file_url text,
  status text,
  reviewed_by uuid,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credential_validation_rules (
  id uuid DEFAULT gen_random_uuid(),
  blueprint_id uuid,
  min_alignment_score numeric,
  min_domain_coverage_score numeric,
  min_assessment_quality_score numeric,
  min_terminology_compliance_score numeric,
  max_hallucination_risk_score numeric,
  max_duplication_risk_score numeric,
  required_fields jsonb,
  required_terms jsonb,
  blocked_terms jsonb,
  blocked_claims jsonb,
  auto_publish_enabled boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credentialing_partners (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  type text,
  description text,
  website text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.critical_audit_logs (
  id uuid DEFAULT gen_random_uuid(),
  event_type text,
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

CREATE TABLE IF NOT EXISTS public.crm_interactions (
  id uuid DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.cross_tenant_access (
  id uuid DEFAULT gen_random_uuid(),
  source_tenant_id uuid,
  target_tenant_id uuid,
  access_type text,
  resource_type text,
  resource_ids text,
  permissions jsonb,
  is_active boolean,
  granted_by uuid,
  granted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cta_clicks (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curriculum_alignment_audits (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  lesson_id uuid,
  audit_run_at timestamptz,
  claimed_competencies text,
  supported_competencies text,
  unsupported_competencies text,
  competency_fidelity_score bigint,
  exam_relevance_score bigint,
  instructional_completeness_score bigint,
  clarity_score bigint,
  assessment_readiness_score bigint,
  total_score bigint,
  pass_status text,
  failure_reasons text,
  recommended_fix text,
  auditor_version text,
  hard_fail_reasons text,
  model_version text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curriculum_generation_lessons (
  id uuid DEFAULT gen_random_uuid(),
  generation_run_id uuid,
  blueprint_id uuid,
  domain_id uuid,
  program_id uuid,
  course_id uuid,
  module_slug text,
  lesson_slug text,
  lesson_title text,
  lesson_order bigint,
  module_order bigint,
  competency_codes jsonb,
  objectives jsonb,
  instruction_text text,
  scenario_json jsonb,
  reflection_prompt text,
  glossary_json jsonb,
  quiz_json jsonb,
  summary_text text,
  voiceover_script text,
  media_prompt_json jsonb,
  estimated_duration_minutes bigint,
  lesson_status text,
  raw_output jsonb,
  normalized_output jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  competency_id uuid,
  lesson_plan_id uuid,
  bundle_index bigint
);

CREATE TABLE IF NOT EXISTS public.curriculum_generation_runs (
  id uuid DEFAULT gen_random_uuid(),
  blueprint_id uuid,
  program_id uuid,
  course_id uuid,
  initiated_by uuid,
  run_type text,
  model_name text,
  model_version text,
  prompt_template_version text,
  run_status text,
  requested_domain_keys jsonb,
  requested_competency_codes jsonb,
  lessons_requested bigint,
  lessons_generated bigint,
  lessons_passed bigint,
  lessons_failed bigint,
  error_log jsonb,
  metadata jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curriculum_lesson_competencies (
  id uuid DEFAULT gen_random_uuid(),
  generation_lesson_id uuid,
  competency_id uuid,
  coverage_strength numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curriculum_publish_log (
  id uuid DEFAULT gen_random_uuid(),
  generation_lesson_id uuid,
  published_to_curriculum_lesson_id uuid,
  published_by uuid,
  publish_action text,
  publish_status text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curriculum_validation_results (
  id uuid DEFAULT gen_random_uuid(),
  generation_lesson_id uuid,
  blueprint_id uuid,
  alignment_score numeric,
  domain_coverage_score numeric,
  assessment_quality_score numeric,
  terminology_compliance_score numeric,
  hallucination_risk_score numeric,
  duplication_risk_score numeric,
  structure_valid boolean,
  content_valid boolean,
  assessment_valid boolean,
  terminology_valid boolean,
  publish_eligible boolean,
  failure_reasons jsonb,
  warnings jsonb,
  validator_version text,
  validated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curvature_reviews (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  rating bigint,
  comment text,
  target_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  date timestamptz,
  name text,
  service text,
  text text
);

CREATE TABLE IF NOT EXISTS public.customer_billing (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  stripe_customer_id uuid
);

CREATE TABLE IF NOT EXISTS public.customer_service_protocols (
  id uuid DEFAULT gen_random_uuid(),
  category text,
  dos text,
  donts text,
  examples jsonb,
  escalation_rules text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_service_tickets (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  staff_id uuid,
  subject text,
  description text,
  status text,
  priority text,
  category text,
  resolution text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_activities (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  activity_date date,
  lessons_completed bigint,
  quizzes_completed bigint,
  time_spent_minutes bigint,
  points_earned bigint,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_streaks (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  current_streak bigint,
  last_active_date timestamptz,
  longest_streak bigint
);

CREATE TABLE IF NOT EXISTS public.dashboards (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_processing_jobs (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  resource_type text,
  retention_days bigint,
  auto_delete boolean,
  is_active boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_sharing_agreements (
  id uuid DEFAULT gen_random_uuid(),
  partner_name text,
  partner_type text,
  agreement_type text,
  purpose text,
  data_elements text,
  security_requirements text,
  prohibition_on_redisclosure boolean,
  data_retention_period text,
  destruction_method text,
  contact_name text,
  contact_email text,
  contact_phone text,
  signed_by uuid,
  signed_at timestamptz,
  effective_date date,
  expiration_date date,
  status text,
  document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delegate_assignments (
  id uuid DEFAULT gen_random_uuid(),
  delegate_id uuid,
  learner_id uuid,
  assigned_at timestamptz,
  assigned_by uuid,
  notes text,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delegates (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  email text,
  phone text,
  organization text,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  can_view_reports boolean
);

CREATE TABLE IF NOT EXISTS public.delivery_logs (
  id uuid DEFAULT gen_random_uuid(),
  notification_id uuid,
  channel text,
  recipient text,
  status text,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  metadata jsonb,
  template_name text
);

CREATE TABLE IF NOT EXISTS public.demo_analytics (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.departments (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  name text,
  description text,
  manager_id uuid,
  parent_department_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dependents (
  id uuid DEFAULT gen_random_uuid(),
  client_id uuid,
  tax_return_id uuid,
  first_name text,
  last_name text,
  ssn text,
  date_of_birth date,
  relationship text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.devstudio_chat_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_purchases (
  id uuid DEFAULT gen_random_uuid(),
  stripe_session_id text,
  stripe_payment_intent_id text,
  product_name text,
  price_id text,
  amount_total bigint,
  currency text,
  customer_email text,
  download_url text,
  download_expires_at timestamptz,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.direct_deposit_accounts (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  account_type text,
  routing_number text,
  account_number text,
  bank_name text,
  is_primary boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.direct_message_conversations (
  id uuid DEFAULT gen_random_uuid(),
  add text,
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discussion_forums (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  lesson_id uuid,
  title text,
  description text,
  is_locked boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discussion_posts (
  id uuid DEFAULT gen_random_uuid(),
  thread_id uuid,
  user_id uuid,
  content text,
  is_solution boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dmca_takedown_requests (
  id bigint,
  infringing_domain text,
  infringing_url text,
  hosting_provider text,
  hosting_provider_email text,
  request_date date,
  request_sent_by bigint,
  dmca_notice_text text,
  dmca_notice_file_url text,
  infringing_elements text,
  evidence_urls text,
  status text,
  response_received boolean,
  response_date date,
  response_text text,
  content_removed boolean,
  removal_verified_date date,
  escalated_to_legal boolean,
  escalation_date date,
  notes text,
  created_at text DEFAULT now(),
  updated_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_audit_log (
  id uuid DEFAULT gen_random_uuid(),
  document_id uuid,
  action text,
  performed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_categories (
  id uuid DEFAULT gen_random_uuid(),
  category text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_signatures (
  id uuid DEFAULT gen_random_uuid(),
  document_type text,
  document_id uuid,
  signer_id uuid,
  signature_data text,
  ip_address text,
  user_agent text,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documentation (
  id uuid DEFAULT gen_random_uuid(),
  com text,
  description text,
  elevateforhumanity text,
  language text,
  path text,
  reply_count bigint,
  slug text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.donation_tiers (
  id uuid DEFAULT gen_random_uuid(),
  amount numeric,
  description text,
  donor_name text,
  is_anonymous text,
  stripe text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.downloads (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drug_test_history (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drug_testing_orders (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drug_testing_policies (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ecr_snapshots (
  id uuid DEFAULT gen_random_uuid(),
  student_record_id uuid,
  snapshot_date timestamptz,
  theory_hours numeric,
  practical_hours numeric,
  total_hours numeric,
  gpa numeric,
  attendance_percentage numeric,
  sap_status text,
  progress_percentage bigint,
  milady_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ecr_sync_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.efh_migrations (
  id bigint,
  filename text,
  executed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  template_name text,
  template_version text,
  recipient text,
  status text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  recipient_email text,
  subject text,
  email_type text,
  sent_at timestamptz,
  status text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid DEFAULT gen_random_uuid(),
  recipient_email text,
  subject text,
  body text,
  status text,
  sent_at timestamptz,
  error_message text,
  retry_count bigint,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  key text,
  subject text,
  body text,
  html text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_workflows (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.emails (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_documents (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  document_type text,
  document_name text,
  file_url text,
  uploaded_by uuid,
  uploaded_at timestamptz,
  expires_at date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_goals (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  goal_title text,
  description text,
  target_date date,
  status text,
  progress_percentage bigint,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employer_applications (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  company_name text,
  contact_name text,
  email text,
  phone text,
  status text,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  intake jsonb,
  state text,
  state_updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.employer_incentives (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employer_onboarding (
  id uuid DEFAULT gen_random_uuid(),
  employer_id uuid,
  status text,
  documents jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hiring_needs jsonb,
  mou_signed_at timestamptz,
  mou_signer_name text,
  mou_signer_title text,
  coi_uploaded_at timestamptz,
  coi_expiry_date date,
  workers_comp_uploaded_at timestamptz,
  workers_comp_expiry_date date,
  business_verified_at timestamptz,
  ein text,
  worksite_address text,
  supervisor_name text,
  supervisor_title text,
  supervisor_email text,
  supervisor_phone text,
  compliance_acknowledged_at timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  suspension_reason text
);

CREATE TABLE IF NOT EXISTS public.employer_sponsors (
  id uuid DEFAULT gen_random_uuid(),
  company_name text,
  contact_name text,
  email text,
  phone text,
  program_supported text,
  wage_commitment numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employer_sponsorships (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  enrollment_id uuid,
  reimbursements_received numeric,
  term_months bigint,
  total_reimbursed numeric,
  total_tuition numeric
);

CREATE TABLE IF NOT EXISTS public.employment_tracking (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  enrollment_id uuid,
  employer_name text,
  job_title text,
  employment_start_date date,
  employment_end_date date,
  hourly_wage numeric,
  hours_per_week numeric,
  annual_salary numeric,
  verified_2nd_quarter boolean,
  verified_2nd_quarter_date date,
  wage_2nd_quarter numeric,
  verified_4th_quarter boolean,
  verified_4th_quarter_date date,
  wage_4th_quarter numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  notes text
);

CREATE TABLE IF NOT EXISTS public.enrollment_acknowledgments (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  acknowledged boolean,
  acknowledged_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.enrollment_agreements (
  id uuid DEFAULT gen_random_uuid(),
  application_id uuid,
  signed boolean,
  signed_at timestamptz,
  signature_name text,
  ip_address text,
  agreement_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrollment_cases (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  employer_id uuid,
  program_holder_id uuid,
  signatures_completed boolean,
  signatures_required text,
  student_id uuid
);

CREATE TABLE IF NOT EXISTS public.enrollment_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  course_id uuid,
  funding_program_id uuid,
  kind text
);

CREATE TABLE IF NOT EXISTS public.enrollment_funding_status_log (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  previous_funding_status text,
  new_funding_status text,
  previous_training_status text,
  new_training_status text,
  changed_at timestamptz,
  reason text,
  source text
);

CREATE TABLE IF NOT EXISTS public.enrollment_idempotency (
  idempotency_key text,
  enrollment_id text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.enrollment_jobs (
  id uuid DEFAULT gen_random_uuid(),
  attempt_count bigint,
  email text,
  enrollment_id uuid,
  first_name text,
  job_type text,
  last_error text,
  last_name text,
  max_attempts text,
  program_enrollments text,
  scheduled_for text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrollment_module_progress (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrollment_payments (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  student_id uuid,
  amount numeric,
  payment_number bigint,
  total_payments bigint,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  status text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrollment_status_history (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  from_status text,
  to_status text,
  changed_by uuid,
  changed_at timestamptz,
  reason text,
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS public.enrollment_steps (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  provider_id uuid,
  sequence_order bigint,
  status text,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  external_enrollment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrollment_transitions (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  from_status text,
  to_status text,
  changed_by uuid,
  reason text,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entities (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  uei text,
  cage text,
  ein text,
  entity_type text,
  naics_list text,
  capability_narrative text,
  org_history text,
  key_personnel text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid DEFAULT gen_random_uuid(),
  org_id uuid,
  source text,
  features jsonb,
  max_seats bigint,
  max_courses bigint,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entity_eligibility_checks (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.etpl_metrics (
  quarter timestamptz,
  enrollments bigint,
  completions bigint,
  exits bigint
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid DEFAULT gen_random_uuid(),
  event_id uuid,
  user_id uuid,
  status text,
  attended boolean,
  registered_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.exam_attempt_questions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exam_authorization_queue (
  authorization_id uuid,
  user_id uuid,
  program_id uuid,
  status text,
  authorized_at timestamptz,
  expires_at timestamptz,
  notes text,
  learner_email text,
  learner_name text,
  program_slug text,
  program_title text,
  scheduled_date date,
  testing_center text,
  scheduling_outcome text,
  exam_passed boolean,
  exam_score numeric,
  exam_date date,
  days_until_expiry bigint,
  expiring_soon boolean,
  action_needed text
);

CREATE TABLE IF NOT EXISTS public.exam_bookings (
  id uuid DEFAULT gen_random_uuid(),
  exam_type text,
  exam_name text,
  booking_type text,
  first_name text,
  last_name text,
  email text,
  phone text,
  organization text,
  participant_count bigint,
  preferred_date date,
  preferred_time text,
  alternate_date date,
  notes text,
  status text,
  confirmed_date date,
  confirmed_time text,
  seat_number bigint,
  confirmation_code text,
  admin_notes text,
  cancelled_at timestamptz,
  cancelled_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exam_outcome_tracking (
  program_slug text,
  program_title text,
  total_authorized bigint,
  total_scheduled bigint,
  total_sat bigint,
  total_no_show bigint,
  total_results_recorded bigint,
  total_passed bigint,
  total_failed bigint,
  first_time_pass_rate_pct numeric,
  no_show_rate_pct numeric,
  avg_exam_score numeric
);

CREATE TABLE IF NOT EXISTS public.exam_readiness (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  student_id uuid,
  theory_complete boolean
);

CREATE TABLE IF NOT EXISTS public.exam_ready_status (
  user_id uuid,
  program_id uuid,
  enrollment_id uuid,
  program_slug text,
  program_title text,
  total_checkpoints bigint,
  passed_checkpoints bigint,
  avg_score numeric,
  min_score bigint,
  min_avg_checkpoint_score bigint,
  min_checkpoint_score bigint,
  is_exam_ready boolean,
  status_label text,
  evaluated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.exams (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_lms_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  external_lms_name text,
  external_course_id text,
  external_enrollment_id text,
  status text,
  enrolled_at timestamptz,
  completed_at timestamptz,
  sync_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_module_progress (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  partner_enrollment_id uuid,
  module_id text,
  module_name text,
  status text,
  progress_percentage numeric,
  score numeric,
  time_spent_seconds bigint,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_modules (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  title text,
  description text,
  external_url text,
  provider text,
  duration_minutes bigint,
  sort_order bigint,
  is_required boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_partner_modules (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  title text,
  partner_name text,
  partner_type text,
  delivery_mode text,
  launch_url text,
  external_course_code text,
  description text,
  hours numeric,
  requires_proof boolean,
  is_required boolean,
  sort_order bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_partner_progress (
  id uuid DEFAULT gen_random_uuid(),
  module_id uuid,
  user_id uuid,
  status text,
  proof_file_url text,
  notes text,
  external_enrollment_id text,
  external_account_id text,
  progress_percentage bigint,
  completed_at timestamptz,
  certificate_url text,
  certificate_number text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.external_program_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  application_id uuid,
  user_id uuid,
  program_slug text,
  enrollment_state text,
  assigned_admin uuid,
  start_date date,
  notes text,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  funding_verified boolean,
  funding_source text,
  funding_verified_at timestamptz,
  funding_verified_by uuid,
  voided_at timestamptz,
  voided_reason text,
  email text,
  full_name text,
  delivery_model text,
  status text,
  enrolled_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id uuid DEFAULT gen_random_uuid(),
  email text,
  ip_address text,
  user_agent text,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faq_search_analytics (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  rating bigint,
  comment text,
  target_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text
);

CREATE TABLE IF NOT EXISTS public.feedback_votes (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  rating bigint,
  comment text,
  target_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferpa_access_requests (
  id uuid DEFAULT gen_random_uuid(),
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
  status text,
  student_email text,
  student_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferpa_audit_log (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferpa_calendar_events (
  id uuid DEFAULT gen_random_uuid(),
  all_day boolean,
  date timestamptz,
  description text,
  event_type text,
  other text,
  start_date timestamptz,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferpa_compliance_checklist (
  id uuid DEFAULT gen_random_uuid(),
  checklist_type text,
  academic_year text,
  items jsonb,
  completed_items bigint,
  total_items bigint,
  completion_percentage numeric,
  reviewed_by uuid,
  reviewed_at timestamptz,
  status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferpa_consent_forms (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  consent_type text,
  recipient_name text,
  recipient_organization text,
  purpose text,
  data_elements text,
  signature text,
  signed_at timestamptz,
  expires_at timestamptz,
  revoked boolean,
  revoked_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferpa_disclosure_log (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  disclosed_by uuid,
  disclosed_to text,
  disclosure_type text,
  purpose text,
  data_disclosed jsonb,
  consent_id uuid,
  legal_basis text,
  disclosed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferpa_documents (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  document_type text,
  file_url text,
  html text,
  url text,
  version text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferpa_student_acknowledgments (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  orientation_completed boolean,
  orientation_completed_at timestamptz,
  rights_acknowledged boolean,
  directory_opt_out boolean,
  signature text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferpa_training (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  certificate_id uuid,
  completed_at timestamptz,
  passed boolean,
  quiz_score bigint
);

CREATE TABLE IF NOT EXISTS public.ferpa_training_records (
  id text,
  user_id uuid,
  quiz_score numeric,
  quiz_answers jsonb,
  training_signature text,
  confidentiality_signature text,
  training_acknowledged boolean,
  confidentiality_acknowledged boolean,
  completed_at timestamptz,
  expires_at timestamptz,
  ip_address text,
  user_agent text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ferpa_violation_reports (
  id uuid DEFAULT gen_random_uuid(),
  reported_by uuid,
  reported_by_name text,
  reported_by_email text,
  violation_type text,
  description text,
  student_affected uuid,
  date_of_violation timestamptz,
  evidence jsonb,
  status text,
  investigated_by uuid,
  investigation_notes text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.files (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  file_url text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  storage_path text
);

CREATE TABLE IF NOT EXISTS public.financial_assurances (
  id uuid DEFAULT gen_random_uuid(),
  amount numeric,
  expiration_date date,
  issue_date date,
  provider text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.follow_ups (
  id uuid DEFAULT gen_random_uuid(),
  participant_id uuid,
  case_worker_id uuid,
  type text,
  due_date timestamptz,
  status text,
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.followup_schedule (
  id bigint,
  user_id bigint,
  program_id bigint,
  followup_type text,
  scheduled_date date,
  status text,
  completed_date date,
  completed_by bigint,
  contact_method text,
  contact_attempts bigint,
  outcome_notes text,
  still_employed boolean,
  needs_support boolean,
  created_at text DEFAULT now(),
  updated_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_comments (
  id uuid DEFAULT gen_random_uuid(),
  post_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_members (
  id uuid DEFAULT gen_random_uuid(),
  forum_id uuid,
  user_id uuid,
  role text,
  joined_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.forum_reactions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  target_type text,
  target_id uuid,
  reaction_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_subscriptions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_thread_views (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_votes (
  id uuid DEFAULT gen_random_uuid(),
  thread_id uuid,
  post_id uuid,
  user_id uuid,
  vote_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forums (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  title text,
  created_at timestamptz DEFAULT now(),
  description text,
  name text,
  post_count bigint,
  thread_count bigint
);

CREATE TABLE IF NOT EXISTS public.foundation_services (
  id uuid DEFAULT gen_random_uuid(),
  content text,
  description text,
  elevateforhumanity text,
  schedule text,
  years_sober text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.franchises (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  owner_id uuid,
  status text,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funding_applications (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  course_id uuid,
  program_type text,
  status text,
  personal_info jsonb,
  employment_info jsonb,
  education_info jsonb,
  funding_info jsonb,
  documents jsonb,
  signature jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  program_id uuid
);

CREATE TABLE IF NOT EXISTS public.funding_cases (
  id uuid DEFAULT gen_random_uuid(),
  apprentice_id uuid,
  funding_source text,
  ita_number text,
  approved_amount numeric,
  status text,
  case_manager text,
  workone_region text,
  approval_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funding_change_audit (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funding_options (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  gov text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funding_payments (
  id uuid DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.funding_programs (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  code text
);

CREATE TABLE IF NOT EXISTS public.funding_records (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  amount numeric
);

CREATE TABLE IF NOT EXISTS public.funding_tracking (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gamification_points (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  level text,
  level_name text,
  points_to_next_level text,
  total_points text
);

CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.generated_assets (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.global_leaderboard (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  avg_progress numeric,
  total_courses bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grade_items (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grade_records (
  id uuid DEFAULT gen_random_uuid(),
  student_record_id uuid,
  course_name text,
  assignment_name text,
  assignment_type text,
  points_earned numeric,
  points_possible numeric,
  percentage numeric,
  letter_grade text,
  graded_by uuid,
  graded_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grant_eligibility_results (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grant_entities (
  id uuid DEFAULT gen_random_uuid(),
  agency text,
  draft text,
  due_date timestamptz,
  intake text,
  jpg text,
  ready text,
  status text,
  submitted text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grant_federal_forms (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grant_matches (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grant_notification_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grant_notifications (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grant_packages (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grant_sources (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  code text,
  base_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grant_submissions (
  id uuid DEFAULT gen_random_uuid(),
  awarded text,
  confirmation_number text,
  elevateforhumanity text,
  entity text,
  grant text,
  jpg text,
  other text,
  portal_url text,
  rejected text,
  status text,
  submitted text,
  submitted_at timestamptz,
  submitted_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  timeline jsonb
);

CREATE TABLE IF NOT EXISTS public.grants (
  id uuid DEFAULT gen_random_uuid(),
  agency text,
  draft text,
  due_date timestamptz,
  intake text,
  jpg text,
  ready text,
  status text,
  submitted text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid DEFAULT gen_random_uuid(),
  group_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.handbook_sections (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  pdf text,
  slug text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_logs (
  id uuid DEFAULT gen_random_uuid(),
  service text,
  status text,
  response_time bigint,
  message text,
  timestamp timestamptz
);

CREATE TABLE IF NOT EXISTS public.help_articles (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  slug text,
  content text,
  excerpt text,
  category text,
  category_slug text,
  read_time_minutes bigint,
  is_published boolean,
  is_featured boolean,
  created_at timestamptz DEFAULT now(),
  view_count bigint
);

CREATE TABLE IF NOT EXISTS public.help_categories (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  slug text,
  description text,
  icon text,
  sort_order bigint,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  article_count bigint
);

CREATE TABLE IF NOT EXISTS public.help_search_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.holidays (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  name text,
  date date,
  is_recurring boolean,
  is_paid boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hour_entry_status_history (
  id uuid DEFAULT gen_random_uuid(),
  hour_entry_id uuid,
  old_status text,
  new_status text,
  changed_by text,
  changed_by_role text,
  changed_at timestamptz,
  reason text
);

CREATE TABLE IF NOT EXISTS public.hour_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hours bigint
);

CREATE TABLE IF NOT EXISTS public.hour_tracking (
  id uuid DEFAULT gen_random_uuid(),
  student_record_id uuid,
  date date,
  theory_hours numeric,
  practical_hours numeric,
  total_hours numeric,
  activity_description text,
  supervisor_id uuid,
  approved boolean,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hours_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hours bigint,
  type text
);

CREATE TABLE IF NOT EXISTS public.hours_logs (
  id uuid DEFAULT gen_random_uuid(),
  activity_type text,
  date timestamptz,
  description text,
  hours bigint,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hsi_course_products (
  id uuid DEFAULT gen_random_uuid(),
  course_name text,
  hsi_enrollment_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hsi_enrollment_queue (
  id uuid DEFAULT gen_random_uuid(),
  student_name text,
  student_email text,
  course_type text,
  amount_paid numeric,
  payment_status text,
  enrollment_status text,
  hsi_student_id text,
  hsi_enrollment_link text,
  stripe_session_id text,
  stripe_payment_intent text,
  error_message text,
  retry_count bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  funding_source text
);

CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.impact_metrics (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.impact_statistics (
  id uuid DEFAULT gen_random_uuid(),
  amount numeric,
  description text,
  donor_name text,
  is_anonymous text,
  stripe text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incentives (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.income_sources (
  id uuid DEFAULT gen_random_uuid(),
  tax_return_id uuid,
  income_type text,
  employer_name text,
  ein text,
  wages numeric,
  federal_withholding numeric,
  state_withholding numeric,
  social_security_wages numeric,
  medicare_wages numeric,
  document_id uuid,
  ocr_extracted boolean,
  verified boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.indiana_alerts_sent (
  id uuid DEFAULT gen_random_uuid(),
  program_holder_id uuid,
  alert_type text,
  alert_level text,
  subject text,
  body text,
  channels text,
  sent_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.indiana_enforcement_actions (
  id uuid DEFAULT gen_random_uuid(),
  program_holder_id uuid,
  action text,
  reason text,
  effective_date date,
  notification_sent boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.indiana_hour_categories (
  id uuid DEFAULT gen_random_uuid(),
  code text,
  name text,
  description text,
  hour_type text,
  min_hours numeric,
  max_hours numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.indiana_timeclock_daily_export (
  apprentice_id uuid,
  partner_id uuid,
  site_id uuid,
  program_id text,
  work_date date,
  week_ending date,
  clock_in_at timestamptz,
  lunch_start_at timestamptz,
  lunch_end_at timestamptz,
  clock_out_at timestamptz,
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  auto_clocked_out boolean,
  auto_clock_out_reason text
);

CREATE TABLE IF NOT EXISTS public.indiana_timeclock_weekly_summary_export (
  apprentice_id uuid,
  partner_id uuid,
  program_id text,
  week_ending date,
  max_hours_per_week numeric,
  total_recorded_hours numeric,
  verified_hours numeric,
  entry_count bigint
);

CREATE TABLE IF NOT EXISTS public.individual_employment_plans (
  id uuid DEFAULT gen_random_uuid(),
  participant_id uuid,
  primary_career_goal text,
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
  job_placement_assistance_needed boolean,
  short_term_goals text,
  long_term_goals text,
  plan_status text,
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

CREATE TABLE IF NOT EXISTS public.industries (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  jpg text,
  programs text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  integration text,
  is_active boolean,
  jpg text,
  note text,
  schedule text,
  slug text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interactive_elements (
  id uuid DEFAULT gen_random_uuid(),
  lesson_id uuid,
  element_type text,
  config jsonb,
  position_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interactive_quizzes (
  id uuid DEFAULT gen_random_uuid(),
  lesson_id uuid,
  title text,
  description text,
  passing_score bigint,
  time_limit_minutes bigint,
  max_attempts bigint,
  show_correct_answers boolean,
  shuffle_questions boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid DEFAULT gen_random_uuid(),
  candidate text,
  date timestamptz,
  interview_type text,
  jobs text,
  outcome text,
  position text,
  profiles jsonb,
  scheduled_at timestamptz,
  status text,
  time text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  invoice_number text,
  amount numeric,
  tax numeric,
  total numeric,
  currency text,
  status text,
  due_date date,
  paid_at timestamptz,
  items jsonb,
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  amount_cents bigint,
  date timestamptz
);

CREATE TABLE IF NOT EXISTS public.ip_access_control (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  ip_address text,
  ip_range text,
  rule_type text,
  description text,
  is_active boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_listings (
  id uuid DEFAULT gen_random_uuid(),
  company text,
  desc text,
  location text,
  position text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_opportunities (
  id uuid DEFAULT gen_random_uuid(),
  employer_id uuid,
  title text,
  description text,
  location text,
  salary_range text,
  job_type text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_placements (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  employer_id uuid,
  job_title text,
  start_date date,
  end_date date,
  status text,
  hourly_wage numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  tenant_id uuid,
  employer_name text,
  user_id uuid
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jri_participants (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leaderboard (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  leaderboard_type text,
  program_id uuid,
  score bigint,
  rank bigint,
  period_start date,
  period_end date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  course_id uuid,
  points bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learner_ai_policies (
  id uuid DEFAULT gen_random_uuid(),
  learner_id uuid,
  enrollment_id uuid,
  policy_id uuid,
  assigned_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.learner_compliance (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  program_id uuid,
  status text,
  hours_completed bigint,
  hours_required bigint,
  certifications_completed bigint,
  certifications_required bigint,
  expiry_date date,
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learner_documents (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  avatar_url text,
  city text,
  content text,
  courses jsonb,
  due_date timestamptz,
  email text,
  enrolled_at timestamptz,
  first_name text,
  last_name text,
  phone text,
  profiles jsonb,
  programs text,
  progress text,
  status text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learner_goals (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  avatar_url text,
  city text,
  content text,
  courses jsonb,
  due_date timestamptz,
  email text,
  enrolled_at timestamptz,
  first_name text,
  last_name text,
  phone text,
  profiles jsonb,
  programs text,
  progress text,
  status text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learner_module_gate_state (
  user_id uuid,
  program_id uuid,
  locked_module_order bigint,
  checkpoint_lesson_id uuid,
  checkpoint_title text,
  required_score bigint,
  best_score bigint,
  checkpoint_passed boolean,
  attempt_count bigint,
  is_locked boolean,
  gate_status text
);

CREATE TABLE IF NOT EXISTS public.learner_onboarding (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  full_name text,
  phone text,
  email text,
  dob text,
  address text,
  emergency_name text,
  emergency_phone text,
  program text,
  employment_status text,
  support_needs text,
  goals text,
  attendance_commitment boolean,
  handbook_read boolean,
  privacy_understood boolean,
  signature text,
  submitted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.learning_activity (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  activity_type text,
  course_id uuid,
  lesson_id uuid,
  points_earned bigint,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_activity_streaks (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  current_streak_days bigint,
  longest_streak_days bigint,
  last_activity_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_analytics (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  course_id uuid,
  metric_name text,
  metric_value numeric,
  metadata jsonb,
  recorded_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.learning_goals (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  daily_minutes bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  path_type text,
  programs jsonb,
  estimated_weeks bigint,
  difficulty text,
  is_featured boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_resources (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_streaks (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  current_streak bigint,
  longest_streak bigint,
  last_activity_date date,
  streak_start_date date,
  total_active_days bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  leave_type text,
  balance_hours numeric,
  accrued_hours numeric,
  used_hours numeric,
  year bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leave_policies (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  policy_name text,
  leave_type text,
  accrual_rate numeric,
  max_balance numeric,
  carryover_allowed boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  leave_type text,
  start_date date,
  end_date date,
  total_days numeric,
  reason text,
  status text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legal_actions (
  id bigint,
  case_number text,
  case_type text,
  defendant_name text,
  defendant_domain text,
  attorney_name text,
  law_firm text,
  attorney_contact text,
  action_initiated_date date,
  cease_desist_sent_date date,
  lawsuit_filed_date date,
  court_hearing_date date,
  resolution_date date,
  status text,
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
  created_at text DEFAULT now(),
  updated_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_answers (
  id uuid DEFAULT gen_random_uuid(),
  question_id uuid,
  author_id uuid,
  body text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_bookmarks (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  label text,
  position_seconds text
);

CREATE TABLE IF NOT EXISTS public.lesson_comments (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_content_blocks (
  id uuid DEFAULT gen_random_uuid(),
  lesson_id uuid,
  block_type text,
  content jsonb,
  order_index bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_enhancements (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  body text,
  position_seconds text
);

CREATE TABLE IF NOT EXISTS public.lesson_questions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  body text,
  title text
);

CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id uuid DEFAULT gen_random_uuid(),
  lesson_id uuid,
  title text,
  description text,
  resource_type text,
  file_url text,
  file_size_kb bigint,
  download_count bigint,
  order_index bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_resources (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  url text,
  resource_type text,
  course_id uuid,
  is_public boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.license_audit_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.license_keys (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  license_id uuid
);

CREATE TABLE IF NOT EXISTS public.license_requests (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  license_type text,
  status text,
  requested_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.license_tiers (
  id uuid DEFAULT gen_random_uuid(),
  answer text,
  content text,
  description text,
  elevateforhumanity text,
  featured text,
  features text,
  organization text,
  popular text,
  price numeric,
  pricing text,
  question text,
  schedule text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.license_usage (
  tenant_id uuid,
  tenant_name text,
  plan_name text,
  status text,
  seats_limit bigint,
  seats_used bigint,
  seats_remaining bigint,
  features jsonb,
  current_period_start timestamptz,
  current_period_end timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.license_usage_log (
  id uuid DEFAULT gen_random_uuid(),
  license_id uuid,
  enrollment_id uuid,
  student_id uuid,
  action text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.license_violations (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  violation_type text,
  feature text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_class_attendance (
  id uuid DEFAULT gen_random_uuid(),
  class_id uuid,
  user_id uuid,
  joined_at timestamptz,
  left_at timestamptz,
  duration_minutes bigint,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_classes (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  title text,
  description text,
  instructor_id uuid,
  meeting_url text,
  meeting_id text,
  meeting_password text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  status text,
  max_participants bigint,
  recording_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_sessions (
  id uuid DEFAULT gen_random_uuid(),
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lms_lessons (
  id uuid DEFAULT gen_random_uuid(),
  course_id uuid,
  order_index bigint,
  lesson_number bigint,
  title text,
  content text,
  rendered_html text,
  step_type text,
  content_type text,
  slug text,
  lesson_slug text,
  passing_score bigint,
  quiz_questions jsonb,
  activities jsonb,
  video_config jsonb,
  module_id uuid,
  module_title text,
  module_order bigint,
  lesson_order bigint,
  duration_minutes bigint,
  is_published boolean,
  status text,
  lesson_source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  partner_exam_code text,
  video_url text,
  quiz_id uuid,
  description text,
  resources jsonb,
  scorm_package_id text,
  scorm_launch_path text
);

CREATE TABLE IF NOT EXISTS public.lms_organizations (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  subdomain text,
  custom_domain text,
  logo_url text,
  primary_color text,
  secondary_color text,
  settings jsonb,
  subscription_tier text,
  subscription_status text,
  max_users bigint,
  max_courses bigint,
  storage_limit_gb bigint,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  at text
);

CREATE TABLE IF NOT EXISTS public.lti_platforms (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  auth_login_url text,
  jwks_uri text
);

CREATE TABLE IF NOT EXISTS public.makeup_work_requests (
  id uuid DEFAULT gen_random_uuid(),
  student_record_id uuid,
  missed_date date,
  reason text,
  status text,
  approved_by uuid,
  approved_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_campaign_sends (
  id uuid DEFAULT gen_random_uuid(),
  campaign_id uuid,
  contact_id uuid,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced boolean
);

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  name text,
  campaign_type text,
  subject text,
  content text,
  status text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_contacts (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  email text,
  first_name text,
  last_name text,
  tags text,
  subscribed boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_courses (
  id uuid DEFAULT gen_random_uuid(),
  category text,
  creator_name text,
  duration_hours text,
  elevateforhumanity text,
  image_url text,
  jpg text,
  price numeric,
  rating text,
  slug text,
  student_count bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text
);

CREATE TABLE IF NOT EXISTS public.marketplace_sales (
  id uuid DEFAULT gen_random_uuid(),
  product_id uuid,
  creator_id uuid,
  buyer_email text,
  amount_cents bigint,
  creator_earnings_cents bigint,
  platform_earnings_cents bigint,
  stripe_session_id text,
  stripe_payment_intent_id text,
  download_token text,
  download_expires_at timestamptz,
  paid_out boolean,
  payout_date timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_sellers (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  is_verified text,
  products_count bigint,
  profile text,
  rating text,
  store_name text,
  total_sales text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media (
  id uuid DEFAULT gen_random_uuid(),
  path text,
  uploaded_by uuid,
  created_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_action_items (
  id uuid DEFAULT gen_random_uuid(),
  recap_id uuid,
  label text,
  due_date date,
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_recaps (
  id uuid DEFAULT gen_random_uuid(),
  organization_id uuid,
  created_by uuid,
  attendee_email text,
  title text,
  meeting_date timestamptz,
  source text,
  transcript text,
  summary text,
  key_points jsonb,
  decisions jsonb,
  follow_up_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  host_id uuid,
  scheduled_at timestamptz,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mentor_sessions (
  id uuid DEFAULT gen_random_uuid(),
  date timestamptz,
  duration bigint,
  duration_minutes text,
  enrollments text,
  mentee text,
  mentee_id uuid,
  profiles jsonb,
  program text,
  progress text,
  scheduled_at timestamptz,
  session_type text,
  sessions text,
  status text,
  time text,
  topic text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mentorships (
  id uuid DEFAULT gen_random_uuid(),
  date timestamptz,
  enrollments text,
  mentee text,
  mentee_id uuid,
  profiles jsonb,
  program text,
  progress text,
  scheduled_at timestamptz,
  sessions text,
  status text,
  time text,
  topic text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  mentor_id uuid
);

CREATE TABLE IF NOT EXISTS public.message_notifications (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  conversation_id uuid
);

CREATE TABLE IF NOT EXISTS public.migration_audit (
  id bigint,
  filename text,
  applied_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.milady_access (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  access_url text,
  license_code text,
  manually_provisioned_at timestamptz,
  program_slug text,
  provisioned_at timestamptz,
  provisioning_method text,
  student_id uuid,
  username text
);

CREATE TABLE IF NOT EXISTS public.milady_email_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.milady_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  enrollment_id uuid,
  milady_student_id text,
  milady_email text,
  enrolled_at timestamptz,
  courses_completed jsonb,
  certificate_url text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.milady_license_codes (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.milady_orientation_status (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.milady_provisioning_queue (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  amount_to_pay numeric,
  course_code text,
  notes text,
  processed_at timestamptz,
  program_slug text,
  student_email text,
  student_id uuid,
  student_name text
);

CREATE TABLE IF NOT EXISTS public.milady_rise_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid DEFAULT gen_random_uuid(),
  moderator_id uuid,
  target_type text,
  target_id uuid,
  action_type text,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id uuid DEFAULT gen_random_uuid(),
  reporter_id uuid,
  target_type text,
  target_id uuid,
  reason text,
  status text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.moderation_rules (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  rule_name text,
  rule_type text,
  conditions jsonb,
  actions jsonb,
  is_active boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.module_progress (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  documents_submitted_at timestamptz,
  duration_minutes text,
  has text,
  module_id uuid,
  order_index text,
  orientation_completed_at timestamptz,
  programs text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
  id bigint,
  source text,
  alert_title text,
  alert_description text,
  alert_url text,
  severity text,
  status text,
  investigated_by bigint,
  investigated_at text,
  investigation_notes text,
  action_required boolean,
  action_taken text,
  related_unauthorized_log_id bigint,
  related_dmca_id bigint,
  related_legal_action_id bigint,
  created_at text DEFAULT now(),
  updated_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mous (
  id uuid DEFAULT gen_random_uuid(),
  effective_date date,
  elevateforhumanity text,
  expiry_date date,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.navigation_categories (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.navigation_items (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  href text,
  parent_name text,
  roles_allowed text,
  sort_order text
);

CREATE TABLE IF NOT EXISTS public.nds_course_catalog (
  id uuid DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.news_articles (
  id uuid DEFAULT gen_random_uuid(),
  category text,
  elevateforhumanity text,
  excerpt text,
  image_url text,
  published_at timestamptz,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.news_categories (
  id uuid DEFAULT gen_random_uuid(),
  category text,
  elevateforhumanity text,
  excerpt text,
  image_url text,
  published_at timestamptz,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nonprofit_services (
  id uuid DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.notes (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  body text,
  data jsonb,
  type text,
  status text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ojt_logs (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  supervisor_id uuid,
  program_id uuid,
  log_date date,
  hours_worked numeric,
  tasks_completed text,
  supervisor_notes text,
  student_reflection text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ojt_notes (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ojt_placements (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  employer_name text,
  position_title text,
  student_id uuid,
  total_hours_completed text,
  total_hours_required text
);

CREATE TABLE IF NOT EXISTS public.ojt_reimbursements (
  id uuid DEFAULT gen_random_uuid(),
  apprentice_id uuid,
  employer_id uuid,
  wage_rate numeric,
  reimbursement_rate numeric,
  hours_worked numeric,
  status text,
  created_at timestamptz DEFAULT now(),
  amount_due numeric
);

CREATE TABLE IF NOT EXISTS public.ojt_student_summary (
  student_id uuid,
  program_id uuid,
  competencies_verified bigint,
  competencies_total bigint,
  total_hours numeric,
  first_observation date,
  last_verification date
);

CREATE TABLE IF NOT EXISTS public.onboarding_checklist (
  id uuid DEFAULT gen_random_uuid(),
  student_record_id uuid,
  task_name text,
  task_description text,
  task_order bigint,
  required boolean,
  completed boolean,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_documents (
  id uuid DEFAULT gen_random_uuid(),
  packet_id uuid,
  title text,
  document_url text,
  requires_signature boolean,
  sort_order bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  content text
);

CREATE TABLE IF NOT EXISTS public.onboarding_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_packets (
  id uuid DEFAULT gen_random_uuid(),
  role text,
  title text,
  description text,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  version text
);

CREATE TABLE IF NOT EXISTS public.onboarding_resources (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  url text,
  resource_type text,
  role text,
  order_index bigint,
  is_active boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_signatures (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  document_id uuid,
  signature_data text,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  role text,
  signature_type text,
  document_version text,
  document_hash text,
  ip_address text,
  user_agent text,
  is_valid boolean
);

CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  step_name text,
  completed boolean,
  completed_at timestamptz,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_submissions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  employee_type text,
  position text,
  department text,
  start_date text,
  personal_info jsonb,
  tax_info jsonb,
  banking_info jsonb,
  emergency_contact jsonb,
  i9_info jsonb,
  agreements jsonb,
  signature text,
  signature_date text,
  ip_address text,
  forms_generated jsonb,
  onboarding_package jsonb,
  summary text,
  can_start_work boolean,
  progress_percentage numeric
);

CREATE TABLE IF NOT EXISTS public.open_timeclock_shifts (
  id uuid DEFAULT gen_random_uuid(),
  apprentice_id uuid,
  partner_id uuid,
  program_id text,
  site_id uuid,
  work_date date,
  clock_in_at timestamptz,
  last_seen_at timestamptz,
  last_seen_within_geofence boolean,
  status text,
  open_duration text
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid(),
  order_id uuid,
  product_id uuid,
  product_name text,
  product_price numeric,
  quantity bigint,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  total numeric,
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_invitations (
  id uuid DEFAULT gen_random_uuid(),
  organization_id uuid,
  email text,
  role text,
  token text,
  invited_by uuid,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_invites (
  id uuid DEFAULT gen_random_uuid(),
  organization_id uuid,
  email text,
  role text,
  token text,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  cohort_id uuid,
  accepted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.org_settings (
  id uuid DEFAULT gen_random_uuid(),
  config jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id uuid DEFAULT gen_random_uuid(),
  organization_id uuid,
  stripe_subscription_id text,
  stripe_customer_id text,
  plan_type text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  licenses_included bigint,
  licenses_used bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_users (
  id uuid DEFAULT gen_random_uuid(),
  organization_id uuid,
  user_id uuid,
  role text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text
);

CREATE TABLE IF NOT EXISTS public.orientation_completions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  user_id uuid,
  program_id uuid,
  video_url text
);

CREATE TABLE IF NOT EXISTS public.participant_barriers (
  id uuid DEFAULT gen_random_uuid(),
  participant_id uuid,
  barrier_type text,
  description text,
  status text,
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.participant_demographics (
  id bigint,
  user_id bigint,
  date_of_birth date,
  gender text,
  race_ethnicity text,
  is_veteran boolean,
  veteran_era text,
  has_disability boolean,
  disability_type text,
  is_low_income boolean,
  household_size bigint,
  annual_household_income numeric,
  highest_education text,
  employment_status_at_entry text,
  receiving_public_assistance boolean,
  barriers text,
  consent_to_share_data boolean,
  consent_date date,
  created_at text DEFAULT now(),
  updated_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.participant_eligibility (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  date_of_birth date,
  gender text,
  ethnicity text,
  race jsonb,
  is_veteran boolean,
  veteran_verified_at timestamptz,
  is_dislocated_worker boolean,
  dislocated_worker_verified_at timestamptz,
  is_low_income boolean,
  low_income_verified_at timestamptz,
  is_youth boolean,
  youth_verified_at timestamptz,
  has_disability boolean,
  disability_verified_at timestamptz,
  eligibility_status text,
  approved_by uuid,
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.participants (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  email text,
  program_id uuid,
  status text,
  enrollment_date date,
  case_worker_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_acknowledgment_items (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_acknowledgments (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledgment_key text
);

CREATE TABLE IF NOT EXISTS public.partner_attendance (
  id uuid DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.partner_completions (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  student_id uuid,
  partner_id uuid,
  program_id uuid,
  completion_date date,
  hours_completed numeric,
  grade text,
  certificate_issued boolean,
  certificate_number text,
  notes text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_course_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  partner_course_id uuid,
  partner_id uuid,
  status text,
  enrolled_at timestamptz,
  completed_at timestamptz,
  progress_percent bigint,
  funding_source text,
  external_enrollment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_course_payments (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric,
  status text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_courses_catalog (
  id uuid DEFAULT gen_random_uuid(),
  provider_id uuid,
  course_name text,
  description text,
  category text,
  wholesale_price numeric,
  retail_price numeric,
  duration_hours numeric,
  is_active boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_credentials (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  partner_enrollment_id uuid,
  provider_id uuid,
  credential_name text,
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

CREATE TABLE IF NOT EXISTS public.partner_enrollment_summary (
  id uuid DEFAULT gen_random_uuid(),
  partner_id uuid,
  program_id uuid,
  total_enrolled bigint,
  total_completed bigint,
  total_active bigint,
  avg_progress numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  partner_id uuid,
  student_id uuid,
  program_id uuid,
  enrollment_date date,
  status text,
  funding_source text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS public.partner_inquiries (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  organization text,
  message text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_lms_sync_logs (
  id uuid DEFAULT gen_random_uuid(),
  active text,
  api_key text,
  api_url text,
  auto_sync text,
  course_name text,
  course_url text,
  error_message text,
  hours bigint,
  last_sync text,
  logo_url text,
  provider_name text,
  provider_type text,
  records_synced text,
  send_notifications text,
  status text,
  sync_frequency text,
  sync_type text,
  track_progress text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_profiles (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  file_url text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  role text,
  status text
);

CREATE TABLE IF NOT EXISTS public.partner_program_courses (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  partner_course_id uuid,
  is_required boolean,
  order_index bigint,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_seat_orders (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  partner_course_id uuid,
  quantity bigint,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_sessions (
  id uuid DEFAULT gen_random_uuid(),
  absent boolean,
  absent_count bigint,
  date timestamptz,
  end_time text,
  enrolled_count bigint,
  present bigint,
  present_count bigint,
  scheduled_date date,
  start_time text,
  time text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_shops (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  owner_name text,
  address text,
  city text,
  state text,
  phone text,
  status text,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.password_history (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  password_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pathways (
  id uuid DEFAULT gen_random_uuid(),
  blue text,
  credential text,
  description text,
  duration bigint,
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

CREATE TABLE IF NOT EXISTS public.pay_stubs (
  id uuid DEFAULT gen_random_uuid(),
  payroll_run_id uuid,
  employee_id uuid,
  gross_pay numeric,
  net_pay numeric,
  federal_tax numeric,
  state_tax numeric,
  social_security numeric,
  medicare numeric,
  deductions jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  type text,
  last_four text,
  brand text,
  exp_month bigint,
  exp_year bigint,
  is_default boolean,
  stripe_payment_method_id text,
  created_at timestamptz DEFAULT now(),
  last4 text
);

CREATE TABLE IF NOT EXISTS public.payment_options (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_plan_selections (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric,
  status text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_plans (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  enrollment_id uuid,
  total_amount numeric,
  installments bigint,
  status text,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_records (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric,
  currency text,
  status text,
  stripe_payment_intent_id text,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_sessions (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  host_id uuid,
  scheduled_at timestamptz,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_splits (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric,
  status text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payout_rate_configs (
  id uuid DEFAULT gen_random_uuid(),
  role text,
  rate_type text,
  rate_amount numeric,
  effective_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  max_rate numeric,
  min_rate numeric
);

CREATE TABLE IF NOT EXISTS public.payroll (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payroll_profiles (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  bank_name text,
  account_type text,
  routing_number text,
  account_number_encrypted text,
  tax_withholding jsonb,
  direct_deposit_enabled boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text
);

CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  pay_period_start date,
  pay_period_end date,
  pay_date date,
  status text,
  total_gross numeric,
  total_net numeric,
  total_taxes numeric,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.peer_review_assignments (
  id uuid DEFAULT gen_random_uuid(),
  assignment_id uuid,
  user_id uuid,
  peers_to_review text,
  due_date timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.peer_reviews (
  id uuid DEFAULT gen_random_uuid(),
  assignment_id uuid,
  reviewer_id uuid,
  reviewee_id uuid,
  rating bigint,
  feedback text,
  status text,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id uuid DEFAULT gen_random_uuid(),
  metric_name text,
  value numeric,
  date date,
  category text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  reviewer_id uuid,
  review_period_start date,
  review_period_end date,
  overall_rating bigint,
  strengths text,
  areas_for_improvement text,
  goals text,
  status text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permission_audit_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  resource_type text,
  resource_id uuid,
  permission_name text,
  granted boolean,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permission_group_members (
  id uuid DEFAULT gen_random_uuid(),
  group_id uuid,
  permission_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permission_groups (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  tenant_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  resource text,
  action text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.phone_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  phone_number text,
  call_type text,
  direction text,
  duration_seconds bigint,
  status text,
  recording_url text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.placements (
  id uuid DEFAULT gen_random_uuid(),
  address text,
  amount numeric,
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
  employee_count bigint,
  impact text,
  industry text,
  is_anonymous text,
  jpg text,
  location text,
  phone text,
  position text,
  verified boolean,
  website text,
  year_established text,
  zip_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_apps (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_features (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  features text,
  schedule text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_products (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  features text,
  jpg text,
  price numeric,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_stats (
  id uuid DEFAULT gen_random_uuid(),
  stat_date date,
  key text,
  value numeric,
  metadata jsonb,
  updated_at timestamptz DEFAULT now(),
  stat_name text,
  stat_value text
);

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  points bigint,
  action_type text,
  description text,
  reference_id uuid,
  reference_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.positions (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  title text,
  description text,
  department_id uuid,
  min_salary numeric,
  max_salary numeric,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.practice_exam_blueprints (
  id uuid DEFAULT gen_random_uuid(),
  blueprint_id uuid,
  exam_name text,
  total_questions bigint,
  passing_score numeric,
  time_limit_minutes bigint,
  assembly_rules jsonb,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id uuid DEFAULT gen_random_uuid(),
  apprenticeship text,
  description text,
  elevateforhumanity text,
  gov text,
  jpg text,
  png text,
  price numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.process_steps (
  id uuid DEFAULT gen_random_uuid(),
  process_id uuid,
  step_number bigint,
  title text,
  description text,
  screenshot_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  id uuid DEFAULT gen_random_uuid(),
  stripe_event_id text,
  payment_intent_id text,
  event_type text,
  processed_at timestamptz,
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS public.processes (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  documents_required text,
  average_time bigint,
  completion_rate numeric,
  category text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proctored_exams (
  id uuid DEFAULT gen_random_uuid(),
  assessment_id uuid,
  proctoring_type text,
  require_webcam boolean,
  require_screen_share boolean,
  allow_breaks boolean,
  max_break_minutes bigint,
  settings jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proctoring_sessions (
  id uuid DEFAULT gen_random_uuid(),
  exam_id uuid,
  user_id uuid,
  session_token text,
  started_at timestamptz,
  ended_at timestamptz,
  status text,
  violations jsonb,
  recording_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_clones (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_page_views (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_reports (
  id uuid DEFAULT gen_random_uuid(),
  product_id uuid,
  reporter_email text,
  reason text,
  details text,
  status text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_announcements (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  title text,
  content text,
  author_id uuid,
  is_pinned boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_banner_views (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_catalog (
  id uuid DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.program_completion_candidates (
  program_enrollment_id uuid,
  user_id uuid,
  program_id uuid,
  last_course_completed_at timestamptz,
  cohort_id uuid,
  funding_source text
);

CREATE TABLE IF NOT EXISTS public.program_course_activity (
  program_enrollment_id uuid,
  user_id uuid,
  program_id uuid,
  program_status text,
  program_enrolled_at timestamptz,
  total_required_courses bigint,
  completed_courses bigint,
  program_progress_pct numeric,
  all_courses_complete boolean,
  last_course_completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.program_discussion_replies (
  id uuid DEFAULT gen_random_uuid(),
  author text,
  content text,
  likes text,
  pinned text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_discussions (
  id uuid DEFAULT gen_random_uuid(),
  all text,
  author text,
  author_id uuid,
  content text,
  likes text,
  pinned text,
  reply_count bigint,
  slug text,
  views text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_funding_options (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_holder_acknowledgements (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  document_type text,
  acknowledged_at timestamptz,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_holder_applications (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  organization_name text,
  contact_name text,
  email text,
  phone text,
  status text,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_holder_banking (
  id uuid DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.program_holder_notes (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  course_id uuid,
  program_holder_id uuid,
  status text,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_holder_payouts (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  stripe_account_id text,
  stripe_account_type text,
  external_account_last4 text,
  bank_name text,
  account_type text,
  payouts_enabled boolean,
  charges_enabled boolean,
  verification_status text,
  verified_at timestamptz,
  verified_by uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_holder_students (
  id uuid DEFAULT gen_random_uuid(),
  program_holder_id uuid,
  student_id uuid,
  program_id uuid,
  enrolled_at timestamptz,
  status text,
  notes text
);

CREATE TABLE IF NOT EXISTS public.program_licenses (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  license_holder_id uuid,
  license_key text,
  license_type text,
  max_enrollments bigint,
  current_enrollments bigint,
  lms_model text,
  external_lms_url text,
  can_create_courses boolean,
  can_upload_scorm boolean,
  status text,
  is_store_license boolean,
  store_id uuid,
  purchased_at timestamptz,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_partner_lms (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  provider_id uuid,
  is_required boolean,
  sequence_order bigint,
  requires_payment boolean,
  payment_amount numeric,
  auto_enroll_on_program_start boolean,
  send_welcome_email boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_required_courses (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  partner_course_id uuid,
  is_required boolean,
  order_index bigint,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_requirement_rules (
  id uuid DEFAULT gen_random_uuid(),
  program_slug text,
  requirement_code text,
  is_required boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_revenue (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  program_holder_id uuid,
  amount numeric,
  funding_source text,
  payment_date date,
  paid_at timestamptz,
  fiscal_year bigint,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_sponsorships (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.programs_for_holder (
  program_holder_id uuid,
  role_in_program text,
  association_status text,
  id uuid DEFAULT gen_random_uuid(),
  slug text,
  title text,
  category text,
  description text,
  estimated_weeks bigint,
  estimated_hours bigint,
  funding_tags text,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  full_description text,
  what_you_learn text,
  day_in_life text,
  salary_min bigint,
  salary_max bigint,
  credential_type text,
  credential_name text,
  employers text,
  funding_pathways text,
  delivery_method text,
  training_hours bigint,
  prerequisites text,
  career_outcomes text,
  industry_demand text,
  image_url text,
  hero_image_url text,
  icon_url text,
  featured boolean,
  wioa_approved boolean,
  dol_registered boolean,
  placement_rate bigint,
  completion_rate bigint,
  total_cost numeric,
  toolkit_cost numeric,
  credentialing_cost numeric,
  name text,
  duration_weeks bigint,
  updated_at timestamptz DEFAULT now(),
  cip_code text,
  soc_code text,
  funding_eligibility text,
  state_code text,
  organization_id uuid,
  category_norm text,
  cover_image_url text,
  cover_image_alt text,
  excerpt text,
  tenant_id uuid,
  partner_name text,
  partner_id uuid,
  published boolean,
  lms_model text,
  requires_license boolean,
  license_type text,
  lms_config jsonb,
  is_store_template boolean,
  store_config jsonb,
  store_id uuid,
  funding_eligible boolean,
  is_free boolean,
  status text,
  canonical_program_id uuid,
  code text,
  total_hours bigint,
  tuition numeric,
  requirements jsonb,
  eligibility_rules jsonb,
  credential text,
  required_hours bigint,
  hero_image text,
  hero_image_alt text,
  availability_status text,
  next_start_date date,
  enrollment_deadline date,
  seats_available bigint,
  total_seats bigint,
  funding_cycle text,
  funding_confirmed boolean,
  is_apprenticeship boolean,
  requires_employer_match boolean,
  accreditation_body text,
  accreditation_expires text,
  accreditation_status text,
  blurb text,
  cover_url text,
  delivery_mode text,
  duration text,
  enrolled_count bigint,
  hours bigint,
  occupation_code text,
  price numeric,
  rapids_required text,
  required_skills jsonb,
  schedule text,
  start_date timestamptz,
  track text,
  type text,
  issuance_policy text,
  min_rti_hours bigint,
  min_ojl_hours bigint,
  requires_instructor_attestation boolean,
  min_engagement_hours numeric,
  completion_criteria jsonb,
  non_exam_program boolean,
  short_description text,
  display_order bigint,
  delivery_model text,
  enrollment_type text,
  external_enrollment_url text,
  has_lms_course boolean,
  hero_headline text,
  hero_subheadline text,
  length_weeks bigint,
  certificate_title text,
  funding text,
  outcomes text
);

CREATE TABLE IF NOT EXISTS public.progress (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed text
);

CREATE TABLE IF NOT EXISTS public.provisioning_events (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  payment_intent_id text,
  correlation_id text,
  step text,
  status text,
  error text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  environment text
);

CREATE TABLE IF NOT EXISTS public.provisioning_jobs (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid DEFAULT gen_random_uuid(),
  email text,
  product_id uuid,
  repo text,
  created_at text DEFAULT now(),
  user_id uuid
);

CREATE TABLE IF NOT EXISTS public.push_notification_send_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  token text,
  platform text,
  is_active boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  token text,
  platform text,
  device_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qa_checklist_completions (
  id uuid DEFAULT gen_random_uuid(),
  checklist_id uuid,
  completed_by uuid,
  entity_type text,
  entity_id uuid,
  items_completed jsonb,
  notes text,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.qa_checklists (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  category text,
  items jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quarterly_performance (
  id bigint,
  quarter bigint,
  year bigint,
  program_id bigint,
  total_enrolled bigint,
  total_completed bigint,
  total_dropped bigint,
  completion_rate numeric,
  total_employed bigint,
  employed_in_field bigint,
  median_wage numeric,
  employment_rate numeric,
  credentials_earned bigint,
  credential_rate numeric,
  retained_30_days bigint,
  retained_90_days bigint,
  retention_rate_90 numeric,
  participants_female bigint,
  participants_male bigint,
  participants_minority bigint,
  participants_veteran bigint,
  participants_disability bigint,
  participants_low_income bigint,
  generated_at text,
  generated_by bigint,
  report_file_url text,
  created_at text DEFAULT now(),
  updated_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.question_bank (
  id uuid DEFAULT gen_random_uuid(),
  blueprint_id uuid,
  domain_id uuid,
  competency_id uuid,
  source_generation_lesson_id uuid,
  question_type text,
  difficulty_level text,
  stem text,
  answer_choices jsonb,
  correct_answer jsonb,
  rationale text,
  remediation_text text,
  question_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  source text,
  competency_code text
);

CREATE TABLE IF NOT EXISTS public.question_banks (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_answer_options (
  id bigint,
  question_id bigint,
  answer_text text,
  is_correct boolean,
  answer_order bigint,
  feedback text,
  created_at text DEFAULT now(),
  updated_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rapids_apprentice_data (
  id uuid DEFAULT gen_random_uuid(),
  apprentice_id uuid,
  rapids_number text,
  occupation_code text,
  sponsor_name text,
  start_date date,
  status text,
  tenant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rapids_registrations (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  enrollment_id uuid,
  rapids_id text,
  occupation_code text,
  sponsor_id text,
  registration_date date,
  expected_completion_date date,
  status text,
  submitted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rapids_tracking (
  id uuid DEFAULT gen_random_uuid(),
  apprentice_id uuid,
  rapids_id text,
  status text,
  registration_date date,
  completion_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recap_generation_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reels (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid,
  title text,
  video_url text,
  thumbnail_url text,
  description text,
  likes_count bigint,
  views_count bigint,
  published boolean
);

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  code text,
  discount_type text,
  discount_value numeric,
  max_uses bigint,
  current_uses bigint,
  expires_at timestamptz,
  is_active boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refund_advance_applications (
  id uuid DEFAULT gen_random_uuid(),
  estimated_amount text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refund_tracking (
  id uuid DEFAULT gen_random_uuid(),
  tax_return_id uuid,
  refund_type text,
  expected_amount numeric,
  actual_amount numeric,
  status text,
  direct_deposit_date date,
  check_mailed_date date,
  received_date date,
  irs_status_code text,
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid DEFAULT gen_random_uuid(),
  student_record_id uuid,
  amount_requested numeric,
  amount_approved numeric,
  reason text,
  status text,
  requested_at timestamptz,
  processed_at timestamptz,
  processed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reporting_completions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reporting_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reporting_funding (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reporting_progress (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reporting_verdicts (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resource_bookmarks (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  resource_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  resource_id uuid,
  downloaded_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.resources (
  id uuid DEFAULT gen_random_uuid(),
  branch text,
  content text,
  description text,
  duration bigint,
  elevateforhumanity text,
  jpg text,
  reply_count bigint,
  slug text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  reviewer_name text,
  reviewer_email text,
  rating bigint,
  content text,
  response text,
  responded_by uuid,
  responded_at timestamptz,
  platform_synced boolean,
  synced_platforms text,
  moderation_status text,
  moderated_by uuid,
  moderated_at timestamptz,
  is_featured boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rise_participants (
  id uuid DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.rise_programs (
  id uuid DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid DEFAULT gen_random_uuid(),
  role_id uuid,
  permission_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_templates (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  permissions jsonb,
  is_public boolean,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.salary_history (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  previous_salary numeric,
  new_salary numeric,
  change_reason text,
  effective_date date,
  changed_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sam_alerts (
  id uuid DEFAULT gen_random_uuid(),
  gov text,
  status text,
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sam_documents (
  id uuid DEFAULT gen_random_uuid(),
  gov text,
  status text,
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sam_entities (
  id uuid DEFAULT gen_random_uuid(),
  gov text,
  status text,
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sam_opportunities (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sap_records (
  id uuid DEFAULT gen_random_uuid(),
  student_record_id uuid,
  check_date timestamptz,
  status text,
  gpa numeric,
  attendance_percentage numeric,
  hours_completed numeric,
  hours_required numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scorm_attempts (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scorm_cmi_data (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  attempt_id text,
  cmi_key text,
  cmi_value text
);

CREATE TABLE IF NOT EXISTS public.scorm_completion_summary (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  student_name text,
  student_email text,
  scorm_title text,
  status text,
  progress_percentage numeric,
  score numeric,
  attempts bigint,
  time_spent_minutes bigint,
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.scorm_progress (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  scorm_id uuid,
  status text,
  progress_percentage numeric,
  score numeric,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scorm_registrations (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  scorm_package_id uuid,
  registration_id text,
  status text,
  score numeric,
  completion_status text,
  success_status text,
  total_time_seconds bigint,
  last_accessed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scorm_sessions (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  host_id uuid,
  scheduled_at timestamptz,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  enrollment_id uuid,
  package_id uuid,
  user_id uuid
);

CREATE TABLE IF NOT EXISTS public.scorm_state (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  cmi_data jsonb,
  suspend_data text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scraper_detection_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scraping_attempts (
  id bigint,
  detection_type text,
  url text,
  ip_address text,
  user_agent text,
  additional_data jsonb,
  detected_at text,
  logged_at text,
  blocked boolean,
  ip_banned boolean,
  alert_sent boolean,
  notes text,
  created_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.script_acknowledgments (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.script_deviations (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.search_analytics (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  query text,
  search_count bigint
);

CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ip_address text,
  message text,
  metadata jsonb,
  severity text,
  type text,
  user_agent text
);

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text,
  severity text,
  description text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.security_scan_events (
  id uuid DEFAULT gen_random_uuid(),
  type text,
  tool text,
  status text,
  findings jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seller_applications (
  id uuid DEFAULT gen_random_uuid(),
  com text,
  description text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_tickets (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  issue text,
  priority text,
  status text,
  assigned_to uuid,
  resolution text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.settings (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  elevateforhumanity text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  value text
);

CREATE TABLE IF NOT EXISTS public.sfc_tax_return_public_status (
  tracking_id text,
  status text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  client_first_name text,
  client_last_initial text
);

CREATE TABLE IF NOT EXISTS public.sfc_tax_returns_public_lookup (
  id uuid DEFAULT gen_random_uuid(),
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
  last_error_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean,
  deleted_at timestamptz,
  submission_environment text,
  public_tracking_code text
);

CREATE TABLE IF NOT EXISTS public.shared_documents (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  file_url text,
  uploaded_by uuid,
  group_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  owner_id uuid,
  content text,
  collaborators text
);

CREATE TABLE IF NOT EXISTS public.shift_schedules (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  shift_date date,
  start_time text,
  end_time text,
  break_minutes bigint,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_applications (
  id uuid DEFAULT gen_random_uuid(),
  shop_name text,
  owner_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  ein text,
  years_in_business bigint,
  licensed_barbers bigint,
  agree_supervision boolean,
  agree_reporting boolean,
  agree_wages boolean,
  status text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_categories (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  slug text,
  description text,
  sort_order bigint,
  is_active boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_checkin_codes (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  code text,
  expires_at timestamptz,
  shop_id uuid
);

CREATE TABLE IF NOT EXISTS public.shop_document_requirements (
  id uuid DEFAULT gen_random_uuid(),
  program_slug text,
  state text,
  document_type text,
  required boolean,
  display_name text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_documents (
  id uuid DEFAULT gen_random_uuid(),
  shop_id uuid,
  document_type text,
  file_url text,
  uploaded_by uuid,
  approved boolean,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  file_name text,
  status text,
  uploaded_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.shop_onboarding (
  shop_id uuid,
  handbook_ack boolean,
  reporting_trained boolean,
  apprentice_supervisor_assigned boolean,
  rapids_reporting_ready boolean,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_orders (
  id uuid DEFAULT gen_random_uuid(),
  shop_id uuid,
  customer_id uuid,
  order_number text,
  total_amount numeric,
  status text,
  ordered_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_placements (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  shop_name text,
  shop_address text,
  supervisor_name text,
  supervisor_email text,
  supervisor_phone text,
  status text,
  assigned_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_products (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  slug text,
  description text,
  price numeric,
  category text,
  stock_quantity bigint,
  rating numeric,
  review_count bigint,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  image_url text,
  is_featured boolean,
  stripe_product_id text,
  stripe_price_id text
);

CREATE TABLE IF NOT EXISTS public.shop_profiles (
  id uuid DEFAULT gen_random_uuid(),
  average_rating text,
  category text,
  compare_at_price text,
  creator_profiles text,
  description text,
  elevateforhumanity text,
  images text,
  is_free text,
  price numeric,
  shop_profiles text,
  thumbnail_url text,
  total_enrollments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_reports (
  id uuid DEFAULT gen_random_uuid(),
  shop_id uuid,
  submitted_by uuid,
  report_type text,
  report_period_start date,
  report_period_end date,
  data jsonb,
  attachments jsonb,
  status text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_required_docs_status (
  shop_id uuid,
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

CREATE TABLE IF NOT EXISTS public.shop_signatures (
  id uuid DEFAULT gen_random_uuid(),
  shop_id uuid,
  document_type text,
  signed_by_name text,
  signed_by_title text,
  signed_at date,
  file_url text,
  created_at timestamptz DEFAULT now(),
  ip_acknowledged boolean
);

CREATE TABLE IF NOT EXISTS public.shop_supervisors (
  id uuid DEFAULT gen_random_uuid(),
  shop_id uuid,
  user_id uuid,
  name text,
  email text,
  phone text,
  license_number text,
  license_type text,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_weekly_reports (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  data jsonb,
  period text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hours_total text,
  submitted_at timestamptz,
  week_end text,
  week_start text
);

CREATE TABLE IF NOT EXISTS public.signature_documents (
  id uuid DEFAULT gen_random_uuid(),
  type text,
  title text,
  body text,
  created_for_org uuid,
  created_by uuid,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.signatures (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  document_type text,
  document_id uuid,
  signature_data text,
  signed_at timestamptz,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sites (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  location text
);

CREATE TABLE IF NOT EXISTS public.skill_categories (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  progress text,
  skills text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text,
  description text,
  order bigint
);

CREATE TABLE IF NOT EXISTS public.skills_checklist (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.slow_resources (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  file_url text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sms_reminders (
  id uuid DEFAULT gen_random_uuid(),
  application_id uuid,
  reminder_type text,
  sent_at timestamptz,
  status text
);

CREATE TABLE IF NOT EXISTS public.snap_outreach_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.soc_controls (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id uuid DEFAULT gen_random_uuid(),
  platform text,
  account_name text,
  account_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_media_campaigns (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_media_queue (
  id uuid DEFAULT gen_random_uuid(),
  post_id uuid,
  scheduled_for timestamptz,
  priority bigint,
  status text,
  attempts bigint,
  last_error text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid DEFAULT gen_random_uuid(),
  author_id uuid,
  title text,
  content text,
  like_count bigint,
  comment_count bigint,
  share_count bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ssn_verifications (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sso_connections (
  id uuid DEFAULT gen_random_uuid(),
  provider_id uuid,
  user_id uuid,
  external_user_id text,
  email text,
  metadata jsonb,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sso_login_attempts (
  id uuid DEFAULT gen_random_uuid(),
  provider_id uuid,
  email text,
  success boolean,
  error_message text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sso_providers (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  provider_type text,
  provider_name text,
  client_id text,
  client_secret text,
  issuer_url text,
  authorization_url text,
  token_url text,
  userinfo_url text,
  jwks_uri text,
  scopes text,
  attribute_mapping jsonb,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sso_sessions (
  id uuid DEFAULT gen_random_uuid(),
  connection_id uuid,
  session_token text,
  access_token text,
  refresh_token text,
  id_token text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid DEFAULT gen_random_uuid(),
  address text,
  avatar_url text,
  city text,
  description text,
  duration bigint,
  elevateforhumanity text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  department text,
  email text,
  first_name text,
  last_name text,
  name text,
  title text
);

CREATE TABLE IF NOT EXISTS public.staff_applications (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  full_name text,
  email text,
  phone text,
  position text,
  status text,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_notifications (
  id uuid DEFAULT gen_random_uuid(),
  type text,
  title text,
  message text,
  severity text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_processes (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  category text,
  steps jsonb,
  attachments jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_training_modules (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  content text,
  video_url text,
  duration_minutes bigint,
  category text,
  required_for_roles text,
  is_active boolean,
  order_index bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_training_progress (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  module_id uuid,
  status text,
  started_at timestamptz,
  completed_at timestamptz,
  score bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.state_board_readiness (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  enrollment_id uuid,
  total_hours_completed numeric,
  rti_hours_completed numeric,
  ojt_hours_completed numeric,
  milady_completed boolean,
  practical_skills_verified boolean,
  ready_for_exam boolean,
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

CREATE TABLE IF NOT EXISTS public.state_compliance (
  id uuid DEFAULT gen_random_uuid(),
  state_code text,
  state_name text,
  required_hours bigint,
  classroom_hours bigint,
  on_the_job_hours bigint,
  exam_required boolean,
  active boolean,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.state_rules (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.statistics (
  id uuid DEFAULT gen_random_uuid(),
  blue text,
  description text,
  duration bigint,
  elevateforhumanity text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_branding (
  id uuid DEFAULT gen_random_uuid(),
  store_id uuid,
  logo_url text,
  primary_color text,
  secondary_color text,
  font_family text,
  custom_css text,
  custom_domain text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_entitlements (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  entitlement_key text
);

CREATE TABLE IF NOT EXISTS public.store_instances (
  id uuid DEFAULT gen_random_uuid(),
  store_name text,
  store_url text,
  owner_id uuid,
  parent_store_id uuid,
  license_id uuid,
  is_active boolean,
  settings jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_products (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  course_id uuid,
  grants_course_access text
);

CREATE TABLE IF NOT EXISTS public.store_subscriptions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_activity_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_ai_assignments (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_ai_instructors (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_applications (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  full_name text,
  email text,
  phone text,
  status text,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  intake jsonb,
  state text,
  state_updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.student_badges (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  badge_id uuid,
  earned_date timestamptz,
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS public.student_credentials (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  credential_id uuid,
  issued_date timestamptz,
  credential_number text,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  program_id uuid,
  stripe_checkout_session_id text,
  status text,
  transfer_hours numeric,
  rapids_status text,
  rapids_id text,
  milady_enrolled boolean,
  milady_enrolled_at timestamptz,
  shop_id uuid,
  supervisor_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hours_needed bigint,
  total_program_fee numeric,
  down_payment numeric,
  amount_paid numeric,
  balance_remaining numeric,
  payment_plan_months bigint,
  monthly_payment_amount numeric,
  payment_status text,
  stripe_subscription_id text,
  next_payment_date date,
  vendor_paid boolean,
  vendor_paid_at timestamptz,
  vendor_payment_amount numeric,
  certificate_issued_at timestamptz,
  program_slug text,
  funding_source text,
  case_id uuid,
  region_id text,
  payment_option text,
  required_hours numeric,
  has_host_shop boolean,
  host_shop_name text,
  enrollment_state text,
  progress text,
  cohort_id uuid
);

CREATE TABLE IF NOT EXISTS public.student_funding_assignments (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_next_steps (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  organization_id uuid,
  program_id uuid,
  inquiry_submitted boolean,
  inquiry_submitted_at timestamptz,
  icc_account_created boolean,
  icc_username text,
  workone_appointment_scheduled boolean,
  workone_appointment_date date,
  workone_appointment_time text,
  workone_location text,
  told_advisor_efh boolean,
  advisor_docs_uploaded boolean,
  advisor_docs_note text,
  funding_status text,
  funding_type text,
  efh_onboarding_call_completed boolean,
  efh_onboarding_call_date date,
  program_start_confirmed boolean,
  program_start_date date,
  staff_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_onboarding (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  handbook_reviewed boolean,
  milady_orientation_completed boolean,
  ai_instructor_met boolean,
  shop_placed boolean,
  handbook_reviewed_at timestamptz,
  milady_orientation_completed_at timestamptz,
  ai_instructor_met_at timestamptz,
  shop_placed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_payments (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric,
  status text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_points (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  points bigint,
  level bigint,
  streak_days bigint,
  last_activity_date date,
  total_study_minutes bigint,
  total_lessons_completed bigint,
  total_quizzes_passed bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_progress (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  course_id uuid,
  module_id uuid,
  lesson_id uuid,
  progress_percentage bigint,
  completed boolean,
  last_accessed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_records (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  program_name text,
  gpa numeric,
  attendance_percentage numeric,
  hours_completed numeric,
  hours_required numeric,
  sap_status text,
  sap_last_checked timestamptz,
  enrollment_status text,
  start_date date,
  expected_completion_date date,
  actual_completion_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_requirements (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_risk_status (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  code text,
  days_since_activity text,
  dropped text,
  email text,
  enrollments text,
  first_name text,
  last_activity_date date,
  last_name text,
  overdue_count bigint,
  phone text,
  profiles jsonb,
  program_id uuid,
  programs text,
  progress_percentage numeric,
  status text,
  student_funding_assignments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_subscriptions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  weeks_paid text
);

CREATE TABLE IF NOT EXISTS public.studio_chat_history (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  repo_id uuid,
  session_id uuid,
  messages jsonb,
  file_context text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_comments (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  repo_id uuid,
  file_path text,
  branch text,
  line_start bigint,
  line_end bigint,
  content text,
  resolved boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_commit_cache (
  id uuid DEFAULT gen_random_uuid(),
  repo_id uuid,
  branch text,
  commits jsonb,
  fetched_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.studio_deploy_tokens (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  provider text,
  encrypted_token text,
  project_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_deployments (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_favorites (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  repo_id uuid,
  file_path text,
  line_number bigint,
  label text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_pr_tracking (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_recent_files (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  repo_id uuid,
  file_path text,
  branch text,
  accessed_at timestamptz,
  access_count bigint
);

CREATE TABLE IF NOT EXISTS public.studio_repos (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  repo_full_name text,
  default_branch text,
  last_accessed_at timestamptz,
  is_favorite boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_sessions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  repo_id uuid,
  branch text,
  open_files jsonb,
  active_file text,
  cursor_positions jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_settings (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  theme text,
  font_size bigint,
  word_wrap boolean,
  minimap boolean,
  auto_save boolean,
  keyboard_shortcuts jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_shares (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  repo_id uuid,
  file_path text,
  branch text,
  line_start bigint,
  line_end bigint,
  share_code text,
  expires_at timestamptz,
  view_count bigint,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_workflow_tracking (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  progress_percentage numeric,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  host_id uuid,
  scheduled_at timestamptz,
  duration_minutes bigint,
  meeting_url text,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sub_office_agreements (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  plan_id text,
  status text,
  current_period_start date,
  current_period_end date,
  cancel_at_period_end boolean,
  cancelled_at timestamptz,
  trial_start date,
  trial_end date,
  created_at timestamptz DEFAULT now(),
  user_id uuid
);

CREATE TABLE IF NOT EXISTS public.supersonic_applications (
  id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text,
  last_name text,
  email text,
  phone text,
  date_of_birth date,
  ssn_last_4 text,
  street_address text,
  city text,
  state text,
  zip_code text,
  filing_status text,
  dependents bigint,
  estimated_refund numeric,
  advance_amount numeric,
  status text,
  jotform_submission_id text,
  source text,
  notes text
);

CREATE TABLE IF NOT EXISTS public.supersonic_appointments (
  id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text,
  last_name text,
  email text,
  phone text,
  appointment_date date,
  appointment_time text,
  appointment_type text,
  location text,
  status text,
  confirmation_sent boolean,
  reminder_sent boolean,
  notes text,
  internal_notes text
);

CREATE TABLE IF NOT EXISTS public.supersonic_careers (
  id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text,
  last_name text,
  email text,
  phone text,
  position text,
  location_preference text,
  years_experience bigint,
  certifications text,
  resume_url text,
  competency_test_score bigint,
  competency_test_passed boolean,
  status text,
  interview_scheduled timestamptz,
  notes text,
  internal_notes text
);

CREATE TABLE IF NOT EXISTS public.supersonic_tax_documents (
  id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  application_id uuid,
  client_email text,
  document_type text,
  file_name text,
  file_path text,
  file_size bigint,
  mime_type text,
  status text,
  ocr_extracted boolean,
  ocr_data jsonb,
  uploaded_by text,
  notes text
);

CREATE TABLE IF NOT EXISTS public.supersonic_training_keys (
  id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  access_key text,
  email text,
  first_name text,
  last_name text,
  key_type text,
  expires_at timestamptz,
  max_uses bigint,
  uses_count bigint,
  is_active boolean,
  revoked_at timestamptz,
  revoked_by text,
  issued_by text,
  notes text
);

CREATE TABLE IF NOT EXISTS public.support_articles (
  id uuid DEFAULT gen_random_uuid(),
  category text,
  content text,
  elevateforhumanity text,
  excerpt text,
  ilike text,
  slug text,
  tags text,
  views text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text
);

CREATE TABLE IF NOT EXISTS public.support_groups (
  id uuid DEFAULT gen_random_uuid(),
  content text,
  description text,
  elevateforhumanity text,
  schedule text,
  years_sober text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  content text,
  is_read boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_sessions (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  features text,
  jpg text,
  start_date timestamptz,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  subject text,
  description text,
  status text,
  priority text,
  assigned_to uuid,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supportive_services (
  id uuid DEFAULT gen_random_uuid(),
  participant_id uuid,
  service_type text,
  service_description text,
  amount_requested numeric,
  amount_approved numeric,
  amount_paid numeric,
  request_status text,
  requested_by uuid,
  requested_date date,
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

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.surveys (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_configuration (
  id uuid DEFAULT gen_random_uuid(),
  key text,
  value text,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_errors (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  context jsonb,
  error_message text,
  error_stack text,
  error_type text,
  request_id text,
  user_id uuid
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid(),
  program_id uuid,
  title text,
  instructions text,
  due_days bigint
);

CREATE TABLE IF NOT EXISTS public.tax_applications (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  tax_year bigint,
  application_type text,
  status text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_calculations (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  tax_year bigint,
  filing_status text,
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

CREATE TABLE IF NOT EXISTS public.tax_document_uploads (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  filename text,
  file_path text,
  file_size bigint,
  content_type text,
  status text,
  reviewed_by text,
  reviewed_at timestamptz,
  notes text,
  uploaded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_documents (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  tax_year bigint,
  document_type text,
  file_name text,
  file_size bigint,
  file_url text,
  mime_type text,
  status text,
  uploaded_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_filing_applications (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  email text,
  fee_amount text,
  first_name text,
  jpg text,
  last_name text,
  preparer_id uuid,
  status text,
  tax_year text,
  tsx text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_filings (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  tax_year bigint,
  filing_type text,
  status text,
  preparer_id uuid,
  vita_site text,
  filing_date date,
  refund_amount numeric,
  documents jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_information (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_intake (
  id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  service_type text,
  diy_service text,
  first_name text,
  last_name text,
  email text,
  phone text,
  notes text,
  paid boolean,
  stripe_session_id text,
  ip_address text,
  user_agent text
);

CREATE TABLE IF NOT EXISTS public.tax_interview_questions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_return_drafts (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_services (
  id uuid DEFAULT gen_random_uuid(),
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
  price numeric,
  question text,
  solution text,
  tsx text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_tools (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  gov text,
  irs text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tax_withholdings (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  filing_status text,
  allowances bigint,
  additional_withholding numeric,
  exempt boolean,
  state_filing_status text,
  state_allowances bigint,
  effective_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_billing (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_branding (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  background_color text,
  text_color text,
  font_family text,
  heading_font text,
  custom_css text,
  email_header_url text,
  email_footer_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_invitations (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  email text,
  tenant_role text,
  invitation_token text,
  status text,
  expires_at timestamptz,
  invited_by uuid,
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_licenses (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  plan_name text,
  status text,
  seats_limit bigint,
  seats_used bigint,
  features jsonb,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  tenant_role text,
  permissions jsonb,
  status text,
  invited_by uuid,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  role text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  timezone text,
  date_format text,
  time_format text,
  language text,
  currency text,
  features jsonb,
  allow_self_enrollment boolean,
  require_approval boolean,
  auto_enroll_new_users boolean,
  certificate_template_id uuid,
  auto_issue_certificates boolean,
  email_notifications_enabled boolean,
  sms_notifications_enabled boolean,
  push_notifications_enabled boolean,
  require_2fa boolean,
  password_min_length bigint,
  password_require_uppercase boolean,
  password_require_numbers boolean,
  password_require_symbols boolean,
  session_timeout_minutes bigint,
  integrations jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_stripe_customers (
  tenant_id uuid,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  plan_name text,
  plan_price numeric,
  billing_cycle text,
  max_users bigint,
  max_courses bigint,
  storage_limit_gb bigint,
  api_rate_limit bigint,
  features jsonb,
  status text,
  stripe_subscription_id text,
  stripe_customer_id text,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_usage (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  active_users bigint,
  total_courses bigint,
  total_enrollments bigint,
  storage_used_gb numeric,
  api_requests_count bigint,
  period_start date,
  period_end date,
  calculated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_usage_daily (
  id uuid DEFAULT gen_random_uuid(),
  tenant_id uuid,
  usage_date date,
  active_users bigint,
  api_requests bigint,
  storage_used_gb numeric,
  bandwidth_used_gb numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.terminal_command_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.time_entries (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  entry_date date,
  clock_in timestamptz,
  clock_out timestamptz,
  break_minutes bigint,
  total_hours numeric,
  status text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  minutes bigint
);

CREATE TABLE IF NOT EXISTS public.timeclock_cron_runs (
  id bigint,
  ran_at timestamptz,
  updated_count bigint
);

CREATE TABLE IF NOT EXISTS public.timeclock_ui_state (
  progress_entry_id uuid,
  apprentice_id uuid,
  partner_id uuid,
  program_id text,
  site_id uuid,
  work_date date,
  week_ending date,
  max_hours_per_week numeric,
  status text,
  clock_in_at timestamptz,
  lunch_start_at timestamptz,
  lunch_end_at timestamptz,
  clock_out_at timestamptz,
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

CREATE TABLE IF NOT EXISTS public.timesheets (
  id uuid DEFAULT gen_random_uuid(),
  employee_id uuid,
  week_start date,
  week_end date,
  total_hours numeric,
  status text,
  submitted_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_access_keys (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_modules (
  id uuid DEFAULT gen_random_uuid(),
  certification_date date,
  completed_at timestamptz,
  description text,
  duration bigint,
  elevateforhumanity text,
  module_id uuid,
  progress text,
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_progress (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  lesson_id uuid,
  completed boolean,
  completed_at timestamptz,
  quiz_score bigint,
  time_spent_minutes bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_purchases (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_videos (
  id uuid DEFAULT gen_random_uuid(),
  description text,
  duration bigint,
  elevateforhumanity text,
  reply_count bigint,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transcript_search_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transfer_hour_requests (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  enrollment_id uuid,
  hours_requested numeric,
  hours_approved numeric,
  previous_school_name text,
  previous_school_address text,
  previous_school_phone text,
  previous_school_license text,
  completion_date date,
  documentation_url text,
  notes text,
  status text,
  reviewer_id uuid,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trial_signups (
  id uuid DEFAULT gen_random_uuid(),
  email text,
  organization_name text,
  organization_type text,
  contact_name text,
  contact_phone text,
  plan_id text,
  status text,
  converted_at timestamptz,
  organization_id uuid,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.tts_usage_log (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tuition_options (
  id uuid DEFAULT gen_random_uuid(),
  elevateforhumanity text,
  jpg text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tuition_payments (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric,
  status text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tuition_subscriptions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  installments_paid bigint,
  total_installments bigint
);

CREATE TABLE IF NOT EXISTS public.two_factor_attempts (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  code text,
  success boolean,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  method text,
  secret text,
  backup_codes text,
  is_enabled boolean,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  enabled boolean
);

CREATE TABLE IF NOT EXISTS public.unauthorized_access_log (
  id bigint,
  domain text,
  url text,
  referrer text,
  ip_address text,
  user_agent text,
  country text,
  city text,
  detected_at text,
  logged_at text,
  screenshot_url text,
  html_snapshot text,
  status text,
  cease_desist_sent boolean,
  cease_desist_date date,
  dmca_filed boolean,
  dmca_filed_date date,
  legal_action_taken boolean,
  legal_action_date date,
  notes text,
  assigned_to bigint,
  resolved boolean,
  resolved_at text,
  resolution_notes text,
  created_at text DEFAULT now(),
  updated_at text DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.updates (
  id uuid DEFAULT gen_random_uuid(),
  category text,
  date timestamptz,
  description text,
  elevateforhumanity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.uploaded_documents (
  id uuid DEFAULT gen_random_uuid(),
  application_id uuid,
  file_type text,
  file_url text,
  uploaded_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_access (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  current_period_end text,
  tier text
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  achievement_id uuid,
  earned_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_activity_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text,
  event_data jsonb,
  page_url text,
  referrer_url text,
  session_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  badge_id uuid,
  earned_at timestamptz,
  progress_data jsonb,
  awarded_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.user_capabilities (
  user_id uuid,
  role text,
  is_program_holder boolean
);

CREATE TABLE IF NOT EXISTS public.user_compliance_status (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_connections (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  connected_user_id uuid,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  document_type text,
  signed_at timestamptz,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_entitlements (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  product_id uuid,
  entitlement_type text,
  granted_at timestamptz,
  stripe_payment_id text
);

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  rating bigint,
  comment text,
  target_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_files (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  file_name text,
  file_url text,
  file_size bigint,
  mime_type text,
  folder text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_lesson_attempts (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  lesson_id uuid,
  course_id uuid,
  score bigint,
  passed boolean,
  attempt_number bigint,
  answers jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_licenses (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  expires_at timestamptz,
  license_key text,
  license_type text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  flow_id text,
  current_step bigint,
  completed_steps text,
  completed boolean,
  skipped boolean,
  started_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  permission_id uuid,
  tenant_id uuid,
  granted_by uuid,
  granted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_points (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  total_points bigint,
  level bigint,
  level_name text,
  points_to_next_level bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  key text,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  enrollment_id uuid,
  program_id uuid,
  total_lessons bigint,
  completed_lessons bigint,
  total_quizzes bigint,
  completed_quizzes bigint,
  total_resources bigint,
  downloaded_resources bigint,
  progress_percentage numeric,
  estimated_completion_date date,
  last_activity_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_resumes (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  personal_info jsonb,
  summary text,
  work_experience jsonb,
  education jsonb,
  skills jsonb,
  certifications jsonb,
  template_name text,
  is_public boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_saved_grants (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  session_token text,
  ip_address text,
  user_agent text,
  last_activity_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_streaks (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  current_streak bigint,
  longest_streak bigint,
  last_activity_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  total_active_days bigint
);

CREATE TABLE IF NOT EXISTS public.user_tutorials (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  tutorial_id text,
  current_step bigint,
  completed_steps text,
  completed boolean,
  started_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.user_websites (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid(),
  email text,
  created_at text DEFAULT now(),
  app_role text,
  organization_id uuid,
  updated_at timestamptz DEFAULT now(),
  avatar_url text,
  full_name text,
  phone text,
  role text
);

CREATE TABLE IF NOT EXISTS public.v_active_programs (
  id uuid DEFAULT gen_random_uuid(),
  slug text,
  title text,
  category text,
  description text,
  estimated_weeks bigint,
  estimated_hours bigint,
  funding_tags text,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  full_description text,
  what_you_learn text,
  day_in_life text,
  salary_min bigint,
  salary_max bigint,
  credential_type text,
  credential_name text,
  employers text,
  funding_pathways text,
  delivery_method text,
  training_hours bigint,
  prerequisites text,
  career_outcomes text,
  industry_demand text,
  image_url text,
  hero_image_url text,
  icon_url text,
  featured boolean,
  wioa_approved boolean,
  dol_registered boolean,
  placement_rate bigint,
  completion_rate bigint,
  total_cost numeric,
  toolkit_cost numeric,
  credentialing_cost numeric,
  name text,
  duration_weeks bigint,
  updated_at timestamptz DEFAULT now(),
  cip_code text,
  soc_code text,
  funding_eligibility text,
  state_code text,
  organization_id uuid
);

CREATE TABLE IF NOT EXISTS public.v_app_slow_queries (
  queryid bigint,
  query_preview text,
  calls bigint,
  total_sec numeric,
  avg_ms numeric,
  max_ms numeric,
  total_rows bigint,
  cache_hit_pct numeric,
  rolname text
);

CREATE TABLE IF NOT EXISTS public.v_applications (
  id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  status text,
  first_name text,
  last_name text,
  phone text,
  email text,
  city text,
  zip text,
  contact_preference text,
  has_case_manager boolean,
  case_manager_agency text,
  support_notes text,
  program_id uuid,
  program_title text,
  program_slug text,
  program_category text
);

CREATE TABLE IF NOT EXISTS public.v_enrolled_not_paid (
  enrollment_id uuid,
  user_id uuid,
  student_id uuid,
  program_slug text,
  enrollment_state text,
  funding_source text,
  payment_status text,
  created_at timestamptz DEFAULT now(),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  verification_status text
);

CREATE TABLE IF NOT EXISTS public.v_funding_verification_queue (
  enrollment_id uuid,
  user_id uuid,
  email text,
  full_name text,
  phone text,
  program_slug text,
  enrollment_state text,
  funding_source text,
  enrolled_at timestamptz,
  due_at timestamptz,
  notes text,
  days_since_enrollment bigint,
  days_until_due bigint,
  sla_status text,
  has_open_escalation boolean,
  flag_type text,
  flagged_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.v_paid_not_enrolled (
  session_id text,
  email text,
  amount bigint,
  program_slug text,
  application_id text,
  user_id text,
  student_id text,
  kind text,
  paid_at timestamptz,
  app_id_resolved uuid,
  app_status text
);

CREATE TABLE IF NOT EXISTS public.v_payment_integrity_dashboard (
  flag_id uuid,
  flag_type text,
  flag_reason text,
  flagged_at timestamptz,
  resolved_at timestamptz,
  resolution text,
  user_id uuid,
  program_slug text,
  enrollment_state text,
  funding_source text,
  amount_paid_cents bigint,
  enrolled_at timestamptz,
  email text
);

CREATE TABLE IF NOT EXISTS public.v_published_programs (
  id uuid DEFAULT gen_random_uuid(),
  slug text,
  title text,
  category text,
  description text,
  estimated_weeks bigint,
  estimated_hours bigint,
  funding_tags text,
  is_active boolean,
  created_at timestamptz DEFAULT now(),
  full_description text,
  what_you_learn text,
  day_in_life text,
  salary_min bigint,
  salary_max bigint,
  credential_type text,
  credential_name text,
  employers text,
  funding_pathways text,
  delivery_method text,
  training_hours bigint,
  prerequisites text,
  career_outcomes text,
  industry_demand text,
  image_url text,
  hero_image_url text,
  icon_url text,
  featured boolean,
  wioa_approved boolean,
  dol_registered boolean,
  placement_rate bigint,
  completion_rate bigint,
  total_cost numeric,
  toolkit_cost numeric,
  credentialing_cost numeric,
  name text,
  duration_weeks bigint,
  updated_at timestamptz DEFAULT now(),
  cip_code text,
  soc_code text,
  funding_eligibility text,
  state_code text,
  organization_id uuid,
  category_norm text
);

CREATE TABLE IF NOT EXISTS public.vendor_payments (
  id uuid DEFAULT gen_random_uuid(),
  enrollment_id uuid,
  vendor_name text,
  amount numeric,
  status text,
  payment_method text,
  invoice_id text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  elevate_payment_id text,
  error_message text,
  program_slug text,
  student_id uuid
);

CREATE TABLE IF NOT EXISTS public.verification_actions (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_bookmarks (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  lesson_id uuid,
  label text,
  position_seconds bigint,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_captions (
  id uuid DEFAULT gen_random_uuid(),
  lesson_id uuid,
  language text,
  caption_url text,
  is_auto_generated boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_chapters (
  id uuid DEFAULT gen_random_uuid(),
  video_id uuid,
  title text,
  start_time bigint,
  end_time bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_notes (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_playback_events (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  event_type text,
  video_id text,
  page_slug text,
  current_time numeric,
  duration numeric,
  error_message text,
  session_id text
);

CREATE TABLE IF NOT EXISTS public.video_transcripts (
  id uuid DEFAULT gen_random_uuid(),
  lesson_id uuid,
  language text,
  transcript_text text,
  vtt_url text,
  srt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_views (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.videos (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  url text,
  thumbnail_url text,
  duration_seconds bigint,
  published boolean,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  video_url text
);

CREATE TABLE IF NOT EXISTS public.vita_appointments (
  id uuid DEFAULT gen_random_uuid(),
  student_id uuid,
  appointment_date timestamptz,
  site_location text,
  preparer_id uuid,
  status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.voicemails (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  phone_number text,
  recording_url text,
  duration_seconds bigint,
  transcription text,
  is_read boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.volunteer_opportunities (
  id uuid DEFAULT gen_random_uuid(),
  title text,
  description text,
  organization text,
  location text,
  commitment text,
  is_active boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.volunteers (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  name text,
  email text,
  organization text,
  role text,
  is_active boolean,
  hours_logged numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid DEFAULT gen_random_uuid(),
  webhook_id uuid,
  event text,
  payload jsonb,
  response_status bigint,
  response_body text,
  error text,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid DEFAULT gen_random_uuid(),
  webhook_id uuid,
  event text,
  payload jsonb,
  status text,
  status_code bigint,
  response_time_ms bigint,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid DEFAULT gen_random_uuid(),
  url text,
  events text,
  secret text,
  enabled boolean,
  description text,
  headers jsonb,
  retry_count bigint,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.website_pages (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.welcome_packet_items (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.welcome_packets (
  id uuid DEFAULT gen_random_uuid(),
  student_record_id uuid,
  generated_at timestamptz,
  pdf_url text,
  status text,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wioa_applications (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  program_id uuid,
  eligibility_status text,
  case_worker text,
  notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wioa_documents (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  application_id uuid,
  document_type text,
  file_url text,
  file_name text,
  status text,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wioa_services (
  id uuid DEFAULT gen_random_uuid(),
  participant_id uuid,
  iep_id uuid,
  service_category text,
  service_type text,
  service_description text,
  service_provider text,
  service_provider_id uuid,
  service_start_date date,
  service_end_date date,
  service_hours numeric,
  service_status text,
  service_cost numeric,
  funding_source text,
  service_outcome text,
  participant_satisfaction_rating bigint,
  service_documentation_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid DEFAULT gen_random_uuid(),
  student_record_id uuid,
  withdrawal_type text,
  reason text,
  effective_date date,
  last_attendance_date date,
  refund_amount numeric,
  status text,
  requested_at timestamptz,
  processed_at timestamptz,
  processed_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflow_enrollments (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workforce_referrals (
  id uuid DEFAULT gen_random_uuid(),
  name text,
  description text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workshop_categories (
  id uuid DEFAULT gen_random_uuid(),
  capacity text,
  date timestamptz,
  description text,
  duration bigint,
  elevateforhumanity text,
  location text,
  price numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workshops (
  id uuid DEFAULT gen_random_uuid(),
  all text,
  capacity text,
  content text,
  date timestamptz,
  description text,
  duration bigint,
  elevateforhumanity text,
  jpg text,
  location text,
  png text,
  price numeric,
  webp text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wotc_tracking (
  id uuid DEFAULT gen_random_uuid(),
  employer_id uuid,
  apprentice_id uuid,
  hire_date date,
  submitted boolean,
  eligible boolean,
  created_at timestamptz DEFAULT now(),
  deadline date
);

CREATE TABLE IF NOT EXISTS public.xapi_statements (
  id uuid DEFAULT gen_random_uuid(),
  actor jsonb,
  verb jsonb,
  object jsonb,
  result jsonb,
  context jsonb,
  timestamp timestamptz,
  stored_at timestamptz,
  authority jsonb,
  version text
);

