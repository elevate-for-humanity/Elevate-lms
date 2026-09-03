-- ============================================================================
-- EXPORT TABLES FOR OTHER REPOS
-- Created: July 7, 2026
-- Purpose: Move tables to export schemas for other repositories
-- ============================================================================

-- ============================================================================
-- JTI (Job Ready Indy) - SCORM tables
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS jti_export;

ALTER TABLE scorm_completion_summary SET SCHEMA jti_export;
ALTER TABLE scorm_progress SET SCHEMA jti_export;
ALTER TABLE scorm_registrations SET SCHEMA jti_export;
ALTER TABLE scorm_sessions SET SCHEMA jti_export;
ALTER TABLE scorm_state SET SCHEMA jti_export;

ALTER TABLE jti_export.scorm_completion_summary ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE jti_export.scorm_progress ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE jti_export.scorm_registrations ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE jti_export.scorm_sessions ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE jti_export.scorm_state ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- APPP (Apprenticeship for Grants) - SAM tables
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS appp_export;

ALTER TABLE sam_alerts SET SCHEMA appp_export;
ALTER TABLE sam_documents SET SCHEMA appp_export;
ALTER TABLE sam_entities SET SCHEMA appp_export;

ALTER TABLE appp_export.sam_alerts ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE appp_export.sam_documents ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE appp_export.sam_entities ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- STARTER REPO - VITA, Volunteer, Supersonic
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS starter_export;

-- VITA tables
ALTER TABLE vita_appointments SET SCHEMA starter_export;

-- Volunteer tables
ALTER TABLE volunteer_opportunities SET SCHEMA starter_export;
ALTER TABLE volunteers SET SCHEMA starter_export;

-- Supersonic tables
ALTER TABLE supersonic_applications SET SCHEMA starter_export;
ALTER TABLE supersonic_appointments SET SCHEMA starter_export;
ALTER TABLE supersonic_careers SET SCHEMA starter_export;
ALTER TABLE supersonic_tax_documents SET SCHEMA starter_export;
ALTER TABLE supersonic_training_keys SET SCHEMA starter_export;

-- Shared tables
ALTER TABLE org_invitations SET SCHEMA starter_export;
ALTER TABLE tenant_invitations SET SCHEMA starter_export;

ALTER TABLE starter_export.vita_appointments ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE starter_export.volunteer_opportunities ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE starter_export.volunteers ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE starter_export.supersonic_applications ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE starter_export.supersonic_appointments ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE starter_export.supersonic_careers ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE starter_export.supersonic_tax_documents ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE starter_export.supersonic_training_keys ADD COLUMN exported_at TIMESTAMPTZ DEFAULT NOW();
