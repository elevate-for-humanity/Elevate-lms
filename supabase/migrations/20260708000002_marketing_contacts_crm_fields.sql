-- Extend marketing_contacts for full CRM capture from /api/contact
-- Idempotent — safe to re-run in Supabase SQL Editor

ALTER TABLE public.marketing_contacts
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS program_interest text,
  ADD COLUMN IF NOT EXISTS contact_type text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS name text;

-- Backfill display name from first/last where present
UPDATE public.marketing_contacts
SET name = trim(concat_ws(' ', first_name, last_name))
WHERE (name IS NULL OR name = '')
  AND (first_name IS NOT NULL OR last_name IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_email ON public.marketing_contacts (lower(email));
CREATE INDEX IF NOT EXISTS idx_marketing_contacts_updated ON public.marketing_contacts (created_at DESC);
