-- License Purchases Table
-- Tracks all license purchases from the store

CREATE TABLE IF NOT EXISTS license_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe info
  stripe_payment_intent_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  
  -- Product info
  product_id text NOT NULL,
  product_slug text NOT NULL,
  license_type text NOT NULL, -- single, school, enterprise
  
  -- Customer info
  organization_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  
  -- Purchase info
  amount integer NOT NULL, -- in cents
  status text DEFAULT 'pending', -- pending, paid, provisioned, failed
  
  -- Tenant info (set after provisioning)
  tenant_id uuid REFERENCES tenants(id),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  provisioned_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_license_purchases_stripe_payment_intent 
ON license_purchases(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_license_purchases_stripe_customer 
ON license_purchases(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_license_purchases_status 
ON license_purchases(status);

CREATE INDEX IF NOT EXISTS idx_license_purchases_tenant 
ON license_purchases(tenant_id);

CREATE INDEX IF NOT EXISTS idx_license_purchases_email 
ON license_purchases(contact_email);

-- RLS
ALTER TABLE license_purchases ENABLE ROW LEVEL SECURITY;

-- Admin can see all purchases
CREATE POLICY admin_view_all_purchases ON license_purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Customers can see their own purchases
CREATE POLICY customer_view_own_purchases ON license_purchases
FOR SELECT
TO authenticated
USING (contact_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_license_purchase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'provisioned' AND OLD.status != 'provisioned' THEN
    NEW.provisioned_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER license_purchase_updated_at
BEFORE UPDATE ON license_purchases
FOR EACH ROW
EXECUTE FUNCTION update_license_purchase_updated_at();

-- Comments
COMMENT ON TABLE license_purchases IS 'Tracks all platform license purchases from the store';
COMMENT ON COLUMN license_purchases.stripe_payment_intent_id IS 'Stripe PaymentIntent ID';
COMMENT ON COLUMN license_purchases.status IS 'Purchase status: pending (awaiting payment), paid (payment received), provisioned (tenant created), failed (payment failed)';
COMMENT ON COLUMN license_purchases.tenant_id IS 'Tenant created for this purchase (set after provisioning)';
