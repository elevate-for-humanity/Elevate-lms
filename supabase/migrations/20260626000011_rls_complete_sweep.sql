-- RLS complete sweep: enable RLS on all remaining public tables
-- Applied directly to live DB. This file documents what was applied.
-- All tables in public schema now have RLS enabled.

-- ============================================================
-- TABLES CREATED AND SECURED (missing from live DB)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.flashcard_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  cards JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.profiles(id),
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='flashcard_sets') THEN
    EXECUTE 'ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.flashcard_sets FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.flashcard_sets FOR SELECT USING (published=true); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.gamification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gamification_events') THEN
    EXECUTE 'ALTER TABLE public.gamification_events ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.gamification_events FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.gamification_events FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.grant_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  funding_source TEXT,
  total_budget NUMERIC(12,2),
  available_budget NUMERIC(12,2),
  eligibility_criteria JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='grant_programs') THEN
    EXECUTE 'ALTER TABLE public.grant_programs ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.grant_programs FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.grant_programs FOR SELECT USING (active=true); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.grant_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_program_id UUID REFERENCES public.grant_programs(id),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id UUID,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  disbursed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='grant_disbursements') THEN
    EXECUTE 'ALTER TABLE public.grant_disbursements ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.grant_disbursements FOR SELECT USING (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.grant_disbursements FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  specializations TEXT[],
  certifications TEXT[],
  hourly_rate NUMERIC(8,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='instructor_profiles') THEN
    EXECUTE 'ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.instructor_profiles FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.instructor_profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff','instructor'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.instructor_profiles FOR SELECT USING (active=true); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.instructor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.profiles(id),
  course_id UUID,
  program_id UUID,
  cohort_id UUID,
  role TEXT DEFAULT 'instructor',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='instructor_assignments') THEN
    EXECUTE 'ALTER TABLE public.instructor_assignments ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY instructor_own ON public.instructor_assignments FOR SELECT USING (instructor_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.instructor_assignments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.instructor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME,
  end_time TIME,
  timezone TEXT DEFAULT 'UTC',
  recurring BOOLEAN DEFAULT true,
  specific_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='instructor_availability') THEN
    EXECUTE 'ALTER TABLE public.instructor_availability ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY instructor_own ON public.instructor_availability FOR ALL USING (instructor_id=auth.uid()) WITH CHECK (instructor_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.instructor_availability FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.interview_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID,
  employer_id UUID REFERENCES public.profiles(id),
  candidate_id UUID REFERENCES public.profiles(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='interview_schedules') THEN
    EXECUTE 'ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY candidate_own ON public.interview_schedules FOR SELECT USING (candidate_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY employer_own ON public.interview_schedules FOR ALL USING (employer_id=auth.uid()) WITH CHECK (employer_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.interview_schedules FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id UUID,
  amount NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  stripe_invoice_id TEXT,
  pdf_url TEXT,
  line_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices') THEN
    EXECUTE 'ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.invoices FOR SELECT USING (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.invoices FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.job_categories(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='job_categories') THEN
    EXECUTE 'ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.job_categories FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.job_categories FOR SELECT USING (active=true); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.job_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.profiles(id),
  job_posting_id UUID,
  program_id UUID,
  job_title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  salary NUMERIC(10,2),
  placement_type TEXT DEFAULT 'full_time',
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='job_placements') THEN
    EXECUTE 'ALTER TABLE public.job_placements ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.job_placements FOR SELECT USING (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.job_placements FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.job_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID,
  skill_name TEXT NOT NULL,
  skill_level TEXT DEFAULT 'required',
  created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='job_skills') THEN
    EXECUTE 'ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.job_skills FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.job_skills FOR SELECT USING (true); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.profiles(id),
  mentee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled',
  meeting_link TEXT,
  notes TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='mentorship_sessions') THEN
    EXECUTE 'ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY participant_own ON public.mentorship_sessions FOR ALL USING (mentor_id=auth.uid() OR mentee_id=auth.uid()) WITH CHECK (mentor_id=auth.uid() OR mentee_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.mentorship_sessions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT,
  thread_type TEXT DEFAULT 'direct',
  participant_ids UUID[] DEFAULT '{}',
  last_message_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='message_threads') THEN
    EXECUTE 'ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY participant_own ON public.message_threads FOR ALL USING (auth.uid() = ANY(participant_ids)) WITH CHECK (auth.uid() = ANY(participant_ids)); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.message_threads FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.placement_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID,
  employer_name TEXT,
  job_title TEXT,
  start_date DATE,
  salary NUMERIC(10,2),
  employment_type TEXT,
  outcome_type TEXT DEFAULT 'employed',
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='placement_outcomes') THEN
    EXECUTE 'ALTER TABLE public.placement_outcomes ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.placement_outcomes FOR SELECT USING (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.placement_outcomes FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.program_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id),
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  max_capacity INTEGER,
  current_enrollment INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  instructor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='program_cohorts') THEN
    EXECUTE 'ALTER TABLE public.program_cohorts ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.program_cohorts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.program_cohorts FOR SELECT USING (status='open'); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.program_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, user_id)
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='program_reviews') THEN
    EXECUTE 'ALTER TABLE public.program_reviews ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.program_reviews FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.program_reviews FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.program_reviews FOR SELECT USING (true); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.resource_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT DEFAULT 'document',
  url TEXT,
  file_path TEXT,
  program_ids UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='resource_library') THEN
    EXECUTE 'ALTER TABLE public.resource_library ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.resource_library FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.resource_library FOR SELECT USING (is_public=true); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.resume_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary TEXT,
  skills TEXT[] DEFAULT '{}',
  experience JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  linkedin_url TEXT,
  portfolio_url TEXT,
  is_visible_to_employers BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='resume_profiles') THEN
    EXECUTE 'ALTER TABLE public.resume_profiles ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.resume_profiles FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY employer_read ON public.resume_profiles FOR SELECT USING (is_visible_to_employers=true AND EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='employer')); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.resume_profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.scholarship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id),
  scholarship_type TEXT NOT NULL,
  amount_requested NUMERIC(10,2),
  amount_awarded NUMERIC(10,2),
  status TEXT DEFAULT 'pending',
  essay TEXT,
  supporting_docs JSONB DEFAULT '[]',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='scholarship_applications') THEN
    EXECUTE 'ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.scholarship_applications FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.scholarship_applications FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  assessment_type TEXT DEFAULT 'self_reported',
  score INTEGER,
  level TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='skill_assessments') THEN
    EXECUTE 'ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.skill_assessments FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.skill_assessments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.skill_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  image_url TEXT,
  criteria JSONB DEFAULT '{}',
  program_id UUID,
  badge_type TEXT DEFAULT 'completion',
  created_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='skill_badges') THEN
    EXECUTE 'ALTER TABLE public.skill_badges ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.skill_badges FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.skill_badges FOR SELECT USING (true); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.sponsor_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  sponsor_type TEXT DEFAULT 'employer',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sponsor_organizations') THEN
    EXECUTE 'ALTER TABLE public.sponsor_organizations ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.sponsor_organizations FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.sponsor_organizations FOR SELECT USING (active=true); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.training_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  provider_type TEXT DEFAULT 'school',
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  etpl_approved BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='training_providers') THEN
    EXECUTE 'ALTER TABLE public.training_providers ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.training_providers FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY public_read ON public.training_providers FOR SELECT USING (active=true); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id),
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'waiting',
  position INTEGER,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='waitlist_entries') THEN
    EXECUTE 'ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
DO $$ BEGIN CREATE POLICY user_own ON public.waitlist_entries FOR ALL USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid()); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY admin_all ON public.waitlist_entries FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('admin','super_admin','staff'))); EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

-- ============================================================
-- RLS ENABLED ON EXISTING TABLES (no user column — admin_all + public_read)
-- ============================================================

DO $$ DECLARE t TEXT; tables TEXT[] := ARRAY[
  'data_processing_jobs','demo_analytics','document_categories','documentation',
  'donation_tiers','downloads','drug_testing_policies','email_workflows',
  'employer_incentives','employer_sponsorships','enrollment_jobs','entitlements',
  'exams','faq_search_analytics','financial_assurances','form_fields',
  'foundation_services','funding_options','funding_programs','funding_records',
  'gamification_points','grade_items','grant_entities','grant_packages',
  'handbook_sections','hsi_course_products','impact_metrics','impact_statistics',
  'incentives','industries','integration_configs','integrations','job_listings',
  'leaderboard','learning_paths','learning_resources','legal_documents',
  'lesson_comments','license_tiers','live_sessions','lti_platforms',
  'marketplace_courses','marketplace_sellers','milady_license_codes',
  'navigation_categories','navigation_items','news_articles','news_categories',
  'nonprofit_services','org_narratives','org_profile','org_settings','pathways',
  'payment_options','platform_apps','platform_features','platform_products',
  'policies','practice_exam_blueprints','pricing_plans','program_announcements',
  'program_course_versions','program_curriculum_modules','program_enrollment_tracks',
  'program_funding','program_funding_options','program_requirement_rules',
  'program_sponsorships','question_bank','question_banks','questions','reports',
  'resources','rise_programs','sam_entities','sam_opportunities','settings',
  'sites','skill_categories','soc_controls','state_rules','statistics',
  'store_products','support_articles','support_groups','survey_responses',
  'surveys','tax_firms','tax_interview_questions','tax_services','tax_tools',
  'volunteer_opportunities'
]; BEGIN FOREACH t IN ARRAY tables LOOP
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS admin_all ON public.%I', t);
    EXECUTE format('CREATE POLICY admin_all ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN (''admin'',''super_admin'',''staff'')))', t);
    EXECUTE format('DROP POLICY IF EXISTS public_read ON public.%I', t);
    EXECUTE format('CREATE POLICY public_read ON public.%I FOR SELECT USING (true)', t);
  END IF;
END LOOP; END $$;

-- ============================================================
-- RLS ENABLED ON EXISTING TABLES (admin_all only — sensitive/internal)
-- ============================================================

DO $$ DECLARE t TEXT; tables TEXT[] := ARRAY[
  'discussion_replies','discussions','drug_testing_orders','email_events',
  'emails','enrollment_acknowledgments','enrollment_voucher_audit',
  'entity_eligibility_checks','exam_attempt_questions','exam_attempts',
  'exam_booking_leads','ferpa_access_requests','ferpa_calendar_events',
  'ferpa_training','follow_up_reminders','follow_ups','forum_subscriptions',
  'forum_thread_views','generated_assets','grant_application_instances',
  'grant_eligibility_results','grant_federal_forms','grant_matches',
  'grant_submissions','hours_logs','indiana_alerts_sent',
  'indiana_enforcement_actions','jri_participants','lesson_bookmarks',
  'lesson_competencies','lesson_enhancements','lesson_notes','lesson_questions',
  'license_keys','meetings','mentor_sessions','mentorships',
  'milady_orientation_status','milady_rise_enrollments','moderation_queue',
  'module_progress','mous','notes','ojt_notes','onboarding_email_log',
  'onboarding_resources','participant_barriers','partner_acknowledgment_items',
  'partner_acknowledgments','partner_lms_sync_logs','partner_sessions',
  'payment_sessions','payroll','placements','portfolio_projects',
  'practical_requirements','priority_scores','product_clones',
  'product_page_views','program_banner_views','program_discussion_replies',
  'program_discussions','program_holder_banking','provisioning_jobs',
  'public_ai_tutor_logs','refund_advance_applications','reporting_completions',
  'reporting_enrollments','reporting_funding','reporting_progress',
  'reporting_verdicts','resumes','rise_participants','sam_alerts',
  'scorm_attempts','scorm_cmi_data','script_acknowledgments','script_deviations',
  'search_analytics','security_logs','seller_applications','shop_checkin_codes',
  'shop_profiles','shop_weekly_reports','skills_checklist','social_media_campaigns',
  'social_posts','staff','staff_notifications','store_entitlements',
  'store_subscriptions','studio_deployments','study_sessions',
  'sub_office_agreements','support_sessions','tax_filing_applications',
  'tax_return_events','tenant_compliance_records','testing_slots',
  'transmission_statuses','web_vitals','webhook_logs'
]; BEGIN FOREACH t IN ARRAY tables LOOP
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS admin_all ON public.%I', t);
    EXECUTE format('CREATE POLICY admin_all ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN (''admin'',''super_admin'',''staff'')))', t);
  END IF;
END LOOP; END $$;
