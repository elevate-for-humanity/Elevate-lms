-- ============================================================================
-- CREATE TRULY MISSING TABLES
-- Created: July 7, 2026
-- Purpose: Create 28 tables that are used in code but don't exist anywhere
-- ============================================================================

-- ============================================================================
-- TESTING/CERTIFICATION (2)
-- ============================================================================

-- Testing leads for exam scheduling
CREATE TABLE IF NOT EXISTS public.testing_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    program_id UUID REFERENCES public.programs(id),
    exam_type TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certiport exam requests
CREATE TABLE IF NOT EXISTS public.certiport_exam_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    exam_code TEXT NOT NULL,
    exam_title TEXT,
    scheduled_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'scheduled', 'completed', 'cancelled')),
    proctor_id UUID,
    location TEXT,
    confirmation_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROGRAM MANAGEMENT (1)
-- ============================================================================

-- Program holder call log
CREATE TABLE IF NOT EXISTS public.program_holder_call_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_holder_id UUID REFERENCES auth.users(id),
    call_type TEXT DEFAULT 'outbound' CHECK (call_type IN ('outbound', 'inbound')),
    call_date TIMESTAMPTZ DEFAULT NOW(),
    duration_minutes INTEGER,
    outcome TEXT,
    notes TEXT,
    follow_up_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PARTNER/AGREEMENT (4)
-- ============================================================================

-- MOU templates
CREATE TABLE IF NOT EXISTS public.mou_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    template_type TEXT DEFAULT 'standard',
    version TEXT,
    effective_date DATE,
    expires_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Barber subscriptions
CREATE TABLE IF NOT EXISTS public.barber_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    subscription_type TEXT DEFAULT 'monthly',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    start_date DATE,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT true,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nail partner applications
CREATE TABLE IF NOT EXISTS public.nail_partner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_name TEXT NOT NULL,
    business_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    license_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner export logs
CREATE TABLE IF NOT EXISTS public.partner_export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES auth.users(id),
    export_type TEXT NOT NULL,
    file_name TEXT,
    file_path TEXT,
    record_count INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WORKFLOW (1)
-- ============================================================================

-- Workflow dead letters
CREATE TABLE IF NOT EXISTS public.workflow_dead_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID,
    workflow_name TEXT,
    payload JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    failed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- E-COMMERCE (1)
-- ============================================================================

-- Subscription invoices
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    subscription_id TEXT NOT NULL,
    invoice_number TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
    payment_method TEXT,
    stripe_invoice_id TEXT,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMMUNICATIONS (2)
-- ============================================================================

-- SMS messages
CREATE TABLE IF NOT EXISTS public.sms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    twilio_sid TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled messages
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT DEFAULT 'sms' CHECK (channel IN ('sms', 'email', 'push')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled', 'failed')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMPLIANCE (2)
-- ============================================================================

-- Verify audit
CREATE TABLE IF NOT EXISTS public.verify_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    verification_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
    document_url TEXT,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Managed licenses
CREATE TABLE IF NOT EXISTS public.managed_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    license_type TEXT NOT NULL,
    license_number TEXT,
    issuing_state TEXT,
    issued_date DATE,
    expiration_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
    renewal_reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADMIN/PLATFORM (4)
-- ============================================================================

-- Blog posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    featured_image TEXT,
    author_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    category TEXT,
    tags TEXT[],
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calculator usage
CREATE TABLE IF NOT EXISTS public.calculator_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    calculator_type TEXT NOT NULL,
    inputs JSONB,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkout contexts
CREATE TABLE IF NOT EXISTS public.checkout_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    product_id TEXT,
    product_type TEXT,
    pricing_option TEXT,
    context_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Shop recommendations
CREATE TABLE IF NOT EXISTS public.shop_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    shop_id UUID,
    shop_name TEXT,
    recommendation_type TEXT,
    score DECIMAL(5,2),
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'applied', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications
CREATE TABLE IF NOT EXISTS public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in_app')),
    subject TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- KNOWLEDGE (1)
-- ============================================================================

-- OCR extractions
CREATE TABLE IF NOT EXISTS public.ocr_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    document_type TEXT,
    file_url TEXT NOT NULL,
    extracted_text TEXT,
    confidence_score DECIMAL(5,2),
    extracted_data JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- APPRENTICESHIP (1)
-- ============================================================================

-- Hour transfer requests
CREATE TABLE IF NOT EXISTS public.hour_transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apprentice_id UUID REFERENCES auth.users(id),
    from_program_id UUID,
    to_program_id UUID,
    hours_requested DECIMAL(6,2) NOT NULL,
    current_hours DECIMAL(6,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WORKFORCE/WIOA (1)
-- ============================================================================

-- Workforce analytics
CREATE TABLE IF NOT EXISTS public.workforce_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    report_type TEXT NOT NULL,
    metrics JSONB NOT NULL,
    period_start DATE,
    period_end DATE,
    generated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WorkOne checklist
CREATE TABLE IF NOT EXISTS public.workone_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES auth.users(id),
    checklist_type TEXT DEFAULT 'initial',
    items JSONB NOT NULL,
    completed_items JSONB,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_testing_leads_email ON public.testing_leads(email);
CREATE INDEX IF NOT EXISTS idx_testing_leads_status ON public.testing_leads(status);
CREATE INDEX IF NOT EXISTS idx_certiport_requests_user ON public.certiport_exam_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_certiport_requests_status ON public.certiport_exam_requests(status);
CREATE INDEX IF NOT EXISTS idx_program_holder_calls_holder ON public.program_holder_call_log(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_mou_templates_active ON public.mou_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_barber_subscriptions_user ON public.barber_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_nail_partner_apps_status ON public.nail_partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_export_logs_partner ON public.partner_export_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_workflow_dead_letters_status ON public.workflow_dead_letters(status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_user ON public.subscription_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON public.subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_user ON public.sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON public.sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user ON public.scheduled_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_at ON public.scheduled_messages(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_verify_audit_user ON public.verify_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_managed_licenses_user ON public.managed_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_calculator_usage_user ON public.calculator_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_contexts_session ON public.checkout_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_shop_recommendations_user ON public.shop_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_communications_user ON public.communications(user_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON public.communications(type);
CREATE INDEX IF NOT EXISTS idx_ocr_extractions_user ON public.ocr_extractions(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_extractions_status ON public.ocr_extractions(status);
CREATE INDEX IF NOT EXISTS idx_hour_transfer_requests_apprentice ON public.hour_transfer_requests(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_hour_transfer_requests_status ON public.hour_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_workforce_analytics_date ON public.workforce_analytics(report_date);
CREATE INDEX IF NOT EXISTS idx_workone_checklist_participant ON public.workone_checklist(participant_id);
CREATE INDEX IF NOT EXISTS idx_workone_checklist_status ON public.workone_checklist(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.testing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certiport_exam_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_call_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nail_partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_dead_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verify_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managed_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workone_checklist ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Allow authenticated" ON public.testing_leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.certiport_exam_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.program_holder_call_log FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.mou_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.barber_subscriptions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.nail_partner_applications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.partner_export_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.workflow_dead_letters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.subscription_invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.sms_messages FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.scheduled_messages FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.verify_audit FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.managed_licenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.blog_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.calculator_usage FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.checkout_contexts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.shop_recommendations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.communications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.ocr_extractions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.hour_transfer_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.workforce_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated" ON public.workone_checklist FOR ALL TO authenticated USING (true);
