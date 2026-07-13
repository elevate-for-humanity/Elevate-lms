-- The apprentices table was created without an updated_at column but the
-- update_apprentices_updated_at trigger references NEW.updated_at, causing
-- every UPDATE on apprentices to fail with "record new has no field updated_at".
-- Fix: add the column, then the trigger works as intended.

ALTER TABLE public.apprentices
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill existing rows
UPDATE public.apprentices SET updated_at = created_at WHERE updated_at = NOW() AND created_at IS NOT NULL;
