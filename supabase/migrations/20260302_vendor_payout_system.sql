-- Vendor Payout System
-- Tracks payments to partner course vendors after student purchases.
-- Margin stays in Elevate's Stripe account.

-- vendor_payouts: records each vendor payment or payable
CREATE TABLE IF NOT EXISTS vendor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL,
  course_id text NOT NULL,
  provider_id uuid NOT NULL,
  provider_name text NOT NULL,
  student_id uuid NOT NULL,
  wholesale_cost_cents integer NOT NULL,
  retail_price_cents integer NOT NULL,
  margin_cents integer NOT NULL,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  payout_method text NOT NULL CHECK (payout_method IN ('stripe_transfer', 'recorded_payable', 'prepaid_license')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, provider_id)
);

-- Index for reconciliation queries
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON vendor_payouts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_provider ON vendor_payouts(provider_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_created ON vendor_payouts(created_at);

-- credential_delivery_queue: manual queue for failed automated deliveries
CREATE TABLE IF NOT EXISTS credential_delivery_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL,
  course_id text NOT NULL,
  course_name text NOT NULL,
  provider_id uuid NOT NULL,
  provider_name text NOT NULL,
  student_id uuid NOT NULL,
  student_email text NOT NULL,
  student_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  assigned_to uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_credential_queue_status ON credential_delivery_queue(status);

-- Add stripe_connect_account_id to partner_lms_providers if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_lms_providers'
    AND column_name = 'stripe_connect_account_id'
  ) THEN
    ALTER TABLE partner_lms_providers ADD COLUMN stripe_connect_account_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partner_lms_providers'
    AND column_name = 'payout_method'
  ) THEN
    ALTER TABLE partner_lms_providers ADD COLUMN payout_method text DEFAULT 'recorded_payable';
  END IF;
END $$;

-- RLS: vendor_payouts readable by admins only
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS vendor_payouts_admin_read ON vendor_payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

ALTER TABLE credential_delivery_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS credential_queue_admin_read ON credential_delivery_queue
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
