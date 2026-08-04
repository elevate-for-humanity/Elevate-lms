-- Migration: Create host_shop_match_requests table for self-service matching
-- Run at: 2026-08-03

BEGIN;

-- Create host_shop_match_requests table
CREATE TABLE IF NOT EXISTS host_shop_match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  apprentice_name TEXT,
  apprentice_email TEXT,
  apprentice_phone TEXT,
  host_shop_id UUID REFERENCES host_shops(id) ON DELETE CASCADE,
  program_slug TEXT DEFAULT 'barber-apprenticeship',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'withdrawn', 'expired')),
  message TEXT,
  apprentice_notes TEXT,
  shop_notes TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_match_requests_apprentice ON host_shop_match_requests(apprentice_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_match_requests_shop ON host_shop_match_requests(host_shop_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_match_requests_status ON host_shop_match_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_match_requests_created ON host_shop_match_requests(created_at DESC) WHERE deleted_at IS NULL;

-- RLS policies
ALTER TABLE host_shop_match_requests ENABLE ROW LEVEL SECURITY;

-- Apprentices can see their own requests
CREATE POLICY "apprentices_read_own" ON host_shop_match_requests
  FOR SELECT USING (
    apprentice_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Host shops can see requests for their shop
CREATE POLICY "shops_read_own" ON host_shop_match_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM host_shops 
      WHERE host_shops.id = host_shop_match_requests.host_shop_id 
      AND host_shops.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Apprentices can insert their own requests
CREATE POLICY "apprentices_insert_own" ON host_shop_match_requests
  FOR INSERT WITH CHECK (apprentice_id = auth.uid());

-- Shop owners and admins can update requests
CREATE POLICY "shops_update" ON host_shop_match_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM host_shops 
      WHERE host_shops.id = host_shop_match_requests.host_shop_id 
      AND host_shops.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_host_shop_match_requests_updated_at
  BEFORE UPDATE ON host_shop_match_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
