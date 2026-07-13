-- fk_program_enrollments_ap constrains program_enrollments.program_id to
-- apprenticeship_programs(id), which blocks enrollment in non-apprenticeship
-- programs (healthcare, HVAC, IT, etc.) that live in the programs table.
--
-- Fix: drop the restrictive FK and add a nullable reference to programs instead.
-- Existing rows referencing apprenticeship_programs are unaffected — program_id
-- values that exist in apprenticeship_programs will still be valid UUIDs.

ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS fk_program_enrollments_ap;

-- Also drop the unique constraint (backed by an index — must drop constraint not index)
ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS uq_program_enrollments_user_program;
