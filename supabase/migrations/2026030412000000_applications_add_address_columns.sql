-- Add address and demographic columns to applications table
-- Required by barber apprenticeship apply route
ALTER TABLE applications ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS zip_code text;
