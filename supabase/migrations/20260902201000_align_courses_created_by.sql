-- Align repository schema with the canonical production courses audit actor.
-- Production already contains this nullable UUID column; IF NOT EXISTS keeps
-- the migration idempotent across environments restored from production.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS created_by uuid;

COMMENT ON COLUMN public.courses.created_by IS
  'User or system actor that created the course; used as the automated publication audit fallback.';
