-- Extend marketing_contacts for full CRM capture from /api/contact
-- Idempotent — safe to re-run in Supabase SQL Editor

ALTER TABLE public.marketing_contacts
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS program_interest text,
  ADD COLUMN IF NOT EXISTS contact_type text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Backfill display name from first/last where present
UPDATE public.marketing_contacts
SET name = trim(concat_ws(' ', first_name, last_name))
WHERE (name IS NULL OR name = '')
  AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Backfill updated_at from created_at before setting column default (avoids stamping all rows with migration time)
UPDATE public.marketing_contacts
SET updated_at = COALESCE(created_at, now())
WHERE updated_at IS NULL;

-- Repair prior draft that used ADD COLUMN ... DEFAULT now() (all existing rows stamped at migration time)
UPDATE public.marketing_contacts
SET updated_at = created_at
WHERE created_at IS NOT NULL
  AND updated_at IS NOT NULL
  AND updated_at > created_at + interval '1 day';

ALTER TABLE public.marketing_contacts
  ALTER COLUMN updated_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_email ON public.marketing_contacts (lower(email));

-- Drop misnamed/misindexed version if a prior draft was applied
DROP INDEX IF EXISTS public.idx_marketing_contacts_updated;

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_updated ON public.marketing_contacts (updated_at DESC);
