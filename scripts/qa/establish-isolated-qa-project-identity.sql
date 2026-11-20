-- Establish the immutable identity anchor for the isolated browser-QA project.
-- Apply only through the Supabase control plane with project_id
-- isdgjcdabhxxozarmxta. Application workflows never execute this bootstrap.
BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC,anon;

CREATE TABLE IF NOT EXISTS private.qa_environment_identity (
  project_ref text PRIMARY KEY,
  established_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT qa_environment_identity_exact_ref
    CHECK (project_ref = 'isdgjcdabhxxozarmxta')
);

REVOKE ALL ON private.qa_environment_identity FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON private.qa_environment_identity TO service_role;

INSERT INTO private.qa_environment_identity(project_ref)
VALUES ('isdgjcdabhxxozarmxta')
ON CONFLICT (project_ref) DO NOTHING;

DO $qa$
BEGIN
  IF (SELECT count(*) FROM private.qa_environment_identity) <> 1
     OR NOT EXISTS (
       SELECT 1 FROM private.qa_environment_identity
       WHERE project_ref = 'isdgjcdabhxxozarmxta'
     ) THEN
    RAISE EXCEPTION 'ISOLATED_QA_PROJECT_IDENTITY_NOT_ESTABLISHED';
  END IF;
END; $qa$;

COMMIT;
