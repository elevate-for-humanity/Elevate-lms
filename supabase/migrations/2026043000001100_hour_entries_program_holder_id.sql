-- Add program_holder_id to hour_entries so the partner portal can filter
-- pending entries by the logged-in program holder's assigned apprentices.
ALTER TABLE public.hour_entries
  ADD COLUMN IF NOT EXISTS program_holder_id uuid REFERENCES public.program_holders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hour_entries_program_holder_id
  ON public.hour_entries(program_holder_id);

CREATE INDEX IF NOT EXISTS idx_hour_entries_status
  ON public.hour_entries(status);
