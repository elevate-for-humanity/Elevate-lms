-- ============================================================================
-- ARCHIVE FSSA TABLES (Indiana State)
-- Created: July 7, 2026
-- Purpose: Archive FSSA-related tables for future use
-- ============================================================================

-- Create FSSA schema for archived tables
CREATE SCHEMA IF NOT EXISTS fssa_archive;

-- Move FSSA tables to archive schema
ALTER TABLE fssa_attendance SET SCHEMA fssa_archive;
ALTER TABLE fssa_budget SET SCHEMA fssa_archive;
ALTER TABLE fssa_participants SET SCHEMA fssa_archive;
ALTER TABLE fssa_program_components SET SCHEMA fssa_archive;

-- Move Indiana state tables to archive schema
ALTER TABLE indiana_alerts_sent SET SCHEMA fssa_archive;
ALTER TABLE indiana_enforcement_actions SET SCHEMA fssa_archive;
ALTER TABLE indiana_hour_categories SET SCHEMA fssa_archive;
ALTER TABLE indiana_timeclock_daily_export SET SCHEMA fssa_archive;
ALTER TABLE indiana_timeclock_weekly_summary_export SET SCHEMA fssa_archive;

-- Add archived flag
ALTER TABLE fssa_archive.fssa_attendance ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE fssa_archive.fssa_budget ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE fssa_archive.fssa_participants ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE fssa_archive.fssa_program_components ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NOW();
