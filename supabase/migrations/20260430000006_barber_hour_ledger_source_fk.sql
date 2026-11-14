-- SW-3: Link barber_hour_ledger (denormalized summary) back to its source entries.
-- Without this FK, corrections to apprentice_hours entries are not reflected in
-- the ledger and there is no audit trail from summary → source.
-- last_entry_id points to the most recent apprentice_hours row that updated the ledger.

ALTER TABLE public.barber_hour_ledger
  ADD COLUMN IF NOT EXISTS last_entry_id uuid REFERENCES public.apprentice_hours(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.barber_hour_ledger.last_entry_id IS
  'FK to the most recent apprentice_hours entry that updated this ledger row. Enables tracing summary totals back to source entries.';

CREATE INDEX IF NOT EXISTS idx_barber_hour_ledger_last_entry_id
  ON public.barber_hour_ledger (last_entry_id)
  WHERE last_entry_id IS NOT NULL;
