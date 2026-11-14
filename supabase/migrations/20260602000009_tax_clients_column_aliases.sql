-- tax_clients: add missing columns referenced by app code.
--
-- Live has: id, first_name, last_name, email, phone, ssn_last4, preparer_id,
--           tenant_id, created_at, ssn_hash, user_id, office_id, ssn_last_four,
--           preparation_fee, refund_amount, firm_id, dob
--
-- App code (app/api/tax/file-return/route.ts) writes:
--   date_of_birth, address_street, address_city, address_state, address_zip
-- None of these exist in live. Adding them so writes do not silently fail.
--
-- date_of_birth: live has `dob`. Adding date_of_birth as a separate column
-- (not a generated alias — Postgres doesn't support generated columns as aliases).
-- Both will be populated; a future cleanup migration can consolidate.

ALTER TABLE public.tax_clients
  ADD COLUMN IF NOT EXISTS date_of_birth  DATE,
  ADD COLUMN IF NOT EXISTS address_street TEXT,
  ADD COLUMN IF NOT EXISTS address_city   TEXT,
  ADD COLUMN IF NOT EXISTS address_state  TEXT,
  ADD COLUMN IF NOT EXISTS address_zip    TEXT,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT now();

-- Backfill date_of_birth from dob for existing rows
UPDATE public.tax_clients
SET date_of_birth = dob
WHERE date_of_birth IS NULL AND dob IS NOT NULL;
