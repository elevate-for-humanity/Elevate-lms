-- Schema Governance Baseline Migration
-- Generated from live Supabase schema (cuxzzpsyufcewtmicszk)
-- Purpose: Bring top-referenced dashboard-created tables under version control
-- These tables already exist in production — this migration uses IF NOT EXISTS
-- to be safely re-runnable and serves as the authoritative schema reference.

-- ============================================
-- PROFILES (60 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'student',
  enrollment_status TEXT NOT NULL DEFAULT 'pending',
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID,
  tenant_id UUID,
  is_active BOOLEAN DEFAULT true,
  zip_code TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  first_name TEXT,
  last_name TEXT,
  funding_confirmed BOOLEAN DEFAULT false,
  orientation_completed BOOLEAN DEFAULT false,
  schedule_selected BOOLEAN DEFAULT false,
  account_balance NUMERIC,
  agreement_signed_at TIMESTAMPTZ,
  bio TEXT,
  company TEXT,
  current_period_end TIMESTAMPTZ,
  funding_source TEXT,
  graduation_year TEXT,
  headline TEXT,
  interests JSONB,
  job_title TEXT,
  last_sign_in_at TIMESTAMPTZ,
  learning_style TEXT,
  location TEXT,
  notification_preferences JSONB,
  points INTEGER DEFAULT 0,
  program TEXT,
  program_holder_id UUID,
  roles JSONB,
  skill_level TEXT,
  status TEXT,
  stripe_customer_id UUID,
  subscription_plan TEXT,
  subscription_status TEXT,
  trial_ends_at TIMESTAMPTZ,
  verified BOOLEAN DEFAULT false,
  onboarding_started BOOLEAN DEFAULT false,
  onboarding_started_at TIMESTAMPTZ,
  selected_cohort TEXT,
  orientation_completed_at TIMESTAMPTZ,
  external_id TEXT,
  date_of_birth DATE,
  last_login_at TIMESTAMPTZ,
  last_login_provider TEXT,
  last_login_provider_account_id TEXT,
  student_number TEXT,
  ssn_last4 TEXT
);

-- ============================================
-- PROGRAMS (97 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  estimated_weeks INTEGER,
  estimated_hours INTEGER,
  funding_tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  full_description TEXT,
  what_you_learn TEXT[],
  day_in_life TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  credential_type TEXT,
  credential_name TEXT,
  employers TEXT[],
  funding_pathways TEXT[],
  delivery_method TEXT,
  training_hours INTEGER,
  prerequisites TEXT,
  career_outcomes TEXT[],
  industry_demand TEXT,
  image_url TEXT,
  hero_image_url TEXT,
  icon_url TEXT,
  featured BOOLEAN DEFAULT false,
  wioa_approved BOOLEAN DEFAULT true,
  dol_registered BOOLEAN DEFAULT false,
  placement_rate INTEGER,
  completion_rate INTEGER,
  total_cost NUMERIC,
  toolkit_cost NUMERIC,
  credentialing_cost NUMERIC,
  name TEXT,
  duration_weeks INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cip_code TEXT,
  soc_code TEXT,
  funding_eligibility TEXT[],
  state_code TEXT DEFAULT 'IN',
  organization_id UUID,
  category_norm TEXT,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  excerpt TEXT,
  tenant_id UUID,
  partner_name TEXT,
  partner_id UUID,
  published BOOLEAN DEFAULT true,
  lms_model TEXT DEFAULT 'external',
  requires_license BOOLEAN DEFAULT false,
  license_type TEXT,
  lms_config JSONB DEFAULT '{}',
  is_store_template BOOLEAN DEFAULT false,
  store_config JSONB DEFAULT '{}',
  store_id UUID,
  funding_eligible BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  canonical_program_id UUID,
  code TEXT,
  total_hours INTEGER,
  tuition NUMERIC,
  requirements JSONB,
  eligibility_rules JSONB,
  credential TEXT,
  required_hours INTEGER,
  hero_image TEXT,
  hero_image_alt TEXT,
  availability_status TEXT DEFAULT 'open',
  next_start_date DATE,
  enrollment_deadline DATE,
  seats_available INTEGER,
  total_seats INTEGER,
  funding_cycle TEXT,
  funding_confirmed BOOLEAN DEFAULT true,
  is_apprenticeship BOOLEAN DEFAULT false,
  requires_employer_match BOOLEAN DEFAULT false,
  accreditation_body TEXT,
  accreditation_expires TEXT,
  accreditation_status TEXT,
  blurb TEXT,
  cover_url TEXT,
  delivery_mode TEXT,
  duration TEXT,
  enrolled_count INTEGER DEFAULT 0,
  hours INTEGER DEFAULT 0,
  occupation_code TEXT,
  price NUMERIC,
  rapids_required TEXT,
  required_skills JSONB,
  schedule TEXT,
  start_date TIMESTAMPTZ,
  track TEXT,
  type TEXT
);

-- ============================================
-- TRAINING_COURSES (35 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.training_courses (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  course_name TEXT NOT NULL,
  course_code TEXT,
  description TEXT,
  duration_hours INTEGER,
  price NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  instructor_id UUID,
  program_id UUID,
  tenant_id UUID,
  category TEXT,
  cert_valid_days INTEGER DEFAULT 0,
  certification_body TEXT,
  certification_name TEXT,
  code TEXT,
  cover_url TEXT,
  delivery_mode TEXT,
  difficulty TEXT,
  enrolled_count INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,
  external_version TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB,
  partner_id UUID,
  partner_url TEXT,
  program_name TEXT,
  rating NUMERIC,
  slug TEXT,
  status TEXT,
  summary TEXT,
  title TEXT
);

-- ============================================
-- APPLICATIONS (53 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  zip TEXT NOT NULL DEFAULT '',
  program_interest TEXT NOT NULL DEFAULT 'General Inquiry',
  has_case_manager BOOLEAN NOT NULL DEFAULT false,
  case_manager_agency TEXT,
  support_notes TEXT,
  contact_preference TEXT NOT NULL DEFAULT 'phone',
  advisor_email TEXT,
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  employer_sponsor_id UUID,
  submit_token UUID DEFAULT gen_random_uuid(),
  program_id UUID,
  user_id UUID,
  pathway_slug TEXT,
  source TEXT DEFAULT 'direct',
  full_name TEXT,
  eligibility_data JSONB,
  reviewer_id UUID,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  intake_id UUID,
  program_slug TEXT,
  payment_received_at TIMESTAMPTZ,
  eligibility_status TEXT DEFAULT 'pending',
  eligibility_verified_at TIMESTAMPTZ,
  eligibility_verified_by UUID,
  advisor_assigned UUID,
  advisor_notes TEXT,
  next_step TEXT,
  next_step_due_date DATE,
  sezzle_session_uuid TEXT,
  sezzle_order_uuid TEXT,
  sezzle_reference_id TEXT,
  sezzle_card_token TEXT,
  payment_provider TEXT,
  payment_status TEXT,
  payment_amount_cents INTEGER,
  payment_completed_at TIMESTAMPTZ,
  payment_reference TEXT,
  internal_order_id TEXT,
  affirm_order_id TEXT,
  customer_email TEXT,
  reference_number TEXT,
  name TEXT,
  notes TEXT
);

-- ============================================
-- CERTIFICATES (31 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  course_id UUID NOT NULL,
  enrollment_id UUID NOT NULL,
  certificate_number TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  pdf_url TEXT,
  verification_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID,
  student_id UUID,
  verification_code TEXT,
  course_title TEXT,
  program_name TEXT,
  hours_completed NUMERIC,
  issued_date TEXT,
  certificate_url TEXT,
  course_name TEXT,
  program_id UUID,
  signed_by TEXT,
  status TEXT,
  student_email TEXT,
  student_name TEXT,
  title TEXT,
  completion_date DATE,
  issued_by TEXT,
  serial TEXT,
  template_id UUID,
  credential_stack JSONB
);

-- ============================================
-- TRAINING_LESSONS (23 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.training_lessons (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  lesson_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  topics TEXT[],
  quiz_questions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  course_id_uuid UUID,
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  content_type TEXT DEFAULT 'video',
  quiz_id UUID,
  passing_score INTEGER DEFAULT 70,
  description TEXT,
  tenant_id UUID,
  html TEXT,
  idx TEXT,
  order_number TEXT
);

-- ============================================
-- PROGRAM_HOLDERS (19 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.program_holders (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  organization_name VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  mou_signed BOOLEAN DEFAULT false,
  mou_signed_at TIMESTAMPTZ,
  payout_status TEXT NOT NULL DEFAULT 'not_started',
  is_using_internal_lms BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  mou_final_pdf_url TEXT,
  mou_status TEXT,
  name TEXT,
  payout_share NUMERIC,
  approved_by UUID,
  primary_program_id UUID
);

-- ============================================
-- NOTIFICATIONS (13 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  idempotency_key TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID,
  link TEXT
);

-- ============================================
-- PARTNER_LMS_ENROLLMENTS (18 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_lms_enrollments (
  id UUID NOT NULL,
  provider_id UUID NOT NULL,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  program_id UUID,
  status TEXT DEFAULT 'pending',
  progress_percentage NUMERIC DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  external_enrollment_id TEXT NOT NULL,
  external_account_id TEXT,
  external_certificate_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  funding_source TEXT DEFAULT 'self_pay',
  certificate_issued_at TIMESTAMPTZ,
  payment_status TEXT
);

-- ============================================
-- TRAINING_ENROLLMENTS (32 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.training_enrollments (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  tenant_id UUID NOT NULL,
  application_id UUID,
  program_id UUID,
  hours_completed NUMERIC DEFAULT 0,
  at_risk BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cohort_id UUID,
  docs_verified BOOLEAN DEFAULT false,
  docs_verified_at TIMESTAMPTZ,
  orientation_completed_at TIMESTAMPTZ,
  documents_submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  funding_source TEXT,
  payment_method TEXT,
  program_slug TEXT,
  payment_option TEXT,
  amount_paid NUMERIC DEFAULT 0,
  stripe_checkout_session_id TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,
  agreement_signed BOOLEAN DEFAULT false,
  agreement_signed_at TIMESTAMPTZ,
  course_id_uuid UUID
);

-- ============================================
-- DOCUMENTS (30 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  file_url TEXT DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  status TEXT NOT NULL DEFAULT 'pending',
  uploaded_by UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expiration_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enrollment_id UUID,
  application_id UUID,
  verification_status TEXT DEFAULT 'pending',
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  requirement_id UUID,
  owner_type TEXT,
  owner_id UUID,
  file_path TEXT,
  file_size_bytes INTEGER,
  verified BOOLEAN DEFAULT false,
  verification_notes TEXT,
  title TEXT,
  url TEXT
);

-- ============================================
-- SHOPS (21 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ein TEXT,
  address1 TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT NOT NULL DEFAULT 'IN',
  zip TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id UUID,
  latitude NUMERIC,
  longitude NUMERIC,
  geocoded_at TIMESTAMPTZ,
  geocode_source VARCHAR,
  geocode_failed_at TIMESTAMPTZ,
  geocode_error TEXT,
  owner_id UUID
);

-- ============================================
-- TENANTS (12 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  active BOOLEAN DEFAULT false,
  compliance_ferpa TEXT,
  compliance_hipaa TEXT,
  compliance_wioa TEXT,
  license_expires_at TIMESTAMPTZ,
  license_status TEXT
);

-- ============================================
-- ORGANIZATIONS (9 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'training_provider',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contact_email TEXT,
  onboarding_started_at TIMESTAMPTZ
);

-- ============================================
-- ENROLLMENTS (9 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID,
  user_id UUID,
  course_id UUID,
  status TEXT,
  progress INTEGER,
  enrolled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tenant_id UUID,
  program_id UUID
);

-- ============================================
-- STUDENTS (21 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  county TEXT,
  funding_type TEXT,
  case_manager_name TEXT,
  case_manager_email TEXT,
  case_manager_phone TEXT,
  eligibility_verified BOOLEAN DEFAULT false,
  eligibility_verified_at TIMESTAMPTZ,
  eligibility_verified_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  program_name TEXT
);

-- ============================================
-- USER_PROFILES (18 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL,
  user_id UUID,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT,
  employer_id UUID,
  first_name TEXT,
  full_name TEXT,
  last_name TEXT,
  program_holder_id UUID,
  role TEXT
);

-- ============================================
-- MESSAGES (11 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  sender_id UUID,
  recipient_id UUID,
  subject TEXT,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  conversation_id UUID,
  deleted_by TEXT,
  read_by TEXT
);

-- ============================================
-- APPOINTMENTS (20 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "all" TEXT,
  amount NUMERIC DEFAULT 0,
  appointment_date DATE,
  appointment_time TEXT,
  appointment_type TEXT,
  clicked_count INTEGER DEFAULT 0,
  email TEXT,
  expected_close_date DATE,
  file_name TEXT,
  file_size TEXT,
  location TEXT,
  opened_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  service_type TEXT,
  stage TEXT,
  status TEXT DEFAULT 'active',
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
