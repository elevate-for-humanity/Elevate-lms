-- ============================================================================
-- STORE SUBSCRIPTIONS - LANE B (Separate from Enrollment Payments)
-- ============================================================================
-- Handles recurring subscription billing for store features
-- NEVER touches enrollment status or tuition payments
-- ============================================================================

-- ============================================================================
-- STEP 1: STORE PRODUCTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stripe_product_id TEXT UNIQUE NOT NULL,
  is_subscription BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  features JSONB, -- Array of feature descriptions
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_products_stripe_id ON store_products(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_store_products_active ON store_products(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE store_products IS 'Store subscription products (Pro, VIP, Wholesale, etc.)';
COMMENT ON COLUMN store_products.is_subscription IS 'TRUE for recurring subscriptions, FALSE for one-time purchases';

-- ============================================================================
-- STEP 2: STORE PRICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS store_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_product_id UUID NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  stripe_price_id TEXT UNIQUE NOT NULL,
  interval TEXT CHECK (interval IN ('month', 'year', 'one_time')),
  interval_count INTEGER DEFAULT 1,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  is_active BOOLEAN DEFAULT TRUE,
  trial_period_days INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_prices_product ON store_prices(store_product_id);
CREATE INDEX IF NOT EXISTS idx_store_prices_stripe_id ON store_prices(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_store_prices_active ON store_prices(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE store_prices IS 'Pricing options for store products (monthly, yearly, etc.)';
COMMENT ON COLUMN store_prices.interval IS 'Billing interval: month, year, or one_time';

-- ============================================================================
-- STEP 3: CUSTOMER BILLING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_billing_user ON customer_billing(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_billing_stripe ON customer_billing(stripe_customer_id);

COMMENT ON TABLE customer_billing IS 'Maps users to Stripe customers for subscription billing';

-- Enable RLS
ALTER TABLE customer_billing ENABLE ROW LEVEL SECURITY;

-- Users can view their own billing info
DROP POLICY IF EXISTS "users_view_own_billing" ON customer_billing;
CREATE POLICY "users_view_own_billing"
  ON customer_billing
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all billing
DROP POLICY IF EXISTS "admins_view_all_billing" ON customer_billing;
CREATE POLICY "admins_view_all_billing"
  ON customer_billing
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================================
-- STEP 4: STORE SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS store_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL REFERENCES store_prices(stripe_price_id),
  store_product_id UUID NOT NULL REFERENCES store_products(id),
  status TEXT NOT NULL CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_subscriptions_user ON store_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_stripe_id ON store_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_status ON store_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_product ON store_subscriptions(store_product_id);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_active ON store_subscriptions(user_id, status) WHERE status IN ('trialing', 'active');

COMMENT ON TABLE store_subscriptions IS 'Active and historical store subscriptions';
COMMENT ON COLUMN store_subscriptions.status IS 'Stripe subscription status - drives entitlements';

-- Enable RLS
ALTER TABLE store_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
DROP POLICY IF EXISTS "users_view_own_subscriptions" ON store_subscriptions;
CREATE POLICY "users_view_own_subscriptions"
  ON store_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all subscriptions
DROP POLICY IF EXISTS "admins_view_all_subscriptions" ON store_subscriptions;
CREATE POLICY "admins_view_all_subscriptions"
  ON store_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================================
-- STEP 5: STORE ENTITLEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS store_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_key TEXT NOT NULL, -- 'store_pro', 'vip_shipping', 'wholesale_access', 'priority_support'
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT NOT NULL DEFAULT 'stripe_subscription', -- 'stripe_subscription', 'manual_grant', 'promotion'
  source_id UUID, -- References store_subscriptions.id or other source
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entitlement_key)
);

CREATE INDEX IF NOT EXISTS idx_store_entitlements_user ON store_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_store_entitlements_key ON store_entitlements(entitlement_key);
CREATE INDEX IF NOT EXISTS idx_store_entitlements_active ON store_entitlements(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_store_entitlements_expires ON store_entitlements(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE store_entitlements IS 'User access rights to store features';
COMMENT ON COLUMN store_entitlements.entitlement_key IS 'Feature identifier (store_pro, vip_shipping, wholesale_access, etc.)';
COMMENT ON COLUMN store_entitlements.source IS 'How entitlement was granted';

-- Enable RLS
ALTER TABLE store_entitlements ENABLE ROW LEVEL SECURITY;

-- Users can view their own entitlements
DROP POLICY IF EXISTS "users_view_own_entitlements" ON store_entitlements;
CREATE POLICY "users_view_own_entitlements"
  ON store_entitlements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all entitlements
DROP POLICY IF EXISTS "admins_manage_entitlements" ON store_entitlements;
CREATE POLICY "admins_manage_entitlements"
  ON store_entitlements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================================
-- STEP 6: SUBSCRIPTION EVENTS TABLE (AUDIT LOG)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES store_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'updated', 'canceled', 'payment_succeeded', 'payment_failed'
  stripe_event_id TEXT,
  from_status TEXT,
  to_status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe ON subscription_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscription_events_created ON subscription_events(created_at DESC);

COMMENT ON TABLE subscription_events IS 'Audit log of all subscription lifecycle events';

-- Enable RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription events
DROP POLICY IF EXISTS "users_view_own_subscription_events" ON subscription_events;
CREATE POLICY "users_view_own_subscription_events"
  ON subscription_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all subscription events
DROP POLICY IF EXISTS "admins_view_all_subscription_events" ON subscription_events;
CREATE POLICY "admins_view_all_subscription_events"
  ON subscription_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================================
-- STEP 7: UPSERT SUBSCRIPTION FUNCTION (WEBHOOK HANDLER)
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_store_subscription(
  p_user_id UUID,
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT,
  p_stripe_price_id TEXT,
  p_status TEXT,
  p_cancel_at_period_end BOOLEAN,
  p_current_period_start TIMESTAMPTZ,
  p_current_period_end TIMESTAMPTZ,
  p_canceled_at TIMESTAMPTZ DEFAULT NULL,
  p_ended_at TIMESTAMPTZ DEFAULT NULL,
  p_trial_start TIMESTAMPTZ DEFAULT NULL,
  p_trial_end TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id UUID;
  v_product_id UUID;
  v_old_status TEXT;
BEGIN
  -- Get product_id from price
  SELECT store_product_id INTO v_product_id
  FROM store_prices
  WHERE stripe_price_id = p_stripe_price_id;

  IF v_product_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Price not found in store_prices table'
    );
  END IF;

  -- Get old status if exists
  SELECT status INTO v_old_status
  FROM store_subscriptions
  WHERE stripe_subscription_id = p_stripe_subscription_id;

  -- Upsert subscription
  INSERT INTO store_subscriptions (
    user_id,
    stripe_subscription_id,
    stripe_customer_id,
    stripe_price_id,
    store_product_id,
    status,
    cancel_at_period_end,
    current_period_start,
    current_period_end,
    canceled_at,
    ended_at,
    trial_start,
    trial_end,
    metadata
  ) VALUES (
    p_user_id,
    p_stripe_subscription_id,
    p_stripe_customer_id,
    p_stripe_price_id,
    v_product_id,
    p_status,
    p_cancel_at_period_end,
    p_current_period_start,
    p_current_period_end,
    p_canceled_at,
    p_ended_at,
    p_trial_start,
    p_trial_end,
    p_metadata
  )
  ON CONFLICT (stripe_subscription_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    canceled_at = EXCLUDED.canceled_at,
    ended_at = EXCLUDED.ended_at,
    trial_start = EXCLUDED.trial_start,
    trial_end = EXCLUDED.trial_end,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;

  -- Log event if status changed
  IF v_old_status IS NULL OR v_old_status != p_status THEN
    INSERT INTO subscription_events (
      subscription_id,
      user_id,
      event_type,
      from_status,
      to_status,
      metadata
    ) VALUES (
      v_subscription_id,
      p_user_id,
      'status_changed',
      v_old_status,
      p_status,
      jsonb_build_object(
        'stripe_subscription_id', p_stripe_subscription_id,
        'cancel_at_period_end', p_cancel_at_period_end
      )
    );
  END IF;

  -- Update entitlements based on status
  PERFORM sync_subscription_entitlements(v_subscription_id);

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'status', p_status
  );
END;
$$;

COMMENT ON FUNCTION upsert_store_subscription IS 'Creates or updates subscription from Stripe webhook';

-- ============================================================================
-- STEP 8: SYNC ENTITLEMENTS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_subscription_entitlements(p_subscription_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription RECORD;
  v_product RECORD;
  v_entitlement_keys TEXT[];
  v_key TEXT;
  v_is_active BOOLEAN;
BEGIN
  -- Get subscription details
  SELECT * INTO v_subscription
  FROM store_subscriptions
  WHERE id = p_subscription_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Get product details
  SELECT * INTO v_product
  FROM store_products
  WHERE id = v_subscription.store_product_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Determine if subscription grants active entitlements
  v_is_active := v_subscription.status IN ('trialing', 'active');

  -- Get entitlement keys from product metadata
  -- Expected format: {"entitlements": ["store_pro", "vip_shipping"]}
  IF v_product.metadata ? 'entitlements' THEN
    v_entitlement_keys := ARRAY(
      SELECT jsonb_array_elements_text(v_product.metadata->'entitlements')
    );
  ELSE
    -- Default entitlement based on product name
    v_entitlement_keys := ARRAY[lower(replace(v_product.name, ' ', '_'))];
  END IF;

  -- Upsert entitlements
  FOREACH v_key IN ARRAY v_entitlement_keys
  LOOP
    INSERT INTO store_entitlements (
      user_id,
      entitlement_key,
      is_active,
      source,
      source_id,
      expires_at
    ) VALUES (
      v_subscription.user_id,
      v_key,
      v_is_active,
      'stripe_subscription',
      p_subscription_id,
      CASE 
        WHEN v_is_active THEN NULL
        ELSE v_subscription.current_period_end
      END
    )
    ON CONFLICT (user_id, entitlement_key)
    DO UPDATE SET
      is_active = EXCLUDED.is_active,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW();
  END LOOP;
END;
$$;

COMMENT ON FUNCTION sync_subscription_entitlements IS 'Updates user entitlements based on subscription status';

-- ============================================================================
-- STEP 9: CHECK ENTITLEMENT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION has_entitlement(
  p_user_id UUID,
  p_entitlement_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_entitlement BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM store_entitlements
    WHERE user_id = p_user_id
    AND entitlement_key = p_entitlement_key
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_has_entitlement;

  RETURN v_has_entitlement;
END;
$$;

COMMENT ON FUNCTION has_entitlement IS 'Check if user has active entitlement';

-- ============================================================================
-- STEP 10: HELPER VIEWS
-- ============================================================================

-- View: Active subscriptions with product details
CREATE OR REPLACE VIEW active_store_subscriptions AS
SELECT 
  s.id,
  s.user_id,
  s.stripe_subscription_id,
  s.status,
  s.cancel_at_period_end,
  s.current_period_end,
  p.name as product_name,
  pr.amount_cents,
  pr.interval,
  u.email as user_email,
  u.full_name as user_name
FROM store_subscriptions s
JOIN store_products p ON p.id = s.store_product_id
JOIN store_prices pr ON pr.stripe_price_id = s.stripe_price_id
JOIN auth.users u ON u.id = s.user_id
WHERE s.status IN ('trialing', 'active');

COMMENT ON VIEW active_store_subscriptions IS 'Currently active store subscriptions';

-- View: User entitlements summary
CREATE OR REPLACE VIEW user_entitlements_summary AS
SELECT 
  e.user_id,
  e.entitlement_key,
  e.is_active,
  e.source,
  e.expires_at,
  s.status as subscription_status,
  s.current_period_end as subscription_period_end,
  p.name as product_name
FROM store_entitlements e
LEFT JOIN store_subscriptions s ON s.id = e.source_id AND e.source = 'stripe_subscription'
LEFT JOIN store_products p ON p.id = s.store_product_id
WHERE e.is_active = TRUE;

COMMENT ON VIEW user_entitlements_summary IS 'Active user entitlements with source details';

-- ============================================================================
-- STEP 11: AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_store_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_store_products_timestamp ON store_products;
CREATE TRIGGER trigger_update_store_products_timestamp
  BEFORE UPDATE ON store_products
  FOR EACH ROW
  EXECUTE FUNCTION update_store_timestamp();

DROP TRIGGER IF EXISTS trigger_update_store_prices_timestamp ON store_prices;
CREATE TRIGGER trigger_update_store_prices_timestamp
  BEFORE UPDATE ON store_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_store_timestamp();

DROP TRIGGER IF EXISTS trigger_update_customer_billing_timestamp ON customer_billing;
CREATE TRIGGER trigger_update_customer_billing_timestamp
  BEFORE UPDATE ON customer_billing
  FOR EACH ROW
  EXECUTE FUNCTION update_store_timestamp();

DROP TRIGGER IF EXISTS trigger_update_store_subscriptions_timestamp ON store_subscriptions;
CREATE TRIGGER trigger_update_store_subscriptions_timestamp
  BEFORE UPDATE ON store_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_store_timestamp();

DROP TRIGGER IF EXISTS trigger_update_store_entitlements_timestamp ON store_entitlements;
CREATE TRIGGER trigger_update_store_entitlements_timestamp
  BEFORE UPDATE ON store_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_store_timestamp();

-- ============================================================================
-- STEP 12: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON active_store_subscriptions TO authenticated;
GRANT SELECT ON user_entitlements_summary TO authenticated;
GRANT EXECUTE ON FUNCTION has_entitlement TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_store_subscription TO service_role;
GRANT EXECUTE ON FUNCTION sync_subscription_entitlements TO service_role;

-- ============================================================================
-- DONE - Store subscriptions system ready
-- ============================================================================
