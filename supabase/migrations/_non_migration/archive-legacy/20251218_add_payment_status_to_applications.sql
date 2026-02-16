-- Add payment_status column to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Update status enum to include more states
ALTER TABLE applications 
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications 
ADD CONSTRAINT applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'contacted', 'accepted', 'pending_payment'));

-- Create index for payment_status
CREATE INDEX IF NOT EXISTS idx_applications_payment_status ON applications(payment_status);

-- Add stripe_session_id for tracking
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_applications_stripe_session ON applications(stripe_session_id);
