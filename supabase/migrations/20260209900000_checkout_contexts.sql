-- Checkout Contexts: Server-side storage for checkout metadata
-- Prevents tampering via URL params and keeps sensitive data out of logs

CREATE TABLE IF NOT EXISTS checkout_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider info
  provider TEXT NOT NULL, -- 'affirm', 'sezzle', 'stripe'
  order_id TEXT, -- Provider-specific order ID (e.g., EFH-AFFIRM-xxx)
  
  -- Customer info (stored server-side, not in URL)
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  
  -- Program info
  program_slug TEXT NOT NULL,
  application_id TEXT,
  
  -- Barber-specific metadata
  transfer_hours INTEGER DEFAULT 0,
  hours_per_week INTEGER DEFAULT 40,
  has_host_shop TEXT,
  host_shop_name TEXT,
  
  -- Payment info
  amount_cents INTEGER NOT NULL,
  payment_type TEXT, -- 'payment_plan', 'pay_in_full', 'bnpl'
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'expired', 'failed'
  completed_at TIMESTAMPTZ,
  
  -- Provider response data (stored after capture)
  provider_charge_id TEXT,
  provider_response JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
  
  -- Indexes
  CONSTRAINT checkout_contexts_provider_order_unique UNIQUE (provider, order_id)
);

-- Indexes for lookups
ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS order_id TEXT;
CREATE INDEX IF NOT EXISTS idx_checkout_contexts_order_id ON checkout_contexts(order_id);
ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_checkout_contexts_status ON checkout_contexts(status);
ALTER TABLE checkout_contexts ADD COLUMN IF NOT EXISTS expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_checkout_contexts_expires ON checkout_contexts(expires_at);

-- RLS
ALTER TABLE checkout_contexts ENABLE ROW LEVEL SECURITY;

-- Service role full access (for API routes)
DROP POLICY IF EXISTS "Service role full access on checkout_contexts" ON checkout_contexts;
CREATE POLICY "Service role full access on checkout_contexts"
  ON checkout_contexts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Cleanup job: delete expired contexts older than 7 days
-- Run via cron: DELETE FROM checkout_contexts WHERE expires_at < NOW() - INTERVAL '7 days';
