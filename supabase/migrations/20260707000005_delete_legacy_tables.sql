-- ============================================================================
-- DELETE LEGACY TABLES (Not used, deprecated, or going to other repos)
-- Created: July 7, 2026
-- Purpose: Clean up tables not used in Elevate LMS
-- NOTE: CMI tables are KEEP - they are referenced in code
-- ============================================================================

-- ============================================================================
-- DELETE: Milady RISE - Not used
-- ============================================================================
DROP TABLE IF EXISTS milady_access;
DROP TABLE IF EXISTS milady_email_logs;
DROP TABLE IF EXISTS milady_enrollments;
DROP TABLE IF EXISTS milady_license_codes;
DROP TABLE IF EXISTS milady_orientation_status;
DROP TABLE IF EXISTS milady_provisioning_queue;
DROP TABLE IF EXISTS milady_rise_enrollments;

-- ============================================================================
-- DELETE: COBRA - Not built
-- ============================================================================
DROP TABLE IF EXISTS cobra_enrollments;

-- ============================================================================
-- DELETE: Franchise - Not built
-- ============================================================================
DROP TABLE IF EXISTS franchises;

-- ============================================================================
-- DELETE: Cross-tenant access - Not built
-- ============================================================================
DROP TABLE IF EXISTS cross_tenant_access;

-- ============================================================================
-- DELETE: ECR - Not built
-- ============================================================================
DROP TABLE IF EXISTS ecr_snapshots;
DROP TABLE IF EXISTS ecr_sync_logs;

-- ============================================================================
-- DELETE: SAP - Not built
-- ============================================================================
DROP TABLE IF EXISTS sap_records;

-- ============================================================================
-- DELETE: Scraper detection - Not used
-- ============================================================================
DROP TABLE IF EXISTS scraper_detection_events;
DROP TABLE IF EXISTS snap_outreach_log;

-- ============================================================================
-- DELETE: Academic integrity - Not built
-- ============================================================================
DROP TABLE IF EXISTS academic_integrity_violations;

-- ============================================================================
-- DELETE: Ambient music - Not built
-- ============================================================================
DROP TABLE IF EXISTS ambient_music_log;

-- ============================================================================
-- DELETE: App screenshots - Not used
-- ============================================================================
DROP TABLE IF EXISTS app_screenshot_views;

-- ============================================================================
-- DELETE: Captcha - Use Cloudflare
-- ============================================================================
DROP TABLE IF EXISTS captcha_attempts;

-- ============================================================================
-- DELETE: Curvature reviews - Not used
-- ============================================================================
DROP TABLE IF EXISTS curvature_reviews;

-- ============================================================================
-- DELETE: Affliates - Not built
-- ============================================================================
DROP TABLE IF EXISTS affiliate_applications;
DROP TABLE IF EXISTS affiliate_payouts;
DROP TABLE IF EXISTS affiliates;

-- ============================================================================
-- DELETE: Accreditation - Not built
-- ============================================================================
DROP TABLE IF EXISTS accreditation_evidence;
DROP TABLE IF EXISTS accreditation_records;
DROP TABLE IF EXISTS accreditation_reviews;
DROP TABLE IF EXISTS accreditation_standards;
DROP TABLE IF EXISTS accreditations;

-- ============================================================================
-- DELETE: JRI - Not built
-- ============================================================================
DROP TABLE IF EXISTS jri_participants;
