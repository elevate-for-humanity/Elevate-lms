-- Rollback for 20251228_add_scorm_tables.sql
-- Removes SCORM-related tables

DROP TABLE IF EXISTS scorm_attempts CASCADE;
DROP TABLE IF EXISTS scorm_packages CASCADE;
DROP TABLE IF EXISTS scorm_interactions CASCADE;
DROP TABLE IF EXISTS scorm_objectives CASCADE;

-- Remove any related functions
DROP FUNCTION IF EXISTS update_scorm_progress CASCADE;
DROP FUNCTION IF EXISTS calculate_scorm_completion CASCADE;
