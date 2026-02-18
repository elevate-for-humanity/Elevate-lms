-- ================================================================
-- PHASE 4: ADD MISSING COLUMNS + INDEXES
-- Pre-existing tables have different schemas than Phase 1 definitions.
-- Phase 1 CREATE TABLE IF NOT EXISTS was a no-op for these.
-- ================================================================

-- onboarding_progress: has (id, user_id, is_complete, completed_at, current_step, created_at, updated_at)
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS agreements_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS agreements_completed_at TIMESTAMPTZ;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS handbook_acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS handbook_acknowledged_at TIMESTAMPTZ;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS documents_uploaded BOOLEAN DEFAULT FALSE;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS documents_uploaded_at TIMESTAMPTZ;
ALTER TABLE onboarding_progress ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started';

-- automated_decisions: has (id, override_reason, input_snapshot, created_at)
ALTER TABLE automated_decisions ADD COLUMN IF NOT EXISTS decision_type TEXT;
ALTER TABLE automated_decisions ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE automated_decisions ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE automated_decisions ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE automated_decisions ADD COLUMN IF NOT EXISTS confidence DECIMAL(5,4);
ALTER TABLE automated_decisions ADD COLUMN IF NOT EXISTS reasoning JSONB DEFAULT '{}';
ALTER TABLE automated_decisions ADD COLUMN IF NOT EXISTS rules_applied JSONB DEFAULT '[]';
ALTER TABLE automated_decisions ADD COLUMN IF NOT EXISTS override_by UUID;
ALTER TABLE automated_decisions ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- review_queue: has (id, status, priority, assigned_to, created_at, updated_at)
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS review_type TEXT;
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS ai_recommendation JSONB DEFAULT '{}';
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(5,4);
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS human_decision TEXT;
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS human_notes TEXT;
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS decided_by UUID;
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;

-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_laa_user_id ON license_agreement_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_laa_agreement_type ON license_agreement_acceptances(agreement_type);
CREATE INDEX IF NOT EXISTS idx_laa_accepted_at ON license_agreement_acceptances(accepted_at);
CREATE INDEX IF NOT EXISTS idx_laa_org ON license_agreement_acceptances(organization_id);

CREATE INDEX IF NOT EXISTS idx_av_type ON agreement_versions(agreement_type);
CREATE INDEX IF NOT EXISTS idx_av_effective ON agreement_versions(effective_date);

CREATE INDEX IF NOT EXISTS idx_op_user ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_op_status ON onboarding_progress(status);

CREATE INDEX IF NOT EXISTS idx_ha_user ON handbook_acknowledgments(user_id);

CREATE INDEX IF NOT EXISTS idx_cal_user ON compliance_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_cal_event ON compliance_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_cal_timestamp ON compliance_audit_log(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_cal_tenant ON compliance_audit_log(tenant_id);

CREATE INDEX IF NOT EXISTS idx_automated_decisions_entity ON automated_decisions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_automated_decisions_type ON automated_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_automated_decisions_outcome ON automated_decisions(outcome);
CREATE INDEX IF NOT EXISTS idx_automated_decisions_created ON automated_decisions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_priority ON review_queue(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_review_queue_entity ON review_queue(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_assigned ON review_queue(assigned_to) WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shop_recommendations_app ON shop_recommendations(application_id);
CREATE INDEX IF NOT EXISTS idx_shop_recommendations_shop ON shop_recommendations(shop_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_recommendations_unique ON shop_recommendations(application_id, shop_id);
