-- Schema Governance: Constraints & Indexes for Core 19 Tables
-- Generated from live Supabase schema (cuxzzpsyufcewtmicszk)
-- All statements use IF NOT EXISTS or DO blocks for safe re-runs.

-- ============================================
-- APPLICATIONS
-- ============================================
-- PK: applications_pkey (id)
-- FK: applications_employer_sponsor_id_fkey: applications.employer_sponsor_id -> employer_sponsors.id
DO $$ BEGIN
  ALTER TABLE public.applications ADD CONSTRAINT applications_employer_sponsor_id_fkey
    FOREIGN KEY (employer_sponsor_id) REFERENCES public.employer_sponsors(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: applications_intake_id_fkey: applications.intake_id -> intakes.id
DO $$ BEGIN
  ALTER TABLE public.applications ADD CONSTRAINT applications_intake_id_fkey
    FOREIGN KEY (intake_id) REFERENCES public.intakes(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: applications_program_id_fkey: applications.program_id -> programs.id
DO $$ BEGIN
  ALTER TABLE public.applications ADD CONSTRAINT applications_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: applications_reviewer_id_fkey: applications.reviewer_id -> profiles.id
DO $$ BEGIN
  ALTER TABLE public.applications ADD CONSTRAINT applications_reviewer_id_fkey
    FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: applications_user_id_fkey: applications.user_id -> auth.users.id
DO $$ BEGIN
  ALTER TABLE public.applications ADD CONSTRAINT applications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS applications_submit_token_uq ON public.applications USING btree (submit_token);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_eligibility_status ON public.applications USING btree (eligibility_status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications USING btree (email);
CREATE INDEX IF NOT EXISTS idx_applications_pathway_slug ON public.applications USING btree (pathway_slug);
CREATE INDEX IF NOT EXISTS idx_applications_program ON public.applications USING btree (program_id);
CREATE INDEX IF NOT EXISTS idx_applications_program_id ON public.applications USING btree (program_id);
CREATE INDEX IF NOT EXISTS idx_applications_program_id_created_desc ON public.applications USING btree (program_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_program_slug ON public.applications USING btree (program_slug);
CREATE INDEX IF NOT EXISTS idx_applications_source ON public.applications USING btree (source);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications USING btree (status);

-- ============================================
-- APPOINTMENTS
-- ============================================
-- PK: appointments_pkey (id)

-- ============================================
-- CERTIFICATES
-- ============================================
-- PK: certificates_pkey (id)
ALTER TABLE public.certificates ADD CONSTRAINT IF NOT EXISTS certificates_certificate_number_key UNIQUE (certificate_number);
-- FK: certificates_enrollment_fk: certificates.enrollment_id -> training_enrollments.id
DO $$ BEGIN
  ALTER TABLE public.certificates ADD CONSTRAINT certificates_enrollment_fk
    FOREIGN KEY (enrollment_id) REFERENCES public.training_enrollments(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: certificates_tenant_id_fkey: certificates.tenant_id -> tenants.id
DO $$ BEGIN
  ALTER TABLE public.certificates ADD CONSTRAINT certificates_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: certificates_user_id_fkey: certificates.user_id -> profiles.id
DO $$ BEGIN
  ALTER TABLE public.certificates ADD CONSTRAINT certificates_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS certificates_enrollment_id_idx ON public.certificates USING btree (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON public.certificates USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates USING btree (certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_tenant_user ON public.certificates USING btree (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates USING btree (user_id);

-- ============================================
-- DOCUMENTS
-- ============================================
-- PK: documents_pkey (id)
-- FK: documents_reviewed_by_fkey: documents.reviewed_by -> auth.users.id
DO $$ BEGIN
  ALTER TABLE public.documents ADD CONSTRAINT documents_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: documents_uploaded_by_fkey: documents.uploaded_by -> auth.users.id
DO $$ BEGIN
  ALTER TABLE public.documents ADD CONSTRAINT documents_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: documents_user_id_fkey: documents.user_id -> auth.users.id
DO $$ BEGIN
  ALTER TABLE public.documents ADD CONSTRAINT documents_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: documents_verified_by_fkey: documents.verified_by -> profiles.id
DO $$ BEGIN
  ALTER TABLE public.documents ADD CONSTRAINT documents_verified_by_fkey
    FOREIGN KEY (verified_by) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents USING btree (owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents USING btree (status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents USING btree (document_type);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_verified ON public.documents USING btree (verified);

-- ============================================
-- MESSAGES
-- ============================================
-- PK: messages_pkey (id)
-- FK: messages_recipient_id_fkey: messages.recipient_id -> auth.users.id
DO $$ BEGIN
  ALTER TABLE public.messages ADD CONSTRAINT messages_recipient_id_fkey
    FOREIGN KEY (recipient_id) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: messages_sender_id_fkey: messages.sender_id -> auth.users.id
DO $$ BEGIN
  ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages USING btree (read);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages USING btree (recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages USING btree (sender_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
-- PK: notifications_pkey (id)
ALTER TABLE public.notifications ADD CONSTRAINT IF NOT EXISTS notifications_idempotency_key_key UNIQUE (idempotency_key);
-- FK: notifications_tenant_id_fkey: notifications.tenant_id -> tenants.id
DO $$ BEGIN
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: notifications_user_id_fkey: notifications.user_id -> auth.users.id
DO $$ BEGIN
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency ON public.notifications USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications USING btree (read);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications USING btree (user_id);

-- ============================================
-- ORGANIZATIONS
-- ============================================
-- PK: organizations_pkey (id)
ALTER TABLE public.organizations ADD CONSTRAINT IF NOT EXISTS organizations_slug_key UNIQUE (slug);
CREATE INDEX IF NOT EXISTS idx_organizations_contact_email ON public.organizations USING btree (contact_email);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations USING btree (status);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON public.organizations USING btree (type);

-- ============================================
-- PARTNER_LMS_ENROLLMENTS
-- ============================================
-- PK: partner_lms_enrollments_pkey (id)
-- FK: partner_lms_enrollments_program_id_fkey: partner_lms_enrollments.program_id -> programs.id
DO $$ BEGIN
  ALTER TABLE public.partner_lms_enrollments ADD CONSTRAINT partner_lms_enrollments_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: partner_lms_enrollments_provider_id_fkey: partner_lms_enrollments.provider_id -> partner_lms_providers.id
DO $$ BEGIN
  ALTER TABLE public.partner_lms_enrollments ADD CONSTRAINT partner_lms_enrollments_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES public.partner_lms_providers(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: partner_lms_enrollments_student_id_fkey: partner_lms_enrollments.student_id -> profiles.id
DO $$ BEGIN
  ALTER TABLE public.partner_lms_enrollments ADD CONSTRAINT partner_lms_enrollments_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_partner_enrollments_course ON public.partner_lms_enrollments USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_partner_enrollments_provider ON public.partner_lms_enrollments USING btree (provider_id);
CREATE INDEX IF NOT EXISTS idx_partner_enrollments_status ON public.partner_lms_enrollments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_partner_enrollments_student ON public.partner_lms_enrollments USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_partner_lms_enrollments_funding_source ON public.partner_lms_enrollments USING btree (funding_source);

-- ============================================
-- PROFILES
-- ============================================
-- PK: profiles_pkey (id)
-- FK: profiles_id_fkey: profiles.id -> auth.users.id
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: profiles_organization_id_fkey: profiles.organization_id -> organizations.id
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: profiles_program_holder_fkey: profiles.program_holder_id -> program_holders.id
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_program_holder_fkey
    FOREIGN KEY (program_holder_id) REFERENCES public.program_holders(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_profiles_enrollment_status ON public.profiles USING btree (enrollment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles USING btree (tenant_id);

-- ============================================
-- PROGRAM_HOLDERS
-- ============================================
-- PK: program_holders_pkey (id)
ALTER TABLE public.program_holders ADD CONSTRAINT IF NOT EXISTS unique_program_holders_user_id UNIQUE (user_id);
-- FK: program_holders_primary_program_fkey: program_holders.primary_program_id -> programs.id
DO $$ BEGIN
  ALTER TABLE public.program_holders ADD CONSTRAINT program_holders_primary_program_fkey
    FOREIGN KEY (primary_program_id) REFERENCES public.programs(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: program_holders_user_id_fkey: program_holders.user_id -> auth.users.id
DO $$ BEGIN
  ALTER TABLE public.program_holders ADD CONSTRAINT program_holders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_program_holders_status ON public.program_holders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_program_holders_user_id ON public.program_holders USING btree (user_id);

-- ============================================
-- PROGRAMS
-- ============================================
-- PK: programs_pkey (id)
ALTER TABLE public.programs ADD CONSTRAINT IF NOT EXISTS programs_code_key UNIQUE (code);
ALTER TABLE public.programs ADD CONSTRAINT IF NOT EXISTS programs_slug_key UNIQUE (slug);
-- FK: fk_programs_store: programs.store_id -> store_instances.id
DO $$ BEGIN
  ALTER TABLE public.programs ADD CONSTRAINT fk_programs_store
    FOREIGN KEY (store_id) REFERENCES public.store_instances(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: programs_canonical_program_id_fkey: programs.canonical_program_id -> programs.id
DO $$ BEGIN
  ALTER TABLE public.programs ADD CONSTRAINT programs_canonical_program_id_fkey
    FOREIGN KEY (canonical_program_id) REFERENCES public.programs(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: programs_organization_id_fkey: programs.organization_id -> organizations.id
DO $$ BEGIN
  ALTER TABLE public.programs ADD CONSTRAINT programs_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_programs_active ON public.programs USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_programs_active_category ON public.programs USING btree (is_active, category);
CREATE INDEX IF NOT EXISTS idx_programs_active_category_norm ON public.programs USING btree (is_active, category_norm);
CREATE INDEX IF NOT EXISTS idx_programs_active_created_desc ON public.programs USING btree (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_programs_active_featured_created_desc ON public.programs USING btree (is_active, featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_programs_availability ON public.programs USING btree (availability_status);
CREATE INDEX IF NOT EXISTS idx_programs_category ON public.programs USING btree (category);
CREATE INDEX IF NOT EXISTS idx_programs_cip_code ON public.programs USING btree (cip_code);
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON public.programs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_programs_featured ON public.programs USING btree (featured) WHERE (featured = true);
CREATE INDEX IF NOT EXISTS idx_programs_is_active ON public.programs USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_programs_is_apprenticeship ON public.programs USING btree (is_apprenticeship);
CREATE INDEX IF NOT EXISTS idx_programs_org_active_created_desc ON public.programs USING btree (organization_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_programs_organization_id ON public.programs USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_programs_partner_id ON public.programs USING btree (partner_id);
CREATE INDEX IF NOT EXISTS idx_programs_published ON public.programs USING btree (published);
CREATE INDEX IF NOT EXISTS idx_programs_slug ON public.programs USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_programs_soc_code ON public.programs USING btree (soc_code);
CREATE INDEX IF NOT EXISTS idx_programs_state_code ON public.programs USING btree (state_code);
CREATE INDEX IF NOT EXISTS idx_programs_store ON public.programs USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_programs_tenant_id ON public.programs USING btree (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS programs_slug_unique ON public.programs USING btree (slug) WHERE (slug IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS programs_unique_active_slug ON public.programs USING btree (slug) WHERE (is_active = true);
CREATE UNIQUE INDEX IF NOT EXISTS ux_programs_slug ON public.programs USING btree (slug);

-- ============================================
-- SHOPS
-- ============================================
-- PK: shops_pkey (id)
-- FK: shops_tenant_id_fkey: shops.tenant_id -> tenants.id
DO $$ BEGIN
  ALTER TABLE public.shops ADD CONSTRAINT shops_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_shops_active ON public.shops USING btree (id) WHERE (active = true);
CREATE INDEX IF NOT EXISTS idx_shops_coords ON public.shops USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_shops_tenant ON public.shops USING btree (tenant_id);

-- ============================================
-- STUDENTS
-- ============================================
-- PK: students_pkey (id)
-- FK: students_eligibility_verified_by_fkey: students.eligibility_verified_by -> profiles.id
DO $$ BEGIN
  ALTER TABLE public.students ADD CONSTRAINT students_eligibility_verified_by_fkey
    FOREIGN KEY (eligibility_verified_by) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: students_id_fkey: students.id -> profiles.id
DO $$ BEGIN
  ALTER TABLE public.students ADD CONSTRAINT students_id_fkey
    FOREIGN KEY (id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TENANTS
-- ============================================
-- PK: tenants_pkey (id)
ALTER TABLE public.tenants ADD CONSTRAINT IF NOT EXISTS tenants_slug_key UNIQUE (slug);

-- ============================================
-- TRAINING_COURSES
-- ============================================
-- PK: training_courses_pkey (id)
ALTER TABLE public.training_courses ADD CONSTRAINT IF NOT EXISTS training_courses_course_code_key UNIQUE (course_code);
-- FK: training_courses_instructor_id_fkey: training_courses.instructor_id -> auth.users.id
DO $$ BEGIN
  ALTER TABLE public.training_courses ADD CONSTRAINT training_courses_instructor_id_fkey
    FOREIGN KEY (instructor_id) REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: training_courses_program_id_fkey: training_courses.program_id -> programs.id
DO $$ BEGIN
  ALTER TABLE public.training_courses ADD CONSTRAINT training_courses_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: training_courses_tenant_id_fkey: training_courses.tenant_id -> tenants.id
DO $$ BEGIN
  ALTER TABLE public.training_courses ADD CONSTRAINT training_courses_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_training_courses_program_id ON public.training_courses USING btree (program_id);
CREATE INDEX IF NOT EXISTS idx_training_courses_tenant_id ON public.training_courses USING btree (tenant_id);

-- ============================================
-- TRAINING_ENROLLMENTS
-- ============================================
-- PK: training_enrollments_pkey (id)
ALTER TABLE public.training_enrollments ADD CONSTRAINT IF NOT EXISTS training_enrollments_user_course_unique UNIQUE (user_id);
ALTER TABLE public.training_enrollments ADD CONSTRAINT IF NOT EXISTS training_enrollments_user_id_course_id_key UNIQUE (user_id);
ALTER TABLE public.training_enrollments ADD CONSTRAINT IF NOT EXISTS uq_training_enrollments_user_course UNIQUE (course_id);
-- FK: training_enrollments_course_id_fkey: training_enrollments.course_id -> training_courses.id
DO $$ BEGIN
  ALTER TABLE public.training_enrollments ADD CONSTRAINT training_enrollments_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.training_courses(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: training_enrollments_tenant_id_fkey: training_enrollments.tenant_id -> tenants.id
DO $$ BEGIN
  ALTER TABLE public.training_enrollments ADD CONSTRAINT training_enrollments_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: training_enrollments_user_id_fkey: training_enrollments.user_id -> profiles.id
DO $$ BEGIN
  ALTER TABLE public.training_enrollments ADD CONSTRAINT training_enrollments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_enrollments_application_id ON public.training_enrollments USING btree (application_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_slug ON public.training_enrollments USING btree (program_slug);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.training_enrollments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON public.training_enrollments USING btree (user_id, status);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_course_id ON public.training_enrollments USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_tenant_user ON public.training_enrollments USING btree (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_user_id ON public.training_enrollments USING btree (user_id);
CREATE INDEX IF NOT EXISTS training_enrollments_tenant_id_idx ON public.training_enrollments USING btree (tenant_id);

-- ============================================
-- TRAINING_LESSONS
-- ============================================
-- PK: training_lessons_pkey (id)
ALTER TABLE public.training_lessons ADD CONSTRAINT IF NOT EXISTS training_lessons_course_id_lesson_number_key UNIQUE (lesson_number);
-- FK: training_lessons_course_id_fkey: training_lessons.course_id -> training_courses.id
DO $$ BEGIN
  ALTER TABLE public.training_lessons ADD CONSTRAINT training_lessons_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.training_courses(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- FK: training_lessons_tenant_id_fkey: training_lessons.tenant_id -> tenants.id
DO $$ BEGIN
  ALTER TABLE public.training_lessons ADD CONSTRAINT training_lessons_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_training_lessons_course_id ON public.training_lessons USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_training_lessons_tenant_id ON public.training_lessons USING btree (tenant_id);

-- ============================================
-- USER_PROFILES
-- ============================================
-- PK: user_profiles_pkey (id)
ALTER TABLE public.user_profiles ADD CONSTRAINT IF NOT EXISTS user_profiles_user_id_key UNIQUE (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON public.user_profiles USING btree (user_id);
