-- Schema Governance Baseline Migration (Batch 2)
-- Generated from live Supabase schema (cuxzzpsyufcewtmicszk)
-- Tables ranked 11-50 by code reference count

-- ============================================
-- FORUM_THREADS (14 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.forum_threads (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  category_id UUID,
  user_id UUID NOT NULL,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  forum_id UUID,
  locked BOOLEAN DEFAULT false,
  pinned BOOLEAN DEFAULT false,
  reply_count INTEGER DEFAULT 0
);

-- ============================================
-- PRODUCTS (35 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  type VARCHAR DEFAULT 'digital',
  category VARCHAR,
  image_url TEXT,
  stripe_price_id VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  audiences TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  badge TEXT,
  sort_order INTEGER DEFAULT 0,
  inventory_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT false,
  requires_shipping BOOLEAN DEFAULT false,
  stripe_product_id TEXT,
  billing_type TEXT DEFAULT 'one_time',
  recurring_interval TEXT,
  trial_days INTEGER DEFAULT 0,
  license_type TEXT,
  seat_limit INTEGER,
  requires_approval BOOLEAN DEFAULT false,
  compare_price NUMERIC,
  setup_fee NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  short_description TEXT,
  icon TEXT,
  demo_url TEXT,
  documentation_url TEXT,
  tenant_id UUID
);

-- ============================================
-- DONATIONS (22 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  payment_status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  is_recurring BOOLEAN DEFAULT false,
  receipt_sent BOOLEAN DEFAULT false,
  receipt_sent_at TIMESTAMPTZ,
  user_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  donor_phone TEXT,
  campaign_id UUID,
  stripe_checkout_session_id TEXT,
  recurring_frequency TEXT,
  anonymous BOOLEAN DEFAULT false,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false
);

-- ============================================
-- DISCUSSION_THREADS (10 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.discussion_threads (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODULES (9 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  order_index INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  tenant_id UUID
);

-- ============================================
-- CART_ITEMS (6 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  price NUMERIC
);

-- ============================================
-- ASSIGNMENTS (16 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  course_id UUID,
  lesson_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  max_points NUMERIC DEFAULT 100,
  due_date TIMESTAMPTZ,
  allow_late_submission BOOLEAN DEFAULT true,
  late_penalty_percent NUMERIC DEFAULT 0,
  submission_type TEXT,
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_file_types TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID
);

-- ============================================
-- USER_APP_SUBSCRIPTIONS (7 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_app_subscriptions (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  gov TEXT,
  status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OJT_HOURS_LOG (10 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ojt_hours_log (
  id UUID NOT NULL,
  apprenticeship_id UUID NOT NULL,
  student_id UUID NOT NULL,
  work_date DATE NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  total_hours NUMERIC,
  cuts_completed INTEGER DEFAULT 0,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOP_STAFF (9 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.shop_staff (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID,
  tenant_id UUID
);

-- ============================================
-- PARTNER_LMS_PROVIDERS (12 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_lms_providers (
  id UUID NOT NULL,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  website_url TEXT,
  support_email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  api_config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  payment_amount NUMERIC,
  requires_payment BOOLEAN DEFAULT false
);

-- ============================================
-- JOB_POSTINGS (28 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID NOT NULL,
  employer_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  salary_range TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  location TEXT,
  remote_allowed BOOLEAN DEFAULT false,
  job_type TEXT,
  experience_level TEXT,
  education_required TEXT,
  skills_required TEXT[],
  benefits TEXT,
  application_deadline DATE,
  status TEXT DEFAULT 'active',
  posted_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  employment_type TEXT,
  job_description TEXT,
  job_title TEXT,
  positions_available INTEGER DEFAULT 0,
  positions_filled INTEGER DEFAULT 0,
  required_certifications JSONB,
  required_programs JSONB
);

-- ============================================
-- PARTNER_LMS_COURSES (18 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_lms_courses (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  partner_id UUID,
  provider_id UUID,
  license_id UUID,
  course_name TEXT,
  course_code TEXT,
  course_description TEXT,
  description TEXT,
  duration_hours INTEGER,
  capacity INTEGER,
  retail_price_cents INTEGER,
  stripe_price_id TEXT,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  scorm_package_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FORUM_POSTS (11 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID NOT NULL,
  thread_id UUID,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  title TEXT,
  user_id UUID
);

-- ============================================
-- EMPLOYERS (14 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.employers (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  license_number TEXT,
  trade TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  owner_user_id UUID,
  company_name TEXT,
  company_size TEXT,
  ein TEXT,
  industry TEXT
);

-- ============================================
-- ATTENDANCE_RECORDS (9 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  student_record_id UUID NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE_CREATORS (15 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketplace_creators (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  display_name TEXT NOT NULL,
  bio TEXT,
  payout_method TEXT,
  payout_email TEXT,
  revenue_split NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID,
  approved_at TIMESTAMPTZ,
  approved_by UUID
);

-- ============================================
-- ASSIGNMENT_SUBMISSIONS (14 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  assignment_id UUID,
  user_id UUID,
  submission_text TEXT,
  submission_url TEXT,
  file_paths TEXT[],
  status TEXT DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  grade NUMERIC,
  feedback TEXT,
  graded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMAIL_CAMPAIGNS (12 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REFERRALS (10 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL DEFAULT gen_random_uuid(),
  referred_user_id UUID,
  referral_code VARCHAR,
  status VARCHAR DEFAULT 'pending',
  reward_amount NUMERIC,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,
  program TEXT
);

-- ============================================
-- LICENSE_PURCHASES (15 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.license_purchases (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  license_type TEXT NOT NULL,
  product_slug TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  tenant_id UUID,
  status TEXT DEFAULT 'pending',
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  license_id UUID
);

-- ============================================
-- EMAIL_LOGS (23 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  provider TEXT,
  status TEXT,
  campaign_id TEXT,
  error_message TEXT,
  recipient_email TEXT,
  recipient_id UUID,
  sent_at TIMESTAMPTZ,
  subject TEXT,
  workflow_id TEXT,
  error TEXT,
  message_id TEXT,
  metadata JSONB,
  org_id UUID,
  recipient TEXT,
  "to" TEXT,
  type TEXT
);

-- ============================================
-- TRAINING_HOURS (9 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.training_hours (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  course_id UUID,
  lesson_id UUID,
  hours NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEES (25 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  tenant_id UUID,
  employee_number VARCHAR,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR,
  date_of_birth DATE,
  hire_date DATE NOT NULL,
  termination_date DATE,
  employment_status VARCHAR DEFAULT 'active',
  job_title VARCHAR,
  department_id UUID,
  manager_id UUID,
  salary NUMERIC,
  pay_frequency VARCHAR,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  zip_code VARCHAR,
  emergency_contact_name VARCHAR,
  emergency_contact_phone VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOB_APPLICATIONS (9 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID NOT NULL,
  job_posting_id UUID,
  student_id UUID,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'submitted',
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROGRAM_HOLDER_DOCUMENTS (21 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.program_holder_documents (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  description TEXT,
  uploaded_by UUID NOT NULL,
  approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- ============================================
-- APPRENTICESHIP_HOURS (23 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.apprenticeship_hours (
  id UUID,
  student_id UUID,
  shop_id UUID,
  partner_id UUID,
  date_worked DATE,
  date DATE,
  week_ending DATE,
  hours NUMERIC,
  hours_worked NUMERIC,
  program_slug VARCHAR,
  program_id VARCHAR,
  category TEXT,
  description TEXT,
  notes TEXT,
  approved BOOLEAN,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  status VARCHAR,
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- ============================================
-- INTAKE_RECORDS (11 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.intake_records (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  employer_name TEXT,
  employer_screening_completed BOOLEAN DEFAULT false,
  funding_pathway TEXT,
  user_id UUID,
  workforce_screening_completed BOOLEAN DEFAULT false
);

-- ============================================
-- PAGE_VIEWS (9 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  page TEXT
);

-- ============================================
-- APPRENTICE_HOURS_LOG (14 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.apprentice_hours_log (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  funding_phase TEXT,
  hour_type TEXT,
  logged_date TIMESTAMPTZ,
  minutes INTEGER DEFAULT 0,
  status TEXT,
  verified_by TEXT
);

-- ============================================
-- DISCUSSIONS (18 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.discussions (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  author TEXT,
  content TEXT,
  date TIMESTAMPTZ,
  description TEXT,
  duration INTEGER DEFAULT 0,
  elevateforhumanity TEXT,
  is_pinned BOOLEAN DEFAULT false,
  likes TEXT,
  member_count INTEGER DEFAULT 0,
  profiles JSONB DEFAULT '[]',
  replies TEXT,
  reply_count INTEGER DEFAULT 0,
  slug TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT
);

-- ============================================
-- DRUG_TESTS (8 columns)
-- ============================================
CREATE TABLE IF NOT EXISTS public.drug_tests (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  result TEXT,
  test_type TEXT
);
