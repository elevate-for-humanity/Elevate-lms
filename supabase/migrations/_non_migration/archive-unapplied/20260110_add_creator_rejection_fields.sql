-- Add rejection and approval tracking fields to marketplace_creators
-- Migration: 20260110_add_creator_rejection_fields
-- Date: January 10, 2026
-- Purpose: Track who rejected/approved creators and when

-- Add rejection tracking fields
ALTER TABLE marketplace_creators
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);

-- Add approval tracking fields
ALTER TABLE marketplace_creators
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Add indexes for querying
CREATE INDEX IF NOT EXISTS idx_marketplace_creators_status 
  ON marketplace_creators(status);

CREATE INDEX IF NOT EXISTS idx_marketplace_creators_rejected_by 
  ON marketplace_creators(rejected_by);

CREATE INDEX IF NOT EXISTS idx_marketplace_creators_approved_by 
  ON marketplace_creators(approved_by);

-- Add comment
COMMENT ON COLUMN marketplace_creators.rejection_reason IS 'Reason provided when creator application was rejected';
COMMENT ON COLUMN marketplace_creators.rejected_at IS 'Timestamp when creator was rejected';
COMMENT ON COLUMN marketplace_creators.rejected_by IS 'Admin user who rejected the creator';
COMMENT ON COLUMN marketplace_creators.approved_at IS 'Timestamp when creator was approved';
COMMENT ON COLUMN marketplace_creators.approved_by IS 'Admin user who approved the creator';
