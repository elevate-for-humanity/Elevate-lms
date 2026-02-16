-- Drug Testing Orders Table
-- Tracks purchases from drug testing and training pages

CREATE TABLE IF NOT EXISTS drug_testing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product details
  product_name text NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('service', 'course')),
  category text NOT NULL,
  price numeric NOT NULL,
  
  -- Customer details
  customer_email text NOT NULL,
  customer_name text,
  customer_phone text,
  
  -- Payment details
  stripe_session_id text UNIQUE NOT NULL,
  stripe_payment_id text,
  
  -- Order status
  status text NOT NULL DEFAULT 'pending_contact' CHECK (status IN (
    'pending_contact',
    'contacted',
    'scheduled',
    'completed',
    'cancelled'
  )),
  
  -- Scheduling (for drug tests)
  scheduled_date timestamptz,
  collection_site text,
  
  -- Enrollment (for courses)
  enrolled_at timestamptz,
  course_access_url text,
  
  -- Notes
  notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  contacted_at timestamptz,
  completed_at timestamptz
);

-- Indexes
CREATE INDEX idx_drug_testing_orders_email ON drug_testing_orders(customer_email);
CREATE INDEX idx_drug_testing_orders_status ON drug_testing_orders(status);
CREATE INDEX idx_drug_testing_orders_type ON drug_testing_orders(product_type);
CREATE INDEX idx_drug_testing_orders_stripe_session ON drug_testing_orders(stripe_session_id);
CREATE INDEX idx_drug_testing_orders_created ON drug_testing_orders(created_at DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_drug_testing_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drug_testing_orders_updated_at
  BEFORE UPDATE ON drug_testing_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_drug_testing_orders_timestamp();

-- RLS Policies
ALTER TABLE drug_testing_orders ENABLE ROW LEVEL SECURITY;

-- Admins can view all orders
CREATE POLICY "Admins can view all drug testing orders"
  ON drug_testing_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update orders
CREATE POLICY "Admins can update drug testing orders"
  ON drug_testing_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- System can insert orders (from webhook)
CREATE POLICY "System can insert drug testing orders"
  ON drug_testing_orders FOR INSERT
  WITH CHECK (true);

-- Completion message
DO $$
BEGIN
  RAISE NOTICE '✅ Drug testing orders table created';
  RAISE NOTICE '   - Tracks purchases from drug testing and training pages';
  RAISE NOTICE '   - Integrates with Stripe webhook';
  RAISE NOTICE '   - RLS policies enabled';
END $$;
