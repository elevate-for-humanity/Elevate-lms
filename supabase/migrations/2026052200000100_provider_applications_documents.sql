-- Add document upload columns and banking info to provider_applications
-- Apply in Supabase Dashboard → SQL Editor

ALTER TABLE public.provider_applications
  ADD COLUMN IF NOT EXISTS w9_file_url          TEXT,
  ADD COLUMN IF NOT EXISTS ein_doc_file_url      TEXT,
  ADD COLUMN IF NOT EXISTS certification_file_url TEXT,
  ADD COLUMN IF NOT EXISTS resume_file_url       TEXT,
  ADD COLUMN IF NOT EXISTS bank_name             TEXT,
  ADD COLUMN IF NOT EXISTS bank_routing_number   TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number   TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_type     TEXT CHECK (bank_account_type IN ('checking', 'savings')),
  ADD COLUMN IF NOT EXISTS quickbooks_connected  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quickbooks_company_id TEXT,
  ADD COLUMN IF NOT EXISTS payroll_provider      TEXT;
