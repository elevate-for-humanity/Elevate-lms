-- ================================================================
-- PHASE 4: INDEXES
-- Run after Phase 1. All use IF NOT EXISTS — safe to re-run.
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
