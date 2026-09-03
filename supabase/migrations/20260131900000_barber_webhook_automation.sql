-- Barber Webhook Automation: Create barber_subscriptions table and add tracking fields
-- Ensures idempotent email sending and proper record linking

-- 1. Create barber_subscriptions table (stores Stripe subscription details for barber program)
CREATE TABLE IF NOT EXISTS barber_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  enrollment_id UUID,
  apprentice_id UUID,
  
  -- Stripe identifiers
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT,
  
  -- Customer info
  customer_email TEXT,
  customer_name TEXT,
  
  -- Subscription status
  status TEXT DEFAULT 'active',
  
  -- Payment details
  setup_fee_paid BOOLEAN DEFAULT false,
  setup_fee_amount INTEGER,
  weekly_payment_cents INTEGER,
  weeks_remaining INTEGER,
  hours_per_week INTEGER DEFAULT 40,
  transferred_hours_verified INTEGER DEFAULT 0,
  
  -- Billing dates
  billing_cycle_anchor TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Email tracking (for idempotency)
  welcome_email_sent_at TIMESTAMPTZ,
  milady_email_sent_at TIMESTAMPTZ,
  dashboard_invite_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns to apprentices for reverse lookup
ALTER TABLE apprentices
ADD COLUMN IF NOT EXISTS barber_subscription_id UUID,
ADD COLUMN IF NOT EXISTS mou_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dashboard_invite_sent_at TIMESTAMPTZ;

-- 3. Indexes for fast lookups
ALTER TABLE barber_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_barber_subscriptions_user_id ON barber_subscriptions(user_id);
ALTER TABLE barber_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
CREATE INDEX IF NOT EXISTS idx_barber_subscriptions_stripe_sub ON barber_subscriptions(stripe_subscription_id);
ALTER TABLE apprentices ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_apprentices_user_id ON apprentices(user_id);

-- 4. Enable RLS
ALTER TABLE barber_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON barber_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON barber_subscriptions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access" ON barber_subscriptions;
CREATE POLICY "Service role full access"
  ON barber_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
