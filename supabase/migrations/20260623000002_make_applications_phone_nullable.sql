-- Make phone nullable in applications table
-- Addresses: null value in column "phone" violates not-null constraint

-- Make phone nullable to allow intake form submissions without phone
ALTER TABLE public.applications ALTER COLUMN phone DROP NOT NULL;

-- Set default to empty string for existing records
UPDATE public.applications SET phone = '' WHERE phone IS NULL;
