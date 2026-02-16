-- Add delivery_mode to programs table
-- Allowed values: 'internal' | 'partner' | 'hybrid'
-- Nullable - code will infer from enrollment source if not set

ALTER TABLE programs 
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT;

-- Add check constraint for valid values
ALTER TABLE programs 
  DROP CONSTRAINT IF EXISTS programs_delivery_mode_check;

ALTER TABLE programs 
  ADD CONSTRAINT programs_delivery_mode_check 
  CHECK (delivery_mode IS NULL OR delivery_mode IN ('internal', 'partner', 'hybrid'));

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_programs_delivery_mode ON programs(delivery_mode);

COMMENT ON COLUMN programs.delivery_mode IS 'Learning delivery mode: internal (Elevate LMS), partner (external provider), hybrid (mixed)';
