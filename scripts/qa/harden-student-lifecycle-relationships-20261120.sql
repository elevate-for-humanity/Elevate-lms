-- Isolated QA-only follow-up for the canonical application-to-program relationship.
-- Applied to isdgjcdabhxxozarmxta as migration 20261120081444.
-- Refuses production, populated fixtures, partial state, or replay.
BEGIN;

DO $qa$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.tenants WHERE slug = 'elevate-lms-qa'
  ) THEN
    RAISE EXCEPTION 'QA lifecycle relationship refused: isolated QA tenant marker is absent';
  END IF;
  IF to_regclass('public.applications') IS NULL
     OR to_regclass('public.programs') IS NULL THEN
    RAISE EXCEPTION 'QA lifecycle relationship refused: required tables are absent';
  END IF;
  IF EXISTS (SELECT 1 FROM public.applications) THEN
    RAISE EXCEPTION 'QA lifecycle relationship refused: applications is not empty';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.applications'::regclass
      AND conname = 'applications_program_id_fkey'
  ) THEN
    RAISE EXCEPTION 'QA lifecycle relationship refused: canonical foreign key already exists';
  END IF;
END
$qa$;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES public.programs(id);

COMMIT;
