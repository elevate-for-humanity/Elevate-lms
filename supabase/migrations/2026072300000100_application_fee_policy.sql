-- Application Fee Policy Migration
-- Adds payment_type column to distinguish program vs host shop fees

-- Add payment_type column to application_payments
ALTER TABLE application_payments 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'program_fee'
CHECK (payment_type IN ('program_fee', 'host_shop_fee'));

-- Add comment
COMMENT ON COLUMN application_payments.payment_type IS 'Type of application fee: program_fee ($15 for programs) or host_shop_fee ($15 for host shops)';

-- Add index for payment type queries
CREATE INDEX IF NOT EXISTS idx_application_payments_type ON application_payments(payment_type);

-- Add index for fee reporting
CREATE INDEX IF NOT EXISTS idx_application_payments_date_amount 
ON application_payments(paid_at, amount_cents) 
WHERE status = 'completed';
