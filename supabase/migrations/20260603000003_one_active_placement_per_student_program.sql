-- Enforce one active placement per student+program at a time.
-- The existing unique key (student_id, shop_id, program_slug) prevents
-- duplicate rows at the same shop, but allows two active rows at different
-- shops for the same program. This partial index closes that gap.
--
-- canCompleteLesson reads the first active placement it finds — if two exist,
-- the gate behavior is undefined. This constraint makes that impossible.
--
-- To reassign a student to a different shop, the old placement must be set
-- to status != 'active' first (the assign-shop-placement route does this).

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_placement_per_student_program
  ON public.apprentice_placements (student_id, program_slug)
  WHERE status = 'active';

COMMENT ON INDEX idx_one_active_placement_per_student_program
  IS 'Enforces one active shop placement per student per program. Reassignment requires deactivating the prior placement first.';
