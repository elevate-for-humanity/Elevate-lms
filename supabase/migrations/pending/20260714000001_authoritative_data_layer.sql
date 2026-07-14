-- =============================================================================
-- AUTHORITATIVE DATA LAYER - Single Source of Truth
-- =============================================================================
-- This migration creates the foundation for the PARIS Operations Kernel:
-- 1. Organizations - Single organization record
-- 2. Program Registry - Canonical program definitions
-- 3. Funding Rules - Verified funding sources
-- 4. Verified Claims - Evidence-backed public claims
-- 5. Workflow Instances - State machine tracking
-- 6. Workflow Events - Audit trail
-- 7. Notification Outbox - Reliable delivery queue
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SECTION 1: ORGANIZATIONS (Single Organization Record)
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    legal_name TEXT,
    ein TEXT,
    dba TEXT, -- "Doing Business As"
    
    -- Contact Information (Single Source of Truth)
    phone_main TEXT,
    phone_toll_free TEXT,
    phone_fax TEXT,
    email_primary TEXT,
    email_support TEXT,
    email_admissions TEXT,
    
    -- Address
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    address_country TEXT DEFAULT 'US',
    
    -- Branding
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    
    -- Verification Status
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verification_notes TEXT,
    
    -- Active Status
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active organizations" ON organizations
    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Service role can manage organizations" ON organizations
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_verified ON organizations(verified) WHERE verified = TRUE;
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- SECTION 2: PROGRAM REGISTRY (Canonical Program Definitions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS program_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Core Program Info
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    category TEXT,
    description TEXT,
    
    -- Pricing (Single Source of Truth)
    tuition DECIMAL(10,2),
    deposit DECIMAL(10,2),
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    
    -- Duration & Schedule
    duration_weeks INTEGER,
    duration_hours INTEGER,
    schedule_type TEXT, -- 'full-time', 'part-time', 'flexible'
    
    -- Requirements
    minimum_age INTEGER,
    required_documents TEXT[],
    prerequisites TEXT[],
    
    -- Credentials
    credential_name TEXT,
    credential_type TEXT, -- 'certificate', 'license', 'certification', 'degree'
    credential_issuer TEXT,
    
    -- Compliance
    is_etpl_registered BOOLEAN DEFAULT FALSE,
    is_wioa_eligible BOOLEAN DEFAULT FALSE,
    is_dol_sponsored BOOLEAN DEFAULT FALSE,
    rapids_program_id TEXT,
    
    -- Program Holder (Required for Active Status)
    program_holder_id UUID, -- References the entity responsible
    application_route TEXT, -- URL path for applications
    
    -- Content Requirements
    has_syllabus BOOLEAN DEFAULT FALSE,
    has_orientation BOOLEAN DEFAULT FALSE,
    has_handbook BOOLEAN DEFAULT FALSE,
    syllabus_url TEXT,
    handbook_url TEXT,
    orientation_duration_minutes INTEGER,
    
    -- Media
    hero_image_url TEXT,
    hero_video_url TEXT,
    
    -- Status
    is_published BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    publish_date TIMESTAMPTZ,
    sunset_date TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, slug)
);

-- RLS
ALTER TABLE program_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published programs" ON program_registry
    FOR SELECT USING (is_published = TRUE AND is_active = TRUE);
CREATE POLICY "Service role can manage programs" ON program_registry
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Indexes
CREATE INDEX idx_program_registry_slug ON program_registry(slug);
CREATE INDEX idx_program_registry_category ON program_registry(category);
CREATE INDEX idx_program_registry_published ON program_registry(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_program_registry_wioa ON program_registry(is_wioa_eligible) WHERE is_wioa_eligible = TRUE;
CREATE INDEX idx_program_registry_etpl ON program_registry(is_etpl_registered) WHERE is_etpl_registered = TRUE;

-- =============================================================================
-- SECTION 3: FUNDING RULES (Verified Funding Sources)
-- =============================================================================
CREATE TABLE IF NOT EXISTS funding_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    program_registry_id UUID REFERENCES program_registry(id) ON DELETE CASCADE,
    
    -- Funding Source
    name TEXT NOT NULL, -- e.g., "Workforce Ready Grant", "WIOA", "Trade Adjustment Assistance"
    code TEXT NOT NULL, -- e.g., "WIOA-ADULT", "TRF-2024"
    type TEXT NOT NULL, -- 'grant', 'scholarship', 'loan', 'employer_reimbursement', 'payment_plan'
    
    -- Amount
    amount DECIMAL(10,2),
    amount_max DECIMAL(10,2),
    percentage_covered DECIMAL(5,2), -- e.g., 100.00 for full coverage
    copay DECIMAL(10,2),
    
    -- Eligibility
    eligibility_criteria JSONB DEFAULT '[]', -- Array of criteria objects
    income_limits JSONB DEFAULT '{}',
    residency_requirements TEXT[],
    age_requirements INTEGER[],
    
    -- Validity
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Verification
    requires_approval BOOLEAN DEFAULT TRUE,
    approving_authority TEXT,
    approval_process TEXT,
    max_awards INTEGER, -- Maximum number of awards
    
    -- Documentation
    required_documents TEXT[],
    application_url TEXT,
    
    -- Badge Display
    badge_name TEXT,
    badge_color TEXT,
    display_on_public_site BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE funding_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active funding" ON funding_rules
    FOR SELECT USING (is_active = TRUE AND display_on_public_site = TRUE AND (valid_until IS NULL OR valid_until > NOW()));
CREATE POLICY "Service role can manage funding" ON funding_rules
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Indexes
CREATE INDEX idx_funding_rules_program ON funding_rules(program_registry_id);
CREATE INDEX idx_funding_rules_type ON funding_rules(type);
CREATE INDEX idx_funding_rules_valid ON funding_rules(valid_until) WHERE is_active = TRUE;

-- =============================================================================
-- SECTION 4: VERIFIED CLAIMS (Evidence-Backed Public Claims)
-- =============================================================================
CREATE TABLE IF NOT EXISTS verified_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Claim Details
    claim_key TEXT NOT NULL, -- e.g., "ETPL_REGISTERED", "WIOA_ELIGIBLE", "DOL_SPONSORED"
    claim_value TEXT NOT NULL, -- e.g., "Registered", "Eligible", "Active"
    category TEXT NOT NULL, -- 'compliance', 'accreditation', 'partnership', 'outcome', 'certification'
    
    -- Evidence
    evidence_type TEXT NOT NULL, -- 'document', 'url', 'certificate', 'api', 'manual'
    evidence_url TEXT,
    evidence_reference TEXT, -- Certificate number, API endpoint, etc.
    evidence_expiration TIMESTAMPTZ,
    
    -- Approval
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    approver_name TEXT,
    approver_role TEXT,
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    auto_expire BOOLEAN DEFAULT TRUE, -- Automatically remove from public display when expired
    
    -- Display Control
    display_on_website BOOLEAN DEFAULT TRUE,
    display_locations TEXT[], -- Where this badge appears ['footer', 'program_page', 'landing']
    display_priority INTEGER DEFAULT 100, -- Lower = higher priority
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    deprecated_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, claim_key)
);

-- RLS
ALTER TABLE verified_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view verified claims" ON verified_claims
    FOR SELECT USING (
        is_active = TRUE AND 
        is_verified = TRUE AND 
        display_on_website = TRUE AND 
        (valid_until IS NULL OR valid_until > NOW())
    );
CREATE POLICY "Service role can manage claims" ON verified_claims
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Indexes
CREATE INDEX idx_verified_claims_key ON verified_claims(claim_key);
CREATE INDEX idx_verified_claims_category ON verified_claims(category);
CREATE INDEX idx_verified_claims_active ON verified_claims(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_verified_claims_expiring ON verified_claims(valid_until) 
    WHERE is_active = TRUE AND auto_expire = TRUE;

-- =============================================================================
-- SECTION 5: WORKFLOW INSTANCES (State Machine Tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS workflow_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Workflow Definition
    workflow_type TEXT NOT NULL, -- 'enrollment', 'application', 'apprenticeship', 'employer_onboarding'
    workflow_version INTEGER DEFAULT 1,
    
    -- Entity Reference
    entity_type TEXT NOT NULL, -- 'lead', 'application', 'enrollment', 'apprentice'
    entity_id UUID NOT NULL,
    
    -- State Machine
    current_state TEXT NOT NULL,
    previous_state TEXT,
    state_entered_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Progress
    total_steps INTEGER DEFAULT 0,
    completed_steps INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Context
    context JSONB DEFAULT '{}', -- Current workflow context data
    metadata JSONB DEFAULT '{}',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'failed', 'paused'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Error Handling
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    
    -- Actor
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own workflows" ON workflow_instances
    FOR SELECT USING (
        entity_type = 'lead' OR 
        entity_type = 'application' OR
        created_by = auth.uid() OR
        assigned_to = auth.uid() OR
        auth.jwt()->>'role' IN ('service_role', 'admin')
    );
CREATE POLICY "Service role can manage workflows" ON workflow_instances
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Indexes
CREATE INDEX idx_workflow_instances_type ON workflow_instances(workflow_type);
CREATE INDEX idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX idx_workflow_instances_state ON workflow_instances(current_state);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX idx_workflow_instances_assigned ON workflow_instances(assigned_to) WHERE assigned_to IS NOT NULL;

-- =============================================================================
-- SECTION 6: WORKFLOW EVENTS (Audit Trail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS workflow_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type TEXT NOT NULL, -- 'state_change', 'step_start', 'step_complete', 'error', 'retry', 'notification'
    event_name TEXT NOT NULL,
    
    -- State Change Tracking
    from_state TEXT,
    to_state TEXT,
    
    -- Step Details (if applicable)
    step_id TEXT,
    step_name TEXT,
    
    -- Payload
    event_data JSONB DEFAULT '{}',
    
    -- Actor
    actor_type TEXT NOT NULL, -- 'system', 'user', 'admin', 'api'
    actor_id UUID,
    actor_name TEXT,
    
    -- Timing
    duration_ms INTEGER, -- Duration of the event/action
    
    -- Source
    source TEXT, -- 'workflow_engine', 'api', 'admin_dashboard', 'webhook'
    source_ip INET,
    
    -- Error Tracking
    is_error BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    error_stack TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage workflow events" ON workflow_events
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Users can view workflow events" ON workflow_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workflow_instances wi 
            WHERE wi.id = workflow_events.workflow_instance_id 
            AND (wi.created_by = auth.uid() OR wi.assigned_to = auth.uid())
        ) OR
        auth.jwt()->>'role' IN ('service_role', 'admin')
    );

-- Indexes
CREATE INDEX idx_workflow_events_instance ON workflow_events(workflow_instance_id);
CREATE INDEX idx_workflow_events_type ON workflow_events(event_type);
CREATE INDEX idx_workflow_events_created ON workflow_events(created_at DESC);
CREATE INDEX idx_workflow_events_actor ON workflow_events(actor_id) WHERE actor_id IS NOT NULL;

-- =============================================================================
-- SECTION 7: NOTIFICATION OUTBOX (Reliable Delivery Queue)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Notification Identity
    notification_type TEXT NOT NULL, -- 'email', 'sms', 'push', 'in_app', 'webhook'
    idempotency_key TEXT UNIQUE, -- Prevent duplicate sends
    
    -- Recipient
    recipient_type TEXT NOT NULL, -- 'user', 'email', 'phone', 'api'
    recipient_id UUID,
    recipient_address TEXT NOT NULL, -- email, phone, or webhook URL
    
    -- Content
    subject TEXT,
    body TEXT NOT NULL,
    html_body TEXT,
    template_id TEXT,
    template_data JSONB DEFAULT '{}',
    
    -- Priority & Scheduling
    priority INTEGER DEFAULT 5, -- 1-10, 1 being highest
    scheduled_for TIMESTAMPTZ, -- NULL = send immediately
    expires_at TIMESTAMPTZ,
    
    -- Delivery Status
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'queued', 'sent', 'delivered', 'failed', 'dead_letter'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ,
    
    -- Provider Tracking
    provider TEXT, -- 'sendgrid', 'twilio', 'fcm', 'supabase'
    provider_message_id TEXT, -- External provider's message ID
    provider_response JSONB, -- Full response from provider
    
    -- Error Handling
    error_code TEXT,
    error_message TEXT,
    error_details JSONB,
    dead_letter_reason TEXT,
    
    -- Context
    related_entity_type TEXT, -- 'enrollment', 'application', 'workflow'
    related_entity_id UUID,
    metadata JSONB DEFAULT '{}',
    
    -- Actor
    created_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage notifications" ON notification_outbox
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Indexes
CREATE INDEX idx_notification_outbox_status ON notification_outbox(status);
CREATE INDEX idx_notification_outbox_scheduled ON notification_outbox(scheduled_for) 
    WHERE status = 'pending' AND scheduled_for IS NOT NULL;
CREATE INDEX idx_notification_outbox_retry ON notification_outbox(next_attempt_at) 
    WHERE status = 'pending' AND next_attempt_at IS NOT NULL;
CREATE INDEX idx_notification_outbox_entity ON notification_outbox(related_entity_type, related_entity_id);
CREATE INDEX idx_notification_outbox_created ON notification_outbox(created_at DESC);
CREATE INDEX idx_notification_outbox_dead_letter ON notification_outbox(status) WHERE status = 'dead_letter';

-- =============================================================================
-- UPDATED_at TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_program_registry_updated_at BEFORE UPDATE ON program_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funding_rules_updated_at BEFORE UPDATE ON funding_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_verified_claims_updated_at BEFORE UPDATE ON verified_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_instances_updated_at BEFORE UPDATE ON workflow_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get active funding for a program
CREATE OR REPLACE FUNCTION get_active_funding_for_program(p_program_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    code TEXT,
    type TEXT,
    amount DECIMAL,
    percentage_covered DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fr.id,
        fr.name,
        fr.code,
        fr.type,
        fr.amount,
        fr.percentage_covered
    FROM funding_rules fr
    WHERE fr.program_registry_id = p_program_id
      AND fr.is_active = TRUE
      AND (fr.valid_until IS NULL OR fr.valid_until > NOW())
    ORDER BY fr.priority, fr.amount DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a claim is currently valid
CREATE OR REPLACE FUNCTION is_claim_valid(p_claim_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_claim verified_claims%ROWTYPE;
BEGIN
    SELECT * INTO v_claim
    FROM verified_claims
    WHERE claim_key = p_claim_key
      AND is_active = TRUE
      AND is_verified = TRUE
      AND display_on_website = TRUE
      AND (valid_until IS NULL OR valid_until > NOW())
    LIMIT 1;
    
    RETURN v_claim.id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current workflow state
CREATE OR REPLACE FUNCTION get_workflow_state(p_entity_type TEXT, p_entity_id UUID)
RETURNS TABLE (
    workflow_id UUID,
    current_state TEXT,
    status TEXT,
    progress_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wi.id,
        wi.current_state,
        wi.status,
        wi.progress_percentage
    FROM workflow_instances wi
    WHERE wi.entity_type = p_entity_type
      AND wi.entity_id = p_entity_id
      AND wi.status = 'active'
    ORDER BY wi.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
