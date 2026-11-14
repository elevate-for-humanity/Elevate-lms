-- progress_entries.hours_worked constraint was set to <= 8 (single shift max)
-- but the table also stores weekly summary rows which can be up to 40 hrs.
-- Widen the check to <= 40 (max hours per week per DOL apprenticeship rules).

ALTER TABLE public.progress_entries
  DROP CONSTRAINT IF EXISTS progress_entries_hours_valid;

ALTER TABLE public.progress_entries
  ADD CONSTRAINT progress_entries_hours_valid
    CHECK (hours_worked >= 0 AND hours_worked <= 40);
