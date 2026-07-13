-- ============================================================================
-- CRITICAL MISSING TABLES - Elevate LMS
-- Created: July 7, 2026
-- Purpose: These tables are used in code but not defined in migrations
-- ============================================================================

-- Apprentices table
CREATE TABLE IF NOT EXISTS public.apprentices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES public.programs(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn', 'suspended')),
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprentice applications
CREATE TABLE IF NOT EXISTS public.apprentice_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    program_id UUID REFERENCES public.programs(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprentice placements
CREATE TABLE IF NOT EXISTS public.apprentice_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apprentice_id UUID REFERENCES public.apprentices(id),
    host_shop_id UUID,
    placement_date DATE,
    status TEXT DEFAULT 'active',
    supervisor_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprentice sites
CREATE TABLE IF NOT EXISTS public.apprentice_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    phone TEXT,
    email TEXT,
    site_type TEXT,
    capacity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprentice skills
CREATE TABLE IF NOT EXISTS public.apprentice_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apprentice_id UUID REFERENCES public.apprentices(id),
    skill_name TEXT NOT NULL,
    skill_category TEXT,
    proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hour entries
CREATE TABLE IF NOT EXISTS public.hour_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apprentice_id UUID REFERENCES public.apprentices(id),
    entry_date DATE NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,
    hour_type TEXT DEFAULT 'ojt' CHECK (hour_type IN ('ojt', 'related', 'total')),
    host_shop_id UUID,
    supervisor_id UUID,
    approved BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hour transfer requests
CREATE TABLE IF NOT EXISTS public.hour_transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apprentice_id UUID REFERENCES public.apprentices(id),
    from_program_id UUID,
    to_program_id UUID,
    hours_requested DECIMAL(5,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAPIDS apprentices
CREATE TABLE IF NOT EXISTS public.rapids_apprentices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apprentice_id UUID REFERENCES public.apprentices(id),
    rapids_id TEXT UNIQUE,
    rapids_status TEXT,
    registered_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certifications
CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    certifying_body TEXT,
    validity_period INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credentials
CREATE TABLE IF NOT EXISTS public.credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    certification_id UUID REFERENCES public.certifications(id),
    credential_number TEXT UNIQUE,
    issued_date DATE,
    expiration_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program enrollments
CREATE TABLE IF NOT EXISTS public.program_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    program_id UUID REFERENCES public.programs(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'withdrawn', 'suspended')),
    enrollment_date DATE,
    completion_date DATE,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner users
CREATE TABLE IF NOT EXISTS public.partner_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    partner_id UUID REFERENCES public.partners(id),
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partners
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agreement acceptances
CREATE TABLE IF NOT EXISTS public.agreement_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_version_id UUID,
    user_id UUID REFERENCES auth.users(id),
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Agreement versions
CREATE TABLE IF NOT EXISTS public.agreement_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_type TEXT NOT NULL,
    version TEXT NOT NULL,
    content TEXT,
    effective_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LMS courses
CREATE TABLE IF NOT EXISTS public.lms_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    duration_hours INTEGER,
    difficulty_level TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curriculum lessons
CREATE TABLE IF NOT EXISTS public.curriculum_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.lms_courses(id),
    title TEXT NOT NULL,
    content TEXT,
    lesson_order INTEGER,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    lesson_id UUID REFERENCES public.curriculum_lessons(id),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skills
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    skill_name TEXT NOT NULL,
    skill_category TEXT,
    proficiency_level INTEGER DEFAULT 1,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handbooks
CREATE TABLE IF NOT EXISTS public.handbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    version TEXT,
    effective_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handbook acknowledgments
CREATE TABLE IF NOT EXISTS public.handbook_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    handbook_id UUID REFERENCES public.handbooks(id),
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    subject TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employer documents
CREATE TABLE IF NOT EXISTS public.employer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES public.employers(id),
    document_type TEXT,
    file_url TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff users
CREATE TABLE IF NOT EXISTS public.staff_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    department TEXT,
    position TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff attendance
CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID REFERENCES public.staff_users(id),
    date DATE NOT NULL,
    status TEXT DEFAULT 'present',
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staffs
CREATE TABLE IF NOT EXISTS public.staffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    role TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_apprentices_user_id ON public.apprentices(user_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_applications_email ON public.apprentice_applications(email);
CREATE INDEX IF NOT EXISTS idx_apprentice_placements_apprentice_id ON public.apprentice_placements(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_hour_entries_apprentice_id ON public.hour_entries(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_hour_entries_entry_date ON public.hour_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_id ON public.program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program_id ON public.program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.apprentices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprentice_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprentice_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprentice_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprentice_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapids_apprentices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbook_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow authenticated users)
CREATE POLICY "Allow authenticated" ON public.apprentices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.apprentice_applications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.apprentice_placements FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.apprentice_sites FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.apprentice_skills FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.hour_entries FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.hour_transfer_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.rapids_apprentices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.certifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.credentials FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.program_enrollments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.partner_users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.agreement_acceptances FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.agreement_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.lms_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.curriculum_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.lesson_progress FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.user_skills FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.handbooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.handbook_acknowledgments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.notifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.conversations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.employer_documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.staff_users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.staff_attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.staffs FOR ALL TO authenticated USING (true);
