-- Shared mixed-provider testing availability.
-- One row represents the room-wide capacity across every provider, preventing
-- the same six physical seats from being multiplied by provider count.

COMMENT ON COLUMN public.testing_slots.exam_type IS
  'Canonical provider key, or all for a shared mixed-provider appointment window';

CREATE INDEX IF NOT EXISTS idx_testing_slots_shared_time
  ON public.testing_slots (start_time)
  WHERE exam_type = 'all' AND is_cancelled = false;
