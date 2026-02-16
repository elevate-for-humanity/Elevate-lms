-- ============================================================================
-- Trial System Tables
-- Adds columns and tables needed by /api/trial/start-managed
-- ============================================================================

-- BATCH 1: Add missing columns to organizations
-- The trial API inserts slug and status, which don't exist on the table.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'inactive'));

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_contact_email ON organizations(contact_email);
